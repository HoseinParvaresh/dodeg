import { ADS, STAR_AD } from './config.js';
import { Platform } from './platform.js';
import { SaveStore } from './storage.js';
import { LEVELS } from './levels.js';

// مدیریت تبلیغ پاداشی (تپسل). فقط با Platform.ads حرف می‌زند.
//
// قاعده‌ی طلایی: پاداش فقط وقتی داده می‌شود که نتیجه‌ی نمایش REWARDED باشد
// (یعنی SDK گفته تبلیغ کامل دیده شده)، نه صرفاً «تبلیغ بسته شد».
//
// نتیجه‌ی show():  { status: 'REWARDED' | 'CLOSED' | 'ERROR' | 'NOT_READY' | 'BUSY' | 'UNSUPPORTED' }

const PLACEMENTS = ['continue', 'stars', 'unlockAll'];

export class AdsManager {
    constructor(game) {
        this.game = game;
        this.inited = false;
        this.busy = false;                    // الان تبلیغی در حال نمایش است
        this.cache = {};                      // placement → { adId, ts } | { loading: true }
        this.fails = {};                      // placement → تعداد شکست پشت‌سرهم
        this.timers = {};
        this.listeners = new Set();
        this.init();
    }

    get supported() { return Platform.canShowAds; }

    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    _notify() {
        this.listeners.forEach(fn => { try { fn(); } catch { } });
        this.game.ui && this.game.ui.onAdsStateChanged && this.game.ui.onAdsStateChanged();
    }

    async init() {
        if (!this.supported) return;
        try {
            await Platform.ads.init();
            this.inited = true;
        } catch (e) {
            console.warn('[ads] init failed:', e.code, e.message);
            return;
        }
        PLACEMENTS.forEach(p => this.prepare(p));
        // تبلیغ آماده‌ی قدیمی را تازه می‌کند
        setInterval(() => PLACEMENTS.forEach(p => this.prepare(p)), 30000);
    }

    // آیا این placement الان به تبلیغ آماده نیاز دارد؟
    _wanted(p) {
        if (p === 'unlockAll') return !this.isAllUnlocked();
        return true;
    }

    isReady(p) {
        const c = this.cache[p];
        return !!(c && c.adId && Date.now() - c.ts < ADS.cacheTtlMs);
    }

    isLoading(p) { return !!(this.cache[p] && this.cache[p].loading); }

    async prepare(p) {
        if (!this.inited || this.busy || !this._wanted(p)) return;
        if (this.isReady(p) || this.isLoading(p)) return;

        this.cache[p] = { loading: true };
        this._notify();
        try {
            const r = await Platform.ads.request(ADS.zones[p]);
            if (!r || !r.adId) throw Object.assign(new Error('empty adId'), { code: 'NO_FILL' });
            this.cache[p] = { adId: r.adId, ts: Date.now() };
            this.fails[p] = 0;
        } catch (e) {
            this.cache[p] = null;
            const n = this.fails[p] = (this.fails[p] || 0) + 1;
            console.warn(`[ads] request(${p}) failed:`, e.code, e.message);
            if (n <= ADS.maxRetries) {
                clearTimeout(this.timers[p]);
                this.timers[p] = setTimeout(() => this.prepare(p), Math.min(60000, 4000 * 2 ** (n - 1)));
            }
        }
        this._notify();
    }

    async show(p) {
        if (!this.supported || !this.inited) return { status: 'UNSUPPORTED' };
        if (this.busy) return { status: 'BUSY' };
        if (!this.isReady(p)) { this.prepare(p); return { status: 'NOT_READY' }; }

        const { adId } = this.cache[p];
        this.cache[p] = null;                 // هر تبلیغ فقط یک‌بار قابل نمایش است
        this.busy = true;
        this._notify();
        this._pauseAudio();

        let opened = false;
        const off = Platform.ads.onOpened(() => { opened = true; });
        let timer;
        const watchdog = new Promise((_, reject) => {
            timer = setTimeout(() => {
                if (!opened) reject(Object.assign(new Error('ad did not open'), { code: 'OPEN_TIMEOUT' }));
            }, ADS.openTimeoutMs);
        });

        let outcome;
        try {
            const r = await Promise.race([Platform.ads.show(adId), watchdog]);
            outcome = { status: r && r.rewarded ? 'REWARDED' : 'CLOSED' };
        } catch (e) {
            console.warn('[ads] show failed:', e.code, e.message);
            outcome = { status: 'ERROR', code: e.code };
        } finally {
            clearTimeout(timer);
            off();
            this.busy = false;
            this._resumeAudio();
            setTimeout(() => this.prepare(p), 600);   // تبلیغ بعدی را از قبل می‌گیریم
            this._notify();
        }
        return outcome;
    }

    _pauseAudio() {
        const el = this.game.audio && this.game.audio.audioEl;
        if (el) try { el.pause(); } catch { }
    }

    _resumeAudio() {
        if (this.game.audio) this.game.audio.syncMusic();
    }

    /* ---------------- پاداش یک‌بارمصرف فروشگاه ---------------- */

    isAllUnlocked() { return this.game.save.unlockedLevel >= LEVELS.length; }

    /* ---------------- باز کردن همه‌ی مراحل با تبلیغ ---------------- */

    // نتیجه: همان status های show()  (یا 'CLAIMED' اگر همه‌ی مراحل از قبل باز بوده)
    async claimUnlockAll() {
        const g = this.game;
        if (this.isAllUnlocked()) return { status: 'CLAIMED' };
        if (!this.supported) {
            g.showToast('AVAILABLE IN THE ANDROID APP');
            return { status: 'UNSUPPORTED' };
        }

        const res = await this.show('unlockAll');

        if (res.status === 'REWARDED') {
            if (!this.isAllUnlocked()) {
                g.save.unlockedLevel = LEVELS.length;
                SaveStore.save(g.save);
                g.audio.playWin();
                g.audio.vibrate([30, 50, 40]);
                g.showToast('ALL LEVELS UNLOCKED');
            }
        } else if (res.status === 'CLOSED') {
            g.showToast('WATCH THE FULL AD TO UNLOCK');
        } else if (res.status === 'NOT_READY' || res.status === 'BUSY') {
            g.showToast('AD NOT READY YET - TRY AGAIN IN A MOMENT');
        } else {
            g.showToast('AD FAILED - TRY AGAIN LATER');
        }
        return res;
    }

    // نتیجه: همان status های show()  (یا 'CLAIMED' اگر قبلاً گرفته شده)
    async claimShopReward() {
        const g = this.game;
        if (this.isShopRewardClaimed()) return { status: 'CLAIMED' };

        const res = await this.show('shopReward');

        if (res.status === 'REWARDED') {
            // بعد از await دوباره چک می‌کنیم تا هیچ‌وقت دو بار پاداش داده نشود
            if (!this.isShopRewardClaimed()) {
                g.save.adShopRewardClaimed = true;
                g.save.stars += SHOP_REWARD_AD.stars;
                SaveStore.save(g.save);
                g.audio.playWin();
                g.audio.vibrate([30, 50, 40]);
                g.ui.refreshHomeUI();
                g.showToast(`+${SHOP_REWARD_AD.stars.toLocaleString('fa-IR')} ★ هدیه گرفتی!`);
                if (g.state !== 'MENU') g.updateHUD();
            }
        } else if (res.status === 'CLOSED') {
            g.showToast('تبلیغ کامل دیده نشد؛ پاداشی داده نشد');
        } else if (res.status === 'NOT_READY' || res.status === 'BUSY') {
            g.showToast('AD NOT READY YET - TRY AGAIN IN A MOMENT');
        } else {
            g.showToast('AD FAILED - TRY AGAIN LATER');
        }
        return res;
    }

    /* ---------------- ستاره‌ی رایگان با تبلیغ (تکرارپذیر) ---------------- */

    // نتیجه: همان status های show()
    async claimStars() {
        const g = this.game;
        if (!this.supported) return { status: 'UNSUPPORTED' };

        const res = await this.show('stars');
        if (res.status === 'REWARDED') {
            g.save.stars += STAR_AD.stars;
            SaveStore.save(g.save);
            g.audio.playWin();
            g.audio.vibrate([30, 50, 40]);
            g.showToast(`+${STAR_AD.stars} ★`);
            g.ui.refreshHomeUI();
            if (g.state !== 'MENU') g.updateHUD();
        }
        return res;
    }
}

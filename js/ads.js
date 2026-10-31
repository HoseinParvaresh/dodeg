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
// فاصله‌ی تلاش‌های مجدد بعد از شکست؛ بعد از آخرین عدد هر ۲۰ ثانیه تکرار می‌شود
const RETRY_STEPS_MS = [3000, 6000, 12000, 20000];

// نکته‌ی مهم: تبلیغ‌ها بر اساس «zone» نگه‌داری می‌شوند نه بر اساس جایگاه (continue / stars / unlockAll).
// اگر چند جایگاه یک zone مشترک داشته باشند (مثل zone تست)، فقط یک درخواست می‌رود و هر جایگاهی
// که اول نیاز داشت از همان تبلیغ استفاده می‌کند. (تپسل به درخواست‌های هم‌زمانِ یک zone ممکن است جواب ندهد.)
export class AdsManager {
    constructor(game) {
        this.game = game;
        this.inited = false;
        this.busy = false;                    // الان تبلیغی در حال نمایش است
        this.pool = {};                       // zoneId → { adId, ts } | { loading: true, token }
        this.fails = {};                      // zoneId → تعداد شکست پشت‌سرهم
        this.timers = {};
        this.lastError = '';                  // آخرین کد خطای درخواست (برای نشان دادن به بازیکن/عیب‌یابی)
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
        this._prepareAll();
        // تبلیغ آماده‌ی قدیمی را تازه می‌کند
        setInterval(() => this._prepareAll(), 30000);
    }

    zoneOf(p) { return ADS.zones[p]; }

    // آیا این placement الان به تبلیغ آماده نیاز دارد؟
    _wanted(p) {
        if (p === 'unlockAll') return !this.isAllUnlocked();
        return true;
    }

    _prepareAll() {
        new Set(PLACEMENTS.filter(p => this._wanted(p)).map(p => this.zoneOf(p))).forEach(z => this._prepareZone(z));
    }

    isReady(p) {
        const c = this.pool[this.zoneOf(p)];
        return !!(c && c.adId && Date.now() - c.ts < ADS.cacheTtlMs);
    }

    isLoading(p) {
        const c = this.pool[this.zoneOf(p)];
        return !!(c && c.loading);
    }

    // 'ready' | 'loading' | 'failed' — برای نشان دادن وضعیت دکمه‌ها
    statusOf(p) {
        if (this.isReady(p)) return 'ready';
        if (this.isLoading(p)) return 'loading';
        return 'failed';
    }

    prepare(p) { return this._prepareZone(this.zoneOf(p)); }

    // تلاش فوری دوباره (مثلاً وقتی بازیکن روی «TAP TO RETRY» می‌زند)
    retry(p) {
        const z = this.zoneOf(p);
        clearTimeout(this.timers[z]);
        return this._prepareZone(z);
    }

    async _prepareZone(zone) {
        if (!this.inited || this.busy) return;
        const c = this.pool[zone];
        if (c && (c.loading || (c.adId && Date.now() - c.ts < ADS.cacheTtlMs))) return;

        const token = {};
        this.pool[zone] = { loading: true, token };
        this._notify();

        const sim = Platform.isSim && window.__DODGE_SIM__;
        const timeoutMs = (sim && sim.requestTimeoutMs) || ADS.requestTimeoutMs;
        let timer;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => reject(Object.assign(new Error('request timeout'), { code: 'TIMEOUT' })), timeoutMs);
        });

        try {
            const r = await Promise.race([Platform.ads.request(zone), timeout]);
            if (!r || !r.adId) throw Object.assign(new Error('empty adId'), { code: 'NO_FILL' });
            if (this.pool[zone] && this.pool[zone].token !== token) return;   // نتیجه‌ی کهنه
            this.pool[zone] = { adId: r.adId, ts: Date.now() };
            this.fails[zone] = 0;
            this.lastError = '';
        } catch (e) {
            if (this.pool[zone] && this.pool[zone].token !== token) return;
            this.pool[zone] = null;
            const n = this.fails[zone] = (this.fails[zone] || 0) + 1;
            this.lastError = e.code || 'ERROR';
            console.warn(`[ads] request(${zone}) failed:`, e.code, e.message);
            clearTimeout(this.timers[zone]);
            this.timers[zone] = setTimeout(() => this._prepareZone(zone), RETRY_STEPS_MS[Math.min(n - 1, RETRY_STEPS_MS.length - 1)]);
        } finally {
            clearTimeout(timer);
        }
        this._notify();
    }

    async show(p) {
        if (!this.supported || !this.inited) return { status: 'UNSUPPORTED' };
        if (this.busy) return { status: 'BUSY' };
        const zone = this.zoneOf(p);
        if (!this.isReady(p)) { this.retry(p); return { status: 'NOT_READY' }; }

        const { adId } = this.pool[zone];
        this.pool[zone] = null;               // هر تبلیغ فقط یک‌بار قابل نمایش است
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
            setTimeout(() => this._prepareAll(), 600);   // تبلیغ بعدی را از قبل می‌گیریم
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

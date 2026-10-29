import { STAR_PACKS } from './shop.js';
import { SaveStore } from './storage.js';
import { Platform } from './platform.js';

// پرداخت درون‌برنامه‌ای (بازار / مایکت) — این کلاس فقط با Platform.billing حرف می‌زند
// و نمی‌داند فروشگاه کدام است.
//
// اصول:
//  ۱) پاداش فقط بعد از «موفقیت واقعی» فروشگاه و با توکن غیرخالی داده می‌شود.
//  ۲) هر توکن فقط یک‌بار پاداش می‌دهد (purchaseHistory) → کرش، دوبار-کلیک یا بازیابی باعث دوبل‌شدن نمی‌شود.
//  ۳) اول پاداش ذخیره می‌شود، بعد consume (برای بسته‌های ستاره). اگر consume خطا داد، شروع بعدی دوباره تلاش می‌شود.
//  ۴) در هر شروع بازی خریدهای مصرف‌نشده خوانده می‌شود (خریدِ نیمه‌کاره + بازیابی پک‌های دائمی بعد از نصب مجدد).

const TXT = {
    web: 'خرید درون‌برنامه‌ای فقط در نسخه‌ی اندروید (بازار / مایکت) فعال است.',
    busy: 'در حال پرداخت…',
    canceled: 'پرداخت لغو شد',
    failed: 'پرداخت انجام نشد؛ دوباره تلاش کنید.',
    restored: 'خرید قبلی شما بازیابی شد ✓',
    owned: 'این خرید قبلاً انجام شده و بازیابی شد ✓',
    noToken: 'پاسخ فروشگاه نامعتبر بود؛ اگر پول کم شده، بازی را ببندید و دوباره باز کنید.'
};

export class BillingManager {
    constructor(game) {
        this.game = game;
        this.busy = false;
        this.connected = false;
        this.prices = {};
        this._queue = Promise.resolve();
        this._buildBusyOverlay();
        this.startup();
    }

    get save() { return this.game.save; }

    packBySku(sku) { return STAR_PACKS.find(p => p.sku === sku); }

    isOwned(pack) {
        const s = this.save;
        return (pack.id === 'starter_bundle' && !!s.starterPackBought) ||
               (pack.id === 'vip_doubler' && !!s.vipDoubler);
    }

    // قیمتِ خودِ فروشگاه (اگر گرفته شده باشد) وگرنه قیمت ثابتِ داخل shop.js
    priceFor(pack) { return this.prices[pack.sku] || pack.priceText; }

    hasToken(token) {
        return (this.save.purchaseHistory || []).some(p => p.token === token);
    }

    /* ---------------- شروع ---------------- */

    async startup() {
        if (!Platform.canPurchase) return;
        try {
            await Platform.billing.connect();
            this.connected = true;
        } catch (e) {
            console.warn('[billing] connect failed:', e.code, e.message);
            return;
        }
        this.loadPrices();
        await this.reconcile();
    }

    async loadPrices() {
        try {
            const r = await Platform.billing.skuDetails(STAR_PACKS.map(p => p.sku));
            (r.items || []).forEach(i => { if (i && i.sku && i.price) this.prices[i.sku] = String(i.price); });
            this.game.ui && this.game.ui.onStoreDataChanged && this.game.ui.onStoreDataChanged();
        } catch (e) {
            console.warn('[billing] skuDetails failed:', e.code, e.message);
        }
    }

    // خریدهای مصرف‌نشده را از فروشگاه می‌خواند و (در صورت نیاز) تحویل و consume می‌کند
    reconcile() {
        return this._serial(async () => {
            let list;
            try {
                const r = await Platform.billing.queryPurchases();
                list = (r && r.purchases) || [];
            } catch (e) {
                console.warn('[billing] queryPurchases failed:', e.code, e.message);
                return;
            }
            for (const p of list) {
                const pack = this.packBySku(p.sku);
                if (!pack || !p.purchaseToken) continue;
                await this._deliver(pack, p.purchaseToken, { restored: true });
            }
        });
    }

    /* ---------------- خرید ---------------- */

    async initiatePurchase(sku) {
        const pack = this.packBySku(sku);
        if (!pack || this.busy) return;
        if (pack.oneTime && this.isOwned(pack)) return;

        if (!Platform.canPurchase) {
            this.game.showToast(TXT.web);
            return;
        }

        this.busy = true;
        this._showBusy(true);
        try {
            if (!this.connected) {
                await Platform.billing.connect();
                this.connected = true;
            }
            const r = await Platform.billing.purchase(pack.sku, !!pack.consumable);
            if (!r || !r.purchaseToken) throw Object.assign(new Error('no token'), { code: 'NO_TOKEN' });
            await this._serial(() => this._deliver(pack, r.purchaseToken, { restored: false }));
        } catch (e) {
            await this._handleError(e);
        } finally {
            this.busy = false;
            this._showBusy(false);
        }
    }

    async _handleError(e) {
        const label = Platform.storeLabel;
        switch (e && e.code) {
            case 'CANCELED':
                this.game.showToast(TXT.canceled);
                break;
            case 'ALREADY_OWNED':
                await this.reconcile();
                this.game.showToast(TXT.owned);
                break;
            case 'STORE_MISSING':
                this.game.showToast(`برنامه‌ی ${label} روی گوشی نصب نیست یا اجرا نمی‌شود.`);
                break;
            case 'NOT_LOGGED_IN':
                this.game.showToast(`ابتدا وارد حساب ${label} شوید و دوباره تلاش کنید.`);
                break;
            case 'NO_TOKEN':
                this.game.showToast(TXT.noToken);
                break;
            default:
                console.warn('[billing] purchase failed:', e && e.code, e && e.message);
                this.game.showToast(TXT.failed);
        }
    }

    /* ---------------- تحویل پاداش ---------------- */

    // تحویل idempotent: توکنِ دیده‌شده دوباره پاداش نمی‌دهد، فقط consume می‌شود.
    async _deliver(pack, token, { restored }) {
        if (!this.hasToken(token)) {
            this._grant(pack, token, restored);
        } else {
            this._applyFlags(pack); // مثلاً بعد از پاک شدن بخشی از ذخیره
        }
        if (pack.consumable) {
            try {
                await Platform.billing.consume(token);
            } catch (e) {
                // خرید در فهرست فروشگاه می‌ماند و شروع بعدی دوباره consume می‌شود (پاداش دوباره داده نمی‌شود)
                console.warn('[billing] consume failed, will retry on next launch:', e.code, e.message);
            }
        }
    }

    _applyFlags(pack) {
        const s = this.save;
        let changed = false;
        if (pack.unlockShield) {
            if (!s.starterPackBought) { s.starterPackBought = true; changed = true; }
            if (!(s.perks.shield > 0)) { s.perks.shield = 1; changed = true; }
        }
        if (pack.enableDoubler && !s.vipDoubler) { s.vipDoubler = true; changed = true; }
        if (changed) { SaveStore.save(s); this._refreshUI(pack); }
    }

    _grant(pack, token, restored) {
        const g = this.game;
        const s = this.save;

        if (pack.stars > 0) s.stars += pack.stars;
        if (pack.unlockShield) {
            s.perks.shield = Math.max(1, s.perks.shield || 0);
            s.starterPackBought = true;
        }
        if (pack.enableDoubler) s.vipDoubler = true;

        if (!Array.isArray(s.purchaseHistory)) s.purchaseHistory = [];
        s.purchaseHistory.push({ sku: pack.sku, token, date: Date.now() });
        SaveStore.save(s);

        g.audio.playWin();
        g.audio.vibrate([30, 50, 40, 50, 60]);
        this._refreshUI(pack);
        g.showToast(restored ? TXT.restored : (pack.stars > 0 ? `+${pack.stars.toLocaleString('fa-IR')} ★ اضافه شد` : 'فعال شد ✓'));
    }

    _refreshUI(pack) {
        const g = this.game;
        g.ui.refreshHomeUI();
        g.ui.renderStarStoreModal(pack.id);
        if (g.state !== 'MENU') g.updateHUD();
    }

    /* ---------------- کمکی‌ها ---------------- */

    // عملیات‌ها پشت‌سرهم اجرا می‌شوند تا reconcile و خرید هم‌زمان پاداش دوبل ندهند
    _serial(fn) {
        const run = this._queue.then(fn, fn);
        this._queue = run.catch(() => { });
        return run;
    }

    _buildBusyOverlay() {
        const el = document.createElement('div');
        el.id = 'pay-busy';
        el.className = 'pay-busy hidden';
        el.innerHTML = `<div class="pay-busy-box"><div class="pay-spinner"></div><div>${TXT.busy}</div></div>`;
        (document.getElementById('app') || document.body).appendChild(el);
        this._busyEl = el;
    }

    _showBusy(on) {
        this._busyEl.classList.toggle('hidden', !on);
    }
}

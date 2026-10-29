// پل ارتباطی بین بازی (JS) و اندروید.
//
// سه حالت داریم:
//   'native' → داخل برنامه‌ی اندروید (Capacitor) که پلاگین DodgeStore (بازار/مایکت/تپسل) نصب است
//   'sim'    → فقط برای تست روی مرورگر با ?sim=1 ؛ خرید و تبلیغ را شبیه‌سازی می‌کند
//   'web'    → مرورگر معمولی؛ خرید و تبلیغ غیرفعال است (دیگر خرید رایگان داده نمی‌شود)
//
// قرارداد کامل متدهای پلاگین بومی در فایل native/BRIDGE.md آمده است.

const qs = new URLSearchParams(location.search);
const cap = window.Capacitor;
const inNativeShell = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());

let plugin = null;
if (inNativeShell) {
    try {
        plugin = typeof cap.registerPlugin === 'function'
            ? cap.registerPlugin('DodgeStore')
            : (cap.Plugins && cap.Plugins.DodgeStore) || null;
    } catch (e) {
        console.error('[Platform] DodgeStore plugin could not be registered', e);
    }
}

let mode = 'web';
if (plugin) mode = 'native';
else if (qs.get('sim') === '1') mode = 'sim';
if (inNativeShell && !plugin) console.error('[Platform] native shell without DodgeStore plugin: billing/ads disabled');

function normalizeError(e) {
    const code = (e && (e.code || e.errorCode)) || 'ERROR';
    const err = new Error((e && e.message) || String(e));
    err.code = String(code);
    return err;
}

async function call(method, data) {
    try {
        return await plugin[method](data || {});
    } catch (e) {
        throw normalizeError(e);
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* حالت native                                                          */
/* ------------------------------------------------------------------ */
const openedListeners = new Set();
let openedHooked = false;

function hookOpened() {
    if (openedHooked || !plugin || typeof plugin.addListener !== 'function') return;
    openedHooked = true;
    plugin.addListener('adOpened', (info) => openedListeners.forEach(fn => { try { fn(info); } catch { } }));
}

const nativeBilling = {
    connect: async () => {
        const r = await call('billingConnect');
        if (r && r.store) Platform.store = r.store;
        return r;
    },
    skuDetails: (skus) => call('billingSkuDetails', { skus }),
    purchase: (sku, consumable) => call('billingPurchase', { sku, consumable: !!consumable }),
    queryPurchases: () => call('billingQueryPurchases'),
    consume: (purchaseToken) => call('billingConsume', { purchaseToken })
};

const nativeAds = {
    init: () => { hookOpened(); return call('adsInit'); },
    request: (zoneId) => call('adsRequest', { zoneId }),
    show: (adId) => call('adsShow', { adId }),
    onOpened: (fn) => { openedListeners.add(fn); return () => openedListeners.delete(fn); }
};

/* ------------------------------------------------------------------ */
/* حالت sim (فقط تست)                                                   */
/* ------------------------------------------------------------------ */
// برای تست می‌توان از کنسول تغییرشان داد: window.__DODGE_SIM__.noFill = true
const sim = window.__DODGE_SIM__ = Object.assign({
    noFill: false,        // درخواست تبلیغ با NO_FILL رد شود
    failShow: false,      // نمایش تبلیغ با خطا رد شود
    adSeconds: 5,         // طول تبلیغ
    autoConfirm: false,   // خرید بدون پنجره‌ی تأیید
    autoWatch: false,     // تبلیغ خودش تا آخر دیده شود
    storeLabel: 'sim'
}, window.__DODGE_SIM__ || {});

const SIM_KEY = 'dodge_sim_owned';
const simRead = () => { try { return JSON.parse(localStorage.getItem(SIM_KEY) || '{}'); } catch { return {}; } };
const simWrite = (o) => { try { localStorage.setItem(SIM_KEY, JSON.stringify(o)); } catch { } };
let simAdSeq = 0;

function simError(code, message) {
    const e = new Error(message || code);
    e.code = code;
    return e;
}

const simBilling = {
    connect: async () => { await sleep(80); Platform.store = sim.storeLabel; return { ok: true, store: sim.storeLabel }; },
    skuDetails: async (skus) => ({ items: skus.map(s => ({ sku: s, price: null })) }),
    purchase: async (sku, consumable) => {
        await sleep(150);
        const ok = sim.autoConfirm || window.confirm(`[SIM] ${sku} را بخرم؟`);
        if (!ok) throw simError('CANCELED');
        const owned = simRead();
        if (!consumable && Object.values(owned).some(o => o.sku === sku)) throw simError('ALREADY_OWNED');
        const purchaseToken = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        owned[purchaseToken] = { sku, consumable: !!consumable };
        simWrite(owned);
        return { sku, purchaseToken, orderId: purchaseToken };
    },
    queryPurchases: async () => ({
        purchases: Object.entries(simRead()).map(([purchaseToken, o]) => ({ sku: o.sku, purchaseToken }))
    }),
    consume: async (purchaseToken) => {
        const owned = simRead();
        delete owned[purchaseToken];
        simWrite(owned);
        return {};
    }
};

const simAds = {
    init: async () => { await sleep(60); return {}; },
    request: async (zoneId) => {
        await sleep(350);
        if (sim.noFill) throw simError('NO_FILL', 'no fill');
        return { adId: `simad_${++simAdSeq}_${zoneId}` };
    },
    show: (adId) => new Promise((resolve, reject) => {
        if (sim.failShow) { setTimeout(() => reject(simError('SHOW_FAILED')), 200); return; }

        const root = document.createElement('div');
        root.id = 'sim-ad-overlay';
        root.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:sans-serif;direction:rtl;';
        root.innerHTML = `
            <div style="font-size:13px;opacity:.6">تبلیغ شبیه‌سازی‌شده (فقط تست)</div>
            <div id="sim-ad-count" style="font-size:54px;font-weight:700">${sim.adSeconds}</div>
            <button id="sim-ad-close" style="padding:10px 18px;border-radius:12px;border:1px solid #555;background:#222;color:#fff;font-size:14px">✕ بستن (قبل از پایان)</button>`;
        document.body.appendChild(root);
        openedListeners.forEach(fn => { try { fn({ adId }); } catch { } });

        let left = sim.adSeconds;
        let done = false;
        const finish = (rewarded) => {
            if (done) return;
            done = true;
            clearInterval(iv);
            root.remove();
            resolve({ rewarded, closedByUser: !rewarded });
        };
        const iv = setInterval(() => {
            left -= 1;
            const el = root.querySelector('#sim-ad-count');
            if (el) el.textContent = String(Math.max(0, left));
            if (left <= 0) finish(true);
        }, 1000);
        root.querySelector('#sim-ad-close').onclick = () => finish(false);
        if (sim.autoWatch) { left = 0; finish(true); }
    }),
    onOpened: (fn) => { openedListeners.add(fn); return () => openedListeners.delete(fn); }
};

/* ------------------------------------------------------------------ */
/* حالت web: همه‌چیز غیرفعال                                            */
/* ------------------------------------------------------------------ */
const disabled = (what) => async () => { throw simError('UNSUPPORTED', `${what} is not available on web`); };
const webBilling = {
    connect: disabled('billing'), skuDetails: disabled('billing'), purchase: disabled('billing'),
    queryPurchases: disabled('billing'), consume: disabled('billing')
};
const webAds = {
    init: disabled('ads'), request: disabled('ads'), show: disabled('ads'),
    onOpened: () => () => { }
};

export const Platform = {
    mode,
    store: mode === 'sim' ? sim.storeLabel : null, // 'bazaar' | 'myket' | 'sim' | null
    get isNative() { return mode === 'native'; },
    get isSim() { return mode === 'sim'; },
    get canPurchase() { return mode !== 'web'; },
    get canShowAds() { return mode !== 'web'; },
    // نام فروشگاه برای نمایش به کاربر
    get storeLabel() {
        return ({ bazaar: 'کافه‌بازار', myket: 'مایکت' })[this.store] || 'فروشگاه';
    },
    billing: mode === 'native' ? nativeBilling : (mode === 'sim' ? simBilling : webBilling),
    ads: mode === 'native' ? nativeAds : (mode === 'sim' ? simAds : webAds)
};

// پل ارتباطی بین بازی (JS) و اندروید — فقط تبلیغ.
//
// سه حالت داریم:
//   'native' → داخل برنامه‌ی اندروید (Capacitor) که پلاگین DodgeStore (تپسل) نصب است
//   'sim'    → فقط برای تست روی مرورگر با ?sim=1 ؛ تبلیغ را شبیه‌سازی می‌کند
//   'web'    → مرورگر معمولی؛ تبلیغ غیرفعال است (دکمه‌ها و پاپ‌آپ‌های تبلیغ نشان داده نمی‌شوند)
//
// قرارداد متدهای پلاگین بومی در فایل native/BRIDGE.md آمده است.

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
if (inNativeShell && !plugin) console.error('[Platform] native shell without DodgeStore plugin: ads disabled');

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

function makeError(code, message) {
    const e = new Error(message || code);
    e.code = code;
    return e;
}

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
    adSeconds: 5          // طول تبلیغ
}, window.__DODGE_SIM__ || {});

let simAdSeq = 0;

const simAds = {
    init: async () => { await sleep(60); return {}; },
    request: async (zoneId) => {
        await sleep(350);
        if (sim.noFill) throw makeError('NO_FILL', 'no fill');
        return { adId: `simad_${++simAdSeq}_${zoneId}` };
    },
    show: (adId) => new Promise((resolve, reject) => {
        if (sim.failShow) { setTimeout(() => reject(makeError('SHOW_FAILED')), 200); return; }

        const root = document.createElement('div');
        root.id = 'sim-ad-overlay';
        root.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:sans-serif;';
        root.innerHTML = `
            <div style="font-size:13px;opacity:.6">SIMULATED AD (TEST ONLY)</div>
            <div id="sim-ad-count" style="font-size:54px;font-weight:700">${sim.adSeconds}</div>
            <button id="sim-ad-close" style="padding:10px 18px;border-radius:12px;border:1px solid #555;background:#222;color:#fff;font-size:14px">✕ CLOSE EARLY</button>`;
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
    }),
    onOpened: (fn) => { openedListeners.add(fn); return () => openedListeners.delete(fn); }
};

/* ------------------------------------------------------------------ */
/* حالت web: تبلیغ غیرفعال                                              */
/* ------------------------------------------------------------------ */
const disabled = async () => { throw makeError('UNSUPPORTED', 'ads are not available on web'); };
const webAds = {
    init: disabled, request: disabled, show: disabled,
    onOpened: () => () => { }
};

export const Platform = {
    mode,
    get isNative() { return mode === 'native'; },
    get isSim() { return mode === 'sim'; },
    get canShowAds() { return mode !== 'web'; },
    ads: mode === 'native' ? nativeAds : (mode === 'sim' ? simAds : webAds)
};

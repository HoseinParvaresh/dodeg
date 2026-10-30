# قرارداد پلاگین اندروید (DodgeStore) — فقط تبلیغ

بازی (JS) فقط با یک پلاگین Capacitor به اسم **`DodgeStore`** حرف می‌زند. سمت JS: `js/platform.js` و `js/ads.js`.
پیاده‌سازی Kotlin: `native/android/common/DodgeStorePlugin.kt` (تپسل، طبق مستند رسمی).

```
game (JS) → ads.js → platform.js → Capacitor plugin "DodgeStore" (Kotlin) → Tapsell SDK
```

## متدها

| متد | ورودی | خروجی | خطاها (`code`) |
|---|---|---|---|
| `adsInit()` | – | `{}` | `ERROR` |
| `adsRequest({ zoneId })` | شناسه‌ی zone تپسل | `{ adId }` (همان شناسه‌ی تبلیغ تپسل) | `NO_FILL` `ERROR` |
| `adsShow({ adId })` | – | وقتی **تبلیغ بسته شد** resolve می‌شود: `{ rewarded: boolean, closedByUser: boolean }` | `SHOW_FAILED` `ERROR` |
| رویداد `adOpened` | `{ adId }` | از `onAdImpression` تپسل ارسال می‌شود | – |

## قواعد
- `rewarded: true` **فقط** وقتی که callback پاداش تپسل (`onRewarded`) صدا زده شده باشد. بستن تبلیغ بدون آن یعنی `rewarded: false`.
- `adsShow` بعد از `onAdClosed` حدود ۰٫۷ ثانیه صبر می‌کند تا اگر `onRewarded` دیر رسید از دست نرود.
- اگر ۲۵ ثانیه بعد از `adsShow` تبلیغ شروع نشود، با `SHOW_FAILED` رد می‌شود.
- هر `adId` فقط یک‌بار قابل نمایش است. JS بعد از هر نمایش خودش تبلیغ بعدی را می‌گیرد.

## جایگاه‌های تبلیغ (js/config.js → ADS.zones)
| نام | کاربرد |
|---|---|
| `continue` | ادامه‌ی بازی بعد از باخت |
| `stars` | ۳۰۰ ستاره‌ی رایگان (هر وقت ستاره کافی نبود؛ بدون محدودیت تعداد) |
| `unlockAll` | دکمه‌ی UNLOCK ALL |

## تست سمت JS بدون اندروید
آدرس `index.html?sim=1` تبلیغ را شبیه‌سازی می‌کند (فقط برای تست؛ بدون `?sim=1` مرورگر هیچ تبلیغ و پاداشی نمی‌دهد).
تنظیمات تست از کنسول: `window.__DODGE_SIM__ = { adSeconds: 3, noFill: false, failShow: false }`.

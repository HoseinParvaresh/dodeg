# قرارداد پلاگین اندروید (DodgeStore)

بازی (JS) فقط با یک پلاگین Capacitor به اسم **`DodgeStore`** حرف می‌زند. این فایل می‌گوید پلاگین بومی (Kotlin)
باید دقیقاً چه متدهایی داشته باشد. سمت JS (`js/platform.js`, `js/billing.js`, `js/ads.js`) کامل و تست‌شده است.

## معماری

```
game (JS) → billing.js / ads.js → platform.js → Capacitor plugin "DodgeStore" (Kotlin)
                                                   ├─ پرداخت بازار   (Poolakey)
                                                   ├─ پرداخت مایکت   (Myket IAB)
                                                   └─ تبلیغ تپسل     (Tapsell Plus SDK)
```

دو خروجی جدا می‌گیریم (build flavor): `bazaar` و `myket`. هر flavor فقط SDK فروشگاه خودش را دارد و
`billingConnect` اسم فروشگاه را برمی‌گرداند. تپسل در هر دو flavor هست.

## متدهای پرداخت

| متد | ورودی | خروجی | خطاهای ممکن (`code`) |
|---|---|---|---|
| `billingConnect()` | – | `{ ok: true, store: 'bazaar' \| 'myket' }` | `STORE_MISSING` |
| `billingSkuDetails({ skus })` | `skus: string[]` | `{ items: [{ sku, price }] }` (`price` متن قیمتِ آماده‌ی نمایش) | `ERROR` |
| `billingPurchase({ sku, consumable })` | – | `{ sku, purchaseToken, orderId }` | `CANCELED` `STORE_MISSING` `NOT_LOGGED_IN` `ALREADY_OWNED` `ERROR` |
| `billingQueryPurchases()` | – | `{ purchases: [{ sku, purchaseToken, orderId }] }` (فقط مصرف‌نشده‌ها) | `NOT_LOGGED_IN` `ERROR` |
| `billingConsume({ purchaseToken })` | – | `{}` | `ERROR` |

قواعدی که سمت JS به آن‌ها تکیه دارد:

- `billingPurchase` فقط وقتی resolve شود که پرداخت واقعاً موفق بوده و **توکن غیرخالی** دارد.
- توکن پک‌های دائمی (پک شروع و VIP) هرگز consume نمی‌شود؛ فقط بسته‌های ستاره (`consumable: true`).
- اعتبارسنجی امضا با کلید RSA فروشگاه باید **داخل پلاگین** انجام شود؛ کلید RSA را در `BuildConfig` هر flavor بگذارید، نه در JS.

## متدهای تبلیغ

| متد | ورودی | خروجی | خطاها |
|---|---|---|---|
| `adsInit()` | – | `{}` | `ERROR` |
| `adsRequest({ zoneId })` | شناسه‌ی zone تپسل | `{ adId }` (همان responseId تپسل) | `NO_FILL` `ERROR` |
| `adsShow({ adId })` | – | وقتی **تبلیغ بسته شد** resolve می‌شود: `{ rewarded: boolean, closedByUser: boolean }` | `SHOW_FAILED` `ERROR` |
| رویداد `adOpened` | `{ adId }` | از طریق `notifyListeners('adOpened', ...)` | – |

قواعد:

- `rewarded: true` **فقط** وقتی که callback پاداش تپسل (`onRewarded`) صدا زده شده باشد. بستن تبلیغ بدون آن یعنی `rewarded: false`.
- `adsShow` باید تا بسته‌شدن کامل تبلیغ pending بماند (بعد از `onClosed`)، یا با `onError` reject شود.
- رویداد `adOpened` باید در `onOpened` ارسال شود؛ اگر تا ۱۵ ثانیه نیاید JS نمایش را شکست حساب می‌کند.
- هر `adId` فقط یک‌بار قابل نمایش است. JS بعد از هر نمایش خودش تبلیغ بعدی را می‌گیرد.

## کدهای خطا

`CANCELED` (کاربر لغو کرد)، `STORE_MISSING` (اپ بازار/مایکت نصب نیست)، `NOT_LOGGED_IN` (کاربر وارد حساب فروشگاه نیست)،
`ALREADY_OWNED`، `NO_FILL`، `SHOW_FAILED`، `ERROR`. خطا را با `call.reject(message, code)` برگردانید.

## نکته‌هایی از مستندات

**بازار:** اتصال و قطع اتصال باید جفت باشند؛ `consume` و گرفتن لیست خریدها فقط وقتی کاربر در بازار لاگین باشد کار می‌کند؛
محصولات اشتراکی قابل consume نیستند (ما اشتراک نداریم).
**مایکت:** package name برنامه باید دقیقاً با چیزی که در پنل رزرو کرده‌اید یکی باشد؛ در `build.gradle` باید `manifestPlaceholders`
(`marketApplicationId`, `marketBindAddress`, `marketPermission`) تنظیم شود؛ خرید مصرفی بعد از تحویل باید فوراً consume شود.
**تپسل:** روال: initialize → درخواست تبلیغ با zoneId و گرفتن responseId → نمایش با همان responseId →
callbackهای `onOpened` / `onClosed` / `onRewarded` / `onError`.

## پیاده‌سازی

کدهای Kotlin این قرارداد در `native/android/` است و با `npm run install-native` داخل پروژه‌ی اندروید کپی می‌شود
(راهنمای کامل: `native/SETUP.md`). نکات پیاده‌سازی:

- `billingSkuDetails` فعلاً لیست خالی برمی‌گرداند؛ قیمت‌ها از `js/shop.js` نمایش داده می‌شود.
- رویداد `adOpened` از `onAdImpression` تپسل ارسال می‌شود.
- `adsShow` بعد از `onAdClosed` حدود ۰٫۷ ثانیه صبر می‌کند تا اگر `onRewarded` دیر رسید از دست نرود؛
  `rewarded` فقط با `onRewarded` true می‌شود (نه با COMPLETED).
- اگر ۲۵ ثانیه بعد از `adsShow` تبلیغ شروع نشود، با `SHOW_FAILED` رد می‌شود.

## تست سمت JS بدون اندروید

آدرس `index.html?sim=1` پرداخت و تبلیغ را شبیه‌سازی می‌کند (فقط برای تست؛ بدون `?sim=1` مرورگر هیچ خرید رایگانی نمی‌دهد).
تنظیمات تست از کنسول: `window.__DODGE_SIM__ = { adSeconds: 3, autoConfirm: true, noFill: false, failShow: false }`.

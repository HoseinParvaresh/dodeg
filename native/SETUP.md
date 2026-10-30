# ساخت نسخه‌ی اندروید روی کامپیوتر خودت (اختیاری)

> اگر Android Studio نداری، از **ساخت ابری** استفاده کن: `native/CLOUD_BUILD.md` (ساده‌تر است).
> کد Kotlin کامپایل‌شده و روی گوشی تست شده (ساخت ابری موفق بود و تبلیغ تست پخش شد).

## پیش‌نیازها
Node.js 20+، Android Studio، JDK 21 (برای Capacitor 7)، و یک گوشی اندروید با USB debugging.

## مراحل
1. `capacitor.config.json`: مقدار `appId` را `ir.hparvaresh.dodge` بگذار.
2. نصب و ساخت:
   ```
   npm install @capacitor/core@7 @capacitor/cli@7 @capacitor/android@7
   npm run web
   npx cap add android
   npm run install-native
   ```
3. تنظیمات Gradle را خودکار اعمال کن (نسخه‌ی تپسل را از نشان Maven Central صفحه‌ی Quick Start تپسل بردار):
   ```
   TAPSELL_VERSION=عدد-نسخه node scripts/patch-gradle.mjs
   ```
   (در ویندوز PowerShell: `$env:TAPSELL_VERSION="عدد-نسخه"; node scripts/patch-gradle.mjs`)
4. `npm run open` و در Android Studio روی Run بزن.

بعد از هر تغییر در بازی: `npm run sync`.

## کلید و zone
در `js/config.js` فعلاً zone تست تپسل است و در Gradle کلید تست. قبل از انتشار هر دو را با مقدارهای واقعی پنل تپسل عوض کن.

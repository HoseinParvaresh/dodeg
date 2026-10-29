# راه‌اندازی نسخه‌ی اندروید (بازار و مایکت)

> ⚠️ **وضعیت صادقانه:** سمت JS (پرداخت، تبلیغ، صفحه‌ی ادامه، UNLOCK ALL، فونت‌ها) با ۵۴ تست خودکار روی شبیه‌ساز تست شده.
> کدهای Kotlin داخل `native/android/` طبق مستندات رسمی نوشته شده‌اند ولی **کامپایل و روی گوشی تست نشده‌اند**
> (محیط من Android SDK و اینترنت ندارد). اگر Android Studio خطایی داد، متن دقیق خطا را برای من بفرستید.

## پیش‌نیازها
- Node.js 20 به بالا، Android Studio، JDK 17
- گوشی واقعی اندروید با **اپ بازار یا مایکت نصب‌شده و واردشده به حساب** (پرداخت روی شبیه‌ساز کار نمی‌کند)

## ۱) نصب Capacitor
از داخل پوشه‌ی پروژه:
```
npm install @capacitor/core @capacitor/cli @capacitor/android
```

## ۲) package name
فایل `capacitor.config.json` را باز کنید و `appId` را دقیقاً برابر package name ای بگذارید که در پنل **بازار و مایکت** ثبت کرده‌اید
(مایکت اجبار دارد که یکی باشد). مقدار فعلی `com.dodge.game` فقط نمونه است.

## ۳) ساخت پروژه‌ی اندروید
```
npm run web
npx cap add android
```

## ۴) کپی کدهای بومی
```
npm run install-native
```
این دستور پکیج را از `MainActivity` می‌خواند، فایل‌های Kotlin را در جای درست (`main`، `bazaar`، `myket`) می‌گذارد
و `DodgeStorePlugin` را در `MainActivity` ثبت می‌کند.

## ۵) ویرایش Gradle (دستی)

**الف) `android/build.gradle`** — داخل `allprojects { repositories { ... } }` این دو خط را اضافه کنید
(مخزن تپسل طبق مستند Quick Start؛ JitPack برای Poolakey اگر لازم شد):
```groovy
maven { url "https://maven.tapsell.ir" }
maven { url "https://jitpack.io" }
```

**ب) Kotlin:** چون فایل‌های `.kt` اضافه شده، Android Studio بالای فایل نوار «Kotlin not configured» نشان می‌دهد؛
روی **Configure** و بعد **All modules** بزنید تا خودش افزونه را اضافه کند. اگر نشد دستی:
در `android/build.gradle` بخش `buildscript → dependencies` خط
`classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:<نسخه‌ی Kotlin>"` و در `android/app/build.gradle` خط
`apply plugin: 'kotlin-android'` و داخل `android { }` بلوک `kotlinOptions { jvmTarget = "17" }`.

**ج) `android/app/build.gradle`** — این‌ها را اضافه کنید:
```groovy
android {
    defaultConfig {
        // کلید برنامه از پنل تپسل؛ مقدار پیش‌فرض «کلید تست» تپسل است
        manifestPlaceholders = [
            TapsellMediationAppKey: (project.findProperty("TAPSELL_APP_KEY") ?: "76798342-99a7-4a5f-bf5a-60a088d5dcfb")
        ]
    }
    buildFeatures { buildConfig true }

    flavorDimensions "store"
    productFlavors {
        bazaar {
            dimension "store"
            buildConfigField "String", "STORE_RSA_KEY", "\"${project.findProperty('BAZAAR_RSA_KEY') ?: ''}\""
        }
        myket {
            dimension "store"
            buildConfigField "String", "STORE_RSA_KEY", "\"${project.findProperty('MYKET_RSA_KEY') ?: ''}\""
        }
    }
}

dependencies {
    implementation "ir.tapsell:tapsell:${project.property('TAPSELL_VERSION')}"
    implementation "ir.tapsell.mediation.adapter:legacy:${project.property('TAPSELL_VERSION')}"
    bazaarImplementation project.property('POOLAKEY_DEP')
}
```
(حداقل‌ها طبق مستند تپسل: `minSdk 21`، `compileSdk 35`، Android Gradle Plugin ‏7.4.2 به بالا.)

**د) `android/gradle.properties`** — این خطوط را اضافه کنید:
```
# آخرین نسخه‌ی کتابخانه‌ی تپسل را از صفحه‌ی Quick Start (نشان Maven Central) بردارید
TAPSELL_VERSION=PUT_LATEST_VERSION_HERE
TAPSELL_APP_KEY=76798342-99a7-4a5f-bf5a-60a088d5dcfb
# Poolakey: README رسمی می‌گوید ir.cafebazaar:poolakey ؛ اگر پیدا نشد از JitPack: com.github.cafebazaar.Poolakey:poolakey:<نسخه>
POOLAKEY_DEP=ir.cafebazaar:poolakey:PUT_LATEST_VERSION_HERE
# کلید RSA هر فروشگاه را از پنل همان فروشگاه بردارید
BAZAAR_RSA_KEY=
MYKET_RSA_KEY=
```

## ۶) zone های تپسل
در `js/config.js` فعلاً **zone تست** گذاشته شده تا همین‌طوری تبلیغ تست ببینید. قبل از انتشار، zone واقعی پنل تپسل را جایگزین کنید
و `TAPSELL_APP_KEY` را هم با کلید واقعی عوض کنید. (طبق مستند تپسل با کلید و zone تست، تبلیغ آزمایشی نمایش داده می‌شود.)

## ۷) فقط برای نسخه‌ی مایکت: کلاس‌های کمکی
مایکت کتابخانه‌ی Maven ندارد؛ باید فایل‌هایش را خودتان اضافه کنید (طبق صفحه‌ی «Implementing Myket In-App Purchase» در myket.ir/kb):
1. **TrivialDrive مایکت** را از همان صفحه دانلود کنید.
2. پوشه‌ی `util` آن را در `native/android/myket/util/` بگذارید.
3. فایل `IInAppBillingService.aidl` را در `native/android/myket/aidl/com/android/vending/billing/` بگذارید.
4. دوباره `npm run install-native` را اجرا کنید (پکیج فایل‌ها را خودش درست می‌کند).
5. اگر minify روشن است در proguard بنویسید: `-keep class com.android.vending.billing.** { *; }`

## ۸) ساخت و اجرا
```
npm run sync
npm run open
```
در Android Studio از **Build Variants** گزینه‌ی `bazaarDebug` یا `myketDebug` را انتخاب و روی گوشی اجرا کنید.
برای انتشار: `bazaarRelease` و `myketRelease` با keystore خودتان (دو فایل APK/AAB جدا).

## ۹) چک‌لیست تست روی گوشی
- [ ] بعد از باخت، تبلیغ آماده باشد → صفحه‌ی «ادامه» باز شود، تبلیغ تست پخش و بازی ادامه پیدا کند
- [ ] تبلیغ را وسط ببندید → پاداش نباشد
- [ ] فروشگاه ستاره → کارت «ستاره‌ی رایگان» → ۵۰۰ ستاره فقط یک‌بار
- [ ] `UNLOCK ALL ▶` فقط بعد از تبلیغ مراحل را باز کند
- [ ] خرید یک بسته‌ی ستاره: ستاره اضافه شود و دوباره قابل خرید باشد (consume)
- [ ] خرید پک شروع / VIP: یک‌بار قابل خرید؛ بعد از پاک کردن داده‌ی برنامه و باز کردن دوباره، بازیابی شود
- [ ] وسط پرداخت برنامه را ببندید و دوباره باز کنید → خرید نیمه‌کاره تحویل شود (دوبار نه)

## عیب‌یابی سریع
| نشانه | علت محتمل |
|---|---|
| «Unresolved reference» روی Poolakey | مخزن/نسخه‌ی `POOLAKEY_DEP` را چک کنید (JitPack) |
| «Unresolved reference» روی `Tapsell` | `TAPSELL_VERSION` پر نشده یا مخزن `maven.tapsell.ir` اضافه نشده |
| «method does not override» روی `handleOnActivityResult` | نسخه‌ی Capacitor شما آن را حذف کرده؛ نسخه را برای من بفرستید |
| پرداخت: «برنامه‌ی بازار/مایکت نصب نیست» | اپ فروشگاه نصب نیست یا وارد حساب نشده |
| تبلیغ نمی‌آید | `TAPSELL_VERSION`/کلید، یا اینترنت گوشی؛ لاگ‌کت با فیلتر `Tapsell` |
| در JS خطای `DodgeStore plugin missing` | `npm run install-native` اجرا نشده یا `registerPlugin` در MainActivity نیست |

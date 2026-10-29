// تنظیمات Gradle (تپسل، بازار، مایکت، Kotlin) را خودکار روی پروژه‌ی اندروید Capacitor اعمال می‌کند.
// در ساخت ابری (GitHub Actions) استفاده می‌شود تا نیازی به ویرایش دستی Gradle نباشد.
//
// متغیرهای محیطی:
//   TAPSELL_VERSION   (اجباری)
//   POOLAKEY_DEP      (اجباری)  مثل ir.cafebazaar:poolakey:2.x.x
//   TAPSELL_APP_KEY   (پیش‌فرض: کلید تست تپسل)
//   BAZAAR_RSA_KEY / MYKET_RSA_KEY (پیش‌فرض: خالی)
//   KOTLIN_VERSION    (پیش‌فرض: 2.1.21)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const env = process.env;
const TAPSELL_VERSION = env.TAPSELL_VERSION;
const POOLAKEY_DEP = env.POOLAKEY_DEP;
const TAPSELL_APP_KEY = env.TAPSELL_APP_KEY || '76798342-99a7-4a5f-bf5a-60a088d5dcfb';
const BAZAAR_RSA_KEY = env.BAZAAR_RSA_KEY || '';
const MYKET_RSA_KEY = env.MYKET_RSA_KEY || '';
const KOTLIN_VERSION = env.KOTLIN_VERSION || '2.1.21';

const die = (m) => { console.error('❌ ' + m); process.exit(1); };
if (!TAPSELL_VERSION) die('TAPSELL_VERSION مشخص نشده');
if (!POOLAKEY_DEP) die('POOLAKEY_DEP مشخص نشده');

const read = (p) => { if (!existsSync(p)) die(`${p} پیدا نشد`); return readFileSync(p, 'utf8'); };
const REPOS = `\n        maven { url "https://maven.tapsell.ir" }\n        maven { url "https://jitpack.io" }`;

/* ---------- android/build.gradle ---------- */
let root = read('android/build.gradle');
let reposDone = root.includes('maven.tapsell.ir');
if (!reposDone) {
    const re = /allprojects\s*\{\s*repositories\s*\{/;
    if (re.test(root)) { root = root.replace(re, (m) => m + REPOS); reposDone = true; }
}
if (!root.includes('kotlin-gradle-plugin')) {
    const re = /(classpath\s+['"]com\.android\.tools\.build:gradle:[^'"]+['"])/;
    if (!re.test(root)) die('خط classpath مربوط به Android Gradle Plugin در android/build.gradle پیدا نشد');
    root = root.replace(re, `$1\n        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}"`);
}
writeFileSync('android/build.gradle', root);

if (!reposDone) {
    // Capacitor جدیدتر ممکن است مخزن‌ها را در settings.gradle بگذارد
    let st = read('android/settings.gradle');
    const re = /dependencyResolutionManagement\s*\{\s*repositories\s*\{/;
    if (!re.test(st)) die('جای مناسب برای اضافه کردن مخزن تپسل پیدا نشد (build.gradle / settings.gradle)');
    if (!st.includes('maven.tapsell.ir')) st = st.replace(re, (m) => m + REPOS);
    writeFileSync('android/settings.gradle', st);
}
console.log('✓ android/build.gradle (مخزن‌ها + Kotlin)');

/* ---------- android/app/build.gradle ---------- */
let app = read('android/app/build.gradle');
if (app.includes('// dodge-patch')) {
    console.log('ℹ️ app/build.gradle قبلاً پچ شده بود');
} else {
    // 1) افزونه‌ی Kotlin
    const applyRe = /apply plugin:\s*['"]com\.android\.application['"]/;
    if (!applyRe.test(app)) die("خط apply plugin: 'com.android.application' پیدا نشد");
    app = app.replace(applyRe, (m) => `${m}\napply plugin: 'kotlin-android' // dodge-patch`);

    // 2) کلید برنامه‌ی تپسل
    const dcRe = /defaultConfig\s*\{/;
    if (!dcRe.test(app)) die('بلوک defaultConfig پیدا نشد');
    app = app.replace(dcRe, (m) => `${m}\n        manifestPlaceholders = [TapsellMediationAppKey: "${TAPSELL_APP_KEY}"]`);

    // 3) flavor ها و BuildConfig
    const flavors = `    buildFeatures { buildConfig true }

    flavorDimensions "store"
    productFlavors {
        bazaar {
            dimension "store"
            buildConfigField "String", "STORE_RSA_KEY", "\\"${BAZAAR_RSA_KEY}\\""
        }
        myket {
            dimension "store"
            buildConfigField "String", "STORE_RSA_KEY", "\\"${MYKET_RSA_KEY}\\""
        }
    }

`;
    const btRe = /\n(\s*)buildTypes\s*\{/;
    if (btRe.test(app)) app = app.replace(btRe, (m) => `\n${flavors}${m.slice(1)}`);
    else {
        const aRe = /\nandroid\s*\{/;
        if (!aRe.test(app)) die('بلوک android پیدا نشد');
        app = app.replace(aRe, (m) => `${m}\n${flavors}`);
    }

    // 4) وابستگی‌ها
    const depRe = /\ndependencies\s*\{/;
    if (!depRe.test(app)) die('بلوک dependencies پیدا نشد');
    app = app.replace(depRe, (m) => `${m}
    implementation "ir.tapsell:tapsell:${TAPSELL_VERSION}"
    implementation "ir.tapsell.mediation.adapter:legacy:${TAPSELL_VERSION}"
    bazaarImplementation "${POOLAKEY_DEP}"`);

    writeFileSync('android/app/build.gradle', app);
    console.log('✓ android/app/build.gradle (Kotlin، تپسل، flavor ها، وابستگی‌ها)');
}
console.log(`   Tapsell ${TAPSELL_VERSION} | Poolakey ${POOLAKEY_DEP} | Kotlin ${KOTLIN_VERSION}`);

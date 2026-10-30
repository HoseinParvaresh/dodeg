// تنظیمات Gradle (تپسل و Kotlin) را خودکار روی پروژه‌ی اندروید Capacitor اعمال می‌کند.
// در ساخت ابری (GitHub Actions) استفاده می‌شود تا نیازی به ویرایش دستی Gradle نباشد.
//
// متغیرهای محیطی:
//   TAPSELL_VERSION   (اجباری)
//   TAPSELL_APP_KEY   (پیش‌فرض: کلید تست تپسل)
//   KOTLIN_VERSION    (پیش‌فرض: 2.1.21)
//   ENABLE_SIGNING=true  → امضای release با android/app/release.jks (رمز از DODGE_KEYSTORE_PASSWORD، alias از DODGE_KEY_ALIAS)
//   VERSION_CODE / VERSION_NAME (اختیاری)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const env = process.env;
const TAPSELL_VERSION = env.TAPSELL_VERSION;
const TAPSELL_APP_KEY = env.TAPSELL_APP_KEY || '76798342-99a7-4a5f-bf5a-60a088d5dcfb';
const KOTLIN_VERSION = env.KOTLIN_VERSION || '2.1.21';

const die = (m) => { console.error('❌ ' + m); process.exit(1); };
if (!TAPSELL_VERSION) die('TAPSELL_VERSION مشخص نشده');

const read = (p) => { if (!existsSync(p)) die(`${p} پیدا نشد`); return readFileSync(p, 'utf8'); };
const REPOS = `\n        maven { url "https://maven.tapsell.ir" }`;

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
console.log('✓ android/build.gradle (مخزن تپسل + Kotlin)');

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

    // 3) وابستگی‌ها
    const depRe = /\ndependencies\s*\{/;
    if (!depRe.test(app)) die('بلوک dependencies پیدا نشد');
    app = app.replace(depRe, (m) => `${m}
    implementation "ir.tapsell:tapsell:${TAPSELL_VERSION}"
    implementation "ir.tapsell.mediation.adapter:legacy:${TAPSELL_VERSION}"`);

    writeFileSync('android/app/build.gradle', app);
    console.log('✓ android/app/build.gradle (Kotlin، تپسل)');
}

/* ---------- نسخه و امضای release (اختیاری) ---------- */
app = read('android/app/build.gradle');
let changed = false;

if (env.VERSION_CODE) {
    app = app.replace(/versionCode\s+\d+/, `versionCode ${parseInt(env.VERSION_CODE, 10)}`);
    changed = true;
}
if (env.VERSION_NAME) {
    app = app.replace(/versionName\s+["'][^"']*["']/, `versionName "${env.VERSION_NAME}"`);
    changed = true;
}

if (env.ENABLE_SIGNING === 'true' && !app.includes('// dodge-signing')) {
    const signing = `    signingConfigs { // dodge-signing
        release {
            storeFile file("release.jks")
            storePassword System.getenv("DODGE_KEYSTORE_PASSWORD")
            keyAlias System.getenv("DODGE_KEY_ALIAS") ?: "dodge"
            keyPassword System.getenv("DODGE_KEYSTORE_PASSWORD")
        }
    }

    lint { checkReleaseBuilds false }

`;
    const btRe = /\n(\s*)buildTypes\s*\{/;
    if (!btRe.test(app)) die('بلوک buildTypes برای امضا پیدا نشد');
    app = app.replace(btRe, (m) => `\n${signing}${m.slice(1)}`);
    const relRe = /(buildTypes\s*\{\s*release\s*\{)/;
    if (!relRe.test(app)) die('بلوک release داخل buildTypes پیدا نشد');
    app = app.replace(relRe, `$1\n            signingConfig signingConfigs.release`);
    changed = true;
    console.log('✓ امضای release فعال شد');
}
if (changed) writeFileSync('android/app/build.gradle', app);
console.log(`   Tapsell ${TAPSELL_VERSION} | Kotlin ${KOTLIN_VERSION}`);

// کد بومی (Kotlin) را داخل پروژه‌ی اندروید که Capacitor ساخته کپی می‌کند:
//   npm run install-native
// پکیج را خودش از MainActivity می‌خواند، پس لازم نیست چیزی وارد کنید.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ANDROID = 'android/app/src';
const NATIVE = 'native/android';

function die(msg) { console.error('❌ ' + msg); process.exit(1); }

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        statSync(p).isDirectory() ? walk(p, out) : out.push(p);
    }
    return out;
}

if (!existsSync(ANDROID)) die('پوشه‌ی android پیدا نشد. اول «npx cap add android» را اجرا کنید.');

// ---- پکیج برنامه را از MainActivity پیدا می‌کنیم ----
const main = walk(join(ANDROID, 'main/java')).find(f => /MainActivity\.(java|kt)$/.test(f));
if (!main) die('MainActivity پیدا نشد.');
const pkg = /package\s+([\w.]+)\s*;?/.exec(readFileSync(main, 'utf8'))?.[1];
if (!pkg) die('پکیج MainActivity خوانده نشد.');
const pkgPath = pkg.replace(/\./g, '/');
console.log(`📦 پکیج برنامه: ${pkg}`);

const fixPkg = (text) => text.replaceAll('com.dodge.game', pkg);

function copyKotlin(fromDir, toRoot) {
    if (!existsSync(fromDir)) return 0;
    const dest = join(toRoot, 'java', pkgPath);
    mkdirSync(dest, { recursive: true });
    let n = 0;
    for (const f of readdirSync(fromDir)) {
        if (!f.endsWith('.kt')) continue;
        writeFileSync(join(dest, f), fixPkg(readFileSync(join(fromDir, f), 'utf8')));
        n++;
    }
    return n;
}

// ---- فایل‌های مشترک و هر فروشگاه ----
console.log(`  common → ${copyKotlin(join(NATIVE, 'common'), join(ANDROID, 'main'))} فایل`);
console.log(`  bazaar → ${copyKotlin(join(NATIVE, 'bazaar'), join(ANDROID, 'bazaar'))} فایل`);
console.log(`  myket  → ${copyKotlin(join(NATIVE, 'myket'), join(ANDROID, 'myket'))} فایل`);

for (const flavor of ['bazaar', 'myket']) {
    mkdirSync(join(ANDROID, flavor), { recursive: true });
    cpSync(join(NATIVE, flavor, 'AndroidManifest.xml'), join(ANDROID, flavor, 'AndroidManifest.xml'));
}

// ---- کلاس‌های کمکی مایکت (TrivialDrive) اگر گذاشته باشید ----
const util = join(NATIVE, 'myket/util');
if (existsSync(util)) {
    const files = readdirSync(util).filter(f => f.endsWith('.java') || f.endsWith('.kt'));
    const texts = files.map(f => readFileSync(join(util, f), 'utf8'));
    const oldPkg = texts.map(t => /package\s+([\w.]+)\s*;/.exec(t)?.[1]).find(Boolean);
    const dest = join(ANDROID, 'myket/java', pkgPath, 'util');
    mkdirSync(dest, { recursive: true });
    files.forEach((f, i) => {
        let t = texts[i];
        if (oldPkg) t = t.replaceAll(oldPkg, `${pkg}.util`);
        writeFileSync(join(dest, f), t);
    });
    console.log(`  myket/util → ${files.length} فایل (پکیج ${oldPkg ?? '?'} → ${pkg}.util)`);
} else {
    console.log('  ℹ️ myket/util پیدا نشد؛ برای نسخه‌ی مایکت، SETUP.md مرحله‌ی ۷ را ببینید.');
}
const aidl = join(NATIVE, 'myket/aidl');
if (existsSync(aidl)) {
    cpSync(aidl, join(ANDROID, 'myket/aidl'), { recursive: true });
    console.log('  myket/aidl کپی شد');
}

// ---- ثبت پلاگین در MainActivity ----
if (main.endsWith('.java')) {
    writeFileSync(main,
`package ${pkg};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DodgeStorePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);
    console.log('✅ MainActivity.java به‌روز شد (ثبت DodgeStorePlugin)');
} else {
    console.log('⚠️ MainActivity از نوع Kotlin است؛ این خط را قبل از super.onCreate اضافه کنید: registerPlugin(DodgeStorePlugin::class.java)');
}
console.log('\nحالا Gradle را طبق SETUP.md (مرحله‌ی ۵) ویرایش کنید.');

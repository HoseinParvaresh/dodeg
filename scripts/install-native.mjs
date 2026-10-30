// پلاگین تبلیغ (Kotlin) را داخل پروژه‌ی اندروید که Capacitor ساخته کپی و ثبت می‌کند:
//   npm run install-native
// پکیج را خودش از MainActivity می‌خواند، پس لازم نیست چیزی وارد کنید.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ANDROID = 'android/app/src/main';
const PLUGIN = 'native/android/common/DodgeStorePlugin.kt';

function die(msg) { console.error('❌ ' + msg); process.exit(1); }

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        statSync(p).isDirectory() ? walk(p, out) : out.push(p);
    }
    return out;
}

if (!existsSync(ANDROID)) die('پوشه‌ی android پیدا نشد. اول «npx cap add android» را اجرا کنید.');
if (!existsSync(PLUGIN)) die(`${PLUGIN} پیدا نشد`);

// ---- پکیج برنامه را از MainActivity پیدا می‌کنیم ----
const main = walk(join(ANDROID, 'java')).find(f => /MainActivity\.(java|kt)$/.test(f));
if (!main) die('MainActivity پیدا نشد.');
const pkg = /package\s+([\w.]+)\s*;?/.exec(readFileSync(main, 'utf8'))?.[1];
if (!pkg) die('پکیج MainActivity خوانده نشد.');
const pkgPath = pkg.replace(/\./g, '/');
console.log(`📦 پکیج برنامه: ${pkg}`);

// ---- کپی پلاگین ----
const dest = join(ANDROID, 'java', pkgPath);
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, 'DodgeStorePlugin.kt'), readFileSync(PLUGIN, 'utf8').replaceAll('com.dodge.game', pkg));
console.log('✓ DodgeStorePlugin.kt کپی شد');

// ---- مجوز شناسه‌ی تبلیغاتی (مستند Quick Start تپسل) ----
const manifestPath = join(ANDROID, 'AndroidManifest.xml');
let manifest = readFileSync(manifestPath, 'utf8');
if (!manifest.includes('com.google.android.gms.permission.AD_ID')) {
    manifest = manifest.replace(/(<manifest[^>]*>)/, '$1\n    <uses-permission android:name="com.google.android.gms.permission.AD_ID" />');
    writeFileSync(manifestPath, manifest);
    console.log('✓ مجوز AD_ID به AndroidManifest اضافه شد');
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
    console.log('✓ MainActivity.java به‌روز شد (ثبت DodgeStorePlugin)');
} else {
    console.log('⚠️ MainActivity از نوع Kotlin است؛ این خط را قبل از super.onCreate اضافه کنید: registerPlugin(DodgeStorePlugin::class.java)');
}
console.log('\nحالا Gradle را طبق SETUP.md (مرحله‌ی ۵) ویرایش کنید.');

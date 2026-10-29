// فایل‌های بازی را داخل پوشه‌ی www کپی می‌کند (Capacitor از همین پوشه می‌خواند)
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const OUT = 'www';
const ITEMS = ['index.html', 'music.mp3', 'css', 'js', 'fonts'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const item of ITEMS) {
    if (!existsSync(item)) {
        console.warn(`⚠️  ${item} پیدا نشد؛ رد شد`);
        continue;
    }
    cpSync(item, `${OUT}/${item}`, { recursive: true });
}
console.log(`✅ فایل‌های بازی در ${OUT}/ آماده شد`);

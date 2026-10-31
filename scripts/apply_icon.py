#!/usr/bin/env python3
"""آیکن و splash برنامه را داخل پروژه‌ی اندروید Capacitor می‌گذارد.

ورودی:
  assets/icon.png             (اجباری)  مربع، حداقل 512x512 و ترجیحاً 1024x1024
  assets/icon-foreground.png  (اختیاری) آیکن با پس‌زمینه‌ی شفاف برای آیکن تطبیقی اندروید
رنگ پس‌زمینه‌ی آیکن تطبیقی: متغیر ICON_BG (مثل #121316) وگرنه از گوشه‌ی بالا-چپ icon.png خوانده می‌شود.
اجرا (بعد از npx cap add android):  python3 scripts/apply_icon.py
"""
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw

RES = Path('android/app/src/main/res')
ICON = Path(os.environ.get('ICON_FILE', 'assets/icon.png'))
FG = Path('assets/icon-foreground.png')

if not RES.exists():
    sys.exit('❌ پوشه‌ی android/app/src/main/res پیدا نشد؛ اول «npx cap add android» را اجرا کنید.')
if not ICON.exists():
    sys.exit(f'❌ {ICON} پیدا نشد.')

src = Image.open(ICON).convert('RGBA')
if min(src.size) < 192:
    sys.exit('❌ آیکن خیلی کوچک است؛ حداقل 512x512 (ترجیحاً 1024x1024) لازم است.')
if src.size[0] != src.size[1]:
    side = min(src.size)          # برش مربعی از وسط
    l, t = (src.size[0] - side) // 2, (src.size[1] - side) // 2
    src = src.crop((l, t, l + side, t + side))

# رنگ پس‌زمینه‌ی آیکن تطبیقی
bg_hex = os.environ.get('ICON_BG', '').strip()
if bg_hex.startswith('#') and len(bg_hex) == 7:
    bg_rgb = tuple(int(bg_hex[i:i + 2], 16) for i in (1, 3, 5))
else:
    bg_rgb = src.getpixel((4, 4))[:3]
bg_hex = '#%02X%02X%02X' % bg_rgb

LEGACY = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
ADAPTIVE = {k: round(v * 108 / 48) for k, v in LEGACY.items()}   # 108dp

def circle(img):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, img.size[0] - 1, img.size[1] - 1), fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out

def foreground_canvas(px):
    """بوم ۱۰۸dp؛ هنر داخل ناحیه‌ی امن (۶۶٪ وسط) قرار می‌گیرد."""
    canvas = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    if FG.exists():
        fg = Image.open(FG).convert('RGBA').resize((px, px), Image.LANCZOS)
        canvas.alpha_composite(fg)
    else:
        inner = round(px * 0.84)
        art = src.resize((inner, inner), Image.LANCZOS)
        off = (px - inner) // 2
        canvas.alpha_composite(art, (off, off))
    return canvas

for dens, size in LEGACY.items():
    folder = RES / f'mipmap-{dens}'
    folder.mkdir(parents=True, exist_ok=True)
    full = src.resize((size, size), Image.LANCZOS)
    full.save(folder / 'ic_launcher.png')
    circle(full).save(folder / 'ic_launcher_round.png')
    foreground_canvas(ADAPTIVE[dens]).save(folder / 'ic_launcher_foreground.png')

# رنگ پس‌زمینه‌ی آیکن تطبیقی
values = RES / 'values'
values.mkdir(parents=True, exist_ok=True)
(values / 'ic_launcher_background.xml').write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
    f'    <color name="ic_launcher_background">{bg_hex}</color>\n</resources>\n', encoding='utf-8')

# آیکن تطبیقی (اگر در قالب نبود می‌سازیم)
anydpi = RES / 'mipmap-anydpi-v26'
anydpi.mkdir(parents=True, exist_ok=True)
for name in ('ic_launcher.xml', 'ic_launcher_round.xml'):
    (anydpi / name).write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n', encoding='utf-8')

# صفحه‌ی شروع (splash): فقط رنگ تیره‌ی بازی، بدون لوگو.
# اسم بازی را خود بازی با انیمیشن نشان می‌دهد (صحنه‌ی ورود)، پس این‌جا چیزی نمی‌گذاریم تا تصویر «جمع‌شده» دیده نشود.
count = 0
for splash in RES.glob('drawable*/splash.png'):
    w, h = Image.open(splash).size
    Image.new('RGB', (w, h), bg_rgb).save(splash)
    count += 1

# اندروید ۱۲ به بالا خودش یک splash سیستمی با آیکن برنامه نشان می‌دهد؛ آیکن را شفاف و پس‌زمینه را تیره می‌کنیم
styles = RES / 'values' / 'styles.xml'
if styles.exists():
    import re
    xml = styles.read_text(encoding='utf-8')
    m = re.search(r'(<style\s+name="AppTheme\.NoActionBarLaunch"[^>]*>)(.*?)(</style>)', xml, re.S)
    if m and 'windowSplashScreenBackground' not in m.group(2):
        items = ('\n        <item name="windowSplashScreenBackground">@color/ic_launcher_background</item>'
                 '\n        <item name="windowSplashScreenAnimatedIcon">@android:color/transparent</item>\n    ')
        xml = xml[:m.end(2)] + items + xml[m.end(2):]
        styles.write_text(xml, encoding='utf-8')
        print('✓ splash سیستمی اندروید ۱۲+ شفاف و تیره شد')
    elif not m:
        print('⚠️ استایل AppTheme.NoActionBarLaunch در styles.xml پیدا نشد؛ splash سیستمی دست‌نخورده ماند')

print(f'✓ آیکن در {len(LEGACY)} اندازه ساخته شد (پس‌زمینه‌ی تطبیقی {bg_hex}) و {count} فایل splash تیره شد')

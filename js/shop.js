export const STAR_PACKS = [
    {
        id: 'starter_bundle',
        sku: 'dodge_starter_bundle',
        name: 'پک شروع طلایی',
        desc: '۱,۶۰۰ ستاره + فعال‌سازی دائمی پرک سپر شروع بازی!',
        stars: 1600,
        bonusText: '+ سپر دائمی رایگان',
        priceToman: 29000,
        priceText: '۲۹,۰۰۰ تومان',
        badge: '۶۵٪  تخفیف ویژه • فقط ۱  بار',
        color: '#34D399',
        bgGrad: 'linear-gradient(135deg, rgba(52, 211, 153, 0.22) 0%, rgba(16, 185, 129, 0.05) 60%, rgba(27, 29, 34, 0.95) 100%)',
        consumable: false,
        oneTime: true,
        isHero: true,
        unlockShield: true
    },
    {
        id: 'vip_doubler',
        sku: 'dodge_vip_doubler',
        name: 'پک سلطنتی VIP (۲ برابر)',
        desc: 'ستاره‌های دریافتی در تمام مراحل برای همیشه ۲ برابر می‌شود + ۵۰۰ ستاره ★',
        stars: 500,
        bonusText: 'ضریب 2X همیشگی',
        priceToman: 89000,
        priceText: '۸۹,۰۰۰ تومان',
        badge: 'پیشنهاد دائمی • VIP',
        color: '#C084FC',
        bgGrad: 'linear-gradient(135deg, rgba(192, 132, 252, 0.24) 0%, rgba(139, 92, 246, 0.06) 60%, rgba(27, 29, 34, 0.95) 100%)',
        consumable: false,
        oneTime: true,
        isHero: true,
        enableDoubler: true
    },
    {
        id: 'stars_600',
        sku: 'dodge_stars_600',
        name: ' یه مشت ستاره',
        desc: 'مناسب ارتقای اولیه',
        stars: 600,
        bonusText: 'بسته پایه',
        priceToman: 19000,
        priceText: '۱۹,۰۰۰ تومان',
        badge: '',
        color: '#60A5FA',
        bgGrad: 'radial-gradient(circle at 50% 32%, rgba(96, 165, 250, 0.25), rgba(36, 39, 46, 0.95) 72%)',
        consumable: true
    },
    {
        id: 'stars_2000',
        sku: 'dodge_stars_2000',
        name: 'کیسه ستاره',
        desc: 'شامل ۵۰۰ ستاره هدیه',
        stars: 2000,
        bonusText: '+۳۵٪ ستاره بیشتر',
        priceToman: 49000,
        priceText: '۴۹,۰۰۰ تومان',
        badge: 'پرفروش‌ترین',
        color: '#FBBF24',
        bgGrad: 'radial-gradient(circle at 50% 32%, rgba(251, 191, 36, 0.28), rgba(36, 39, 46, 0.95) 72%)',
        consumable: true
    },
    {
        id: 'stars_5200',
        sku: 'dodge_stars_5200',
        name: 'صندوقچه کهکشانی',
        desc: 'شامل ۲,۰۰۰ ستاره هدیه',
        stars: 5200,
        bonusText: '+۶۰٪ ستاره بیشتر',
        priceToman: 99000,
        priceText: '۹۹,۰۰۰ تومان',
        badge: 'پیشنهاد حرفه‌ای',
        color: '#FF5A5F',
        bgGrad: 'radial-gradient(circle at 50% 32%, rgba(255, 90, 95, 0.28), rgba(36, 39, 46, 0.95) 72%)',
        consumable: true
    },
    {
        id: 'stars_14000',
        sku: 'dodge_stars_14000',
        name: 'مخزن امگا',
        desc: 'شامل ۷,۰۰۰ ستاره هدیه',
        stars: 14000,
        bonusText: '+۱۰۰٪ هدیه (۲ برابر)',
        priceToman: 189000,
        priceText: '۱۸۹,۰۰۰ تومان',
        badge: 'بهترین ارزش خرید',
        color: '#38BDF8',
        bgGrad: 'radial-gradient(circle at 50% 32%, rgba(56, 189, 248, 0.32), rgba(36, 39, 46, 0.95) 72%)',
        consumable: true
    }
];

export const STAR_PACK_ART = {
    starter_bundle: `
        <svg viewBox="0 0 88 88" width="76" height="76" fill="none">
            <defs>
                <linearGradient id="shGrad" x1="14" y1="10" x2="74" y2="78" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#6EE7B7"/>
                    <stop offset="50%" stop-color="#10B981"/>
                    <stop offset="100%" stop-color="#047857"/>
                </linearGradient>
                <linearGradient id="stGold1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FEF08A"/>
                    <stop offset="50%" stop-color="#FBBF24"/>
                    <stop offset="100%" stop-color="#D97706"/>
                </linearGradient>
            </defs>
            <circle cx="44" cy="44" r="36" fill="rgba(52,211,153,0.15)"/>
            <!-- Glowing Cyber Shield -->
            <path d="M44 10 L70 20 V42 C70 60 58 72 44 78 C30 72 18 60 18 42 V20 L44 10 Z" fill="url(#shGrad)" stroke="#A7F3D0" stroke-width="2.5"/>
            <path d="M44 17 L63 25 V41 C63 55 54 65 44 70 C34 65 25 55 25 41 V25 L44 17 Z" fill="#064E3B" opacity="0.55"/>
            <!-- Big Center Star & Mini Stars -->
            <polygon points="44,23 49,34 61,35 52,43 55,55 44,49 33,55 36,43 27,35 39,34" fill="url(#stGold1)" stroke="#FFFFFF" stroke-width="1.5"/>
            <polygon points="68,14 70,19 75,20 71,23 72,28 68,25 64,28 65,23 61,20 66,19" fill="#FDE047"/>
            <polygon points="20,56 22,60 26,61 23,64 24,68 20,66 16,68 17,64 14,61 18,60" fill="#FDE047"/>
        </svg>`,

    vip_doubler: `
        <svg viewBox="0 0 88 88" width="76" height="76" fill="none">
            <defs>
                <linearGradient id="vipCrown" x1="12" y1="16" x2="76" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#FDE047"/>
                    <stop offset="50%" stop-color="#F59E0B"/>
                    <stop offset="100%" stop-color="#B45309"/>
                </linearGradient>
                <linearGradient id="vipOrb" x1="20" y1="20" x2="68" y2="68" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#E879F9"/>
                    <stop offset="100%" stop-color="#7E22CE"/>
                </linearGradient>
            </defs>
            <circle cx="44" cy="44" r="36" fill="rgba(192,132,252,0.16)" stroke="#C084FC" stroke-width="1.5" stroke-dasharray="5 5"/>
            <circle cx="44" cy="48" r="24" fill="url(#vipOrb)" stroke="#F3E8FF" stroke-width="2"/>
            <!-- Royal Crown -->
            <path d="M20 42 L26 22 L38 33 L44 17 L50 33 L62 22 L68 42 Z" fill="url(#vipCrown)" stroke="#FEF9C3" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="26" cy="20" r="3" fill="#38BDF8"/>
            <circle cx="44" cy="14" r="3.5" fill="#FF5A5F"/>
            <circle cx="62" cy="20" r="3" fill="#34D399"/>
            <!-- 2X Emblem -->
            <rect x="26" y="45" width="36" height="20" rx="6" fill="#121316" stroke="#FDE047" stroke-width="1.8"/>
            <text x="44" y="59" fill="#FDE047" font-family="Outfit, sans-serif" font-size="14" font-weight="900" text-anchor="middle">2X ★</text>
        </svg>`,

    stars_600: `
        <svg viewBox="0 0 88 88" width="68" height="68" fill="none">
            <defs>
                <linearGradient id="s600" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FEF08A"/>
                    <stop offset="55%" stop-color="#FBBF24"/>
                    <stop offset="100%" stop-color="#D97706"/>
                </linearGradient>
            </defs>
            <circle cx="44" cy="44" r="30" fill="rgba(96,165,250,0.16)"/>
            <!-- Left & Right Stars -->
            <polygon points="26,36 29,43 37,44 31,49 33,57 26,53 19,57 21,49 15,44 23,43" fill="#F59E0B" opacity="0.9"/>
            <polygon points="62,36 65,43 73,44 67,49 69,57 62,53 55,57 57,49 51,44 59,43" fill="#F59E0B" opacity="0.9"/>
            <!-- Main Center Star -->
            <polygon points="44,18 50,33 66,35 54,46 57,62 44,54 31,62 34,46 22,35 38,33" fill="url(#s600)" stroke="#FEF9C3" stroke-width="2"/>
            <circle cx="22" cy="24" r="2.5" fill="#60A5FA"/>
            <circle cx="67" cy="22" r="2" fill="#FEF08A"/>
        </svg>`,

    stars_2000: `
        <svg viewBox="0 0 88 88" width="68" height="68" fill="none">
            <defs>
                <linearGradient id="pouchGrad" x1="20" y1="30" x2="68" y2="78" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#F59E0B"/>
                    <stop offset="50%" stop-color="#B45309"/>
                    <stop offset="100%" stop-color="#78350F"/>
                </linearGradient>
                <linearGradient id="starGlow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFFBEB"/>
                    <stop offset="50%" stop-color="#FDE047"/>
                    <stop offset="100%" stop-color="#F59E0B"/>
                </linearGradient>
            </defs>
            <!-- Overflowing Stars at Top -->
            <polygon points="33,18 36,24 42,25 37,29 39,35 33,32 27,35 29,29 24,25 30,24" fill="url(#starGlow)"/>
            <polygon points="55,18 58,24 64,25 59,29 61,35 55,32 49,35 51,29 46,25 52,24" fill="url(#starGlow)"/>
            <polygon points="44,10 48,18 56,19 50,25 52,33 44,29 36,33 38,25 32,19 40,18" fill="url(#starGlow)" stroke="#FFFFFF" stroke-width="1.2"/>
            <!-- Treasure Pouch Body -->
            <path d="M30 34 H58 L68 52 C72 64 64 76 44 76 C24 76 16 64 20 52 L30 34 Z" fill="url(#pouchGrad)" stroke="#FDE047" stroke-width="2.2"/>
            <!-- Gold Rope Tie -->
            <rect x="28" y="32" width="32" height="6" rx="3" fill="#FEF08A"/>
            <!-- Emblem Star on Pouch -->
            <polygon points="44,44 47,51 55,52 49,57 51,65 44,61 37,65 39,57 33,52 41,51" fill="#FDE047"/>
        </svg>`,

    stars_5200: `
        <svg viewBox="0 0 88 88" width="68" height="68" fill="none">
            <defs>
                <linearGradient id="chestBody" x1="14" y1="36" x2="74" y2="76" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#FB7185"/>
                    <stop offset="45%" stop-color="#E11D48"/>
                    <stop offset="100%" stop-color="#881337"/>
                </linearGradient>
                <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FEF08A"/>
                    <stop offset="60%" stop-color="#F59E0B"/>
                    <stop offset="100%" stop-color="#B45309"/>
                </linearGradient>
            </defs>
            <!-- Light Rays from Open Chest -->
            <polygon points="44,44 16,10 34,8" fill="rgba(253,224,71,0.25)"/>
            <polygon points="44,44 72,10 54,8" fill="rgba(253,224,71,0.25)"/>
            <polygon points="44,44 36,6 52,6" fill="rgba(253,224,71,0.38)"/>
            <!-- Chest Upper Lid (Open) -->
            <path d="M18 34 L24 20 H64 L70 34 Z" fill="#9F1239" stroke="url(#goldTrim)" stroke-width="2.5"/>
            <!-- Mountain of Stars Inside -->
            <circle cx="32" cy="34" r="6" fill="#FBBF24"/>
            <circle cx="56" cy="34" r="6" fill="#FBBF24"/>
            <polygon points="44,14 49,24 60,25 52,32 54,42 44,37 34,42 36,32 28,25 39,24" fill="#FEF08A" stroke="#F59E0B" stroke-width="1.5"/>
            <!-- Chest Lower Box -->
            <rect x="16" y="36" width="56" height="36" rx="6" fill="url(#chestBody)" stroke="url(#goldTrim)" stroke-width="3"/>
            <line x1="16" y1="48" x2="72" y2="48" stroke="url(#goldTrim)" stroke-width="3"/>
            <!-- Center Lock -->
            <rect x="38" y="42" width="12" height="14" rx="3" fill="url(#goldTrim)" stroke="#FFFFFF" stroke-width="1.2"/>
            <circle cx="44" cy="49" r="2.5" fill="#121316"/>
        </svg>`,

    stars_14000: `
        <svg viewBox="0 0 88 88" width="68" height="68" fill="none">
            <defs>
                <linearGradient id="vaultCore" x1="12" y1="12" x2="76" y2="76" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#38BDF8"/>
                    <stop offset="50%" stop-color="#0284C7"/>
                    <stop offset="100%" stop-color="#1E3A8A"/>
                </linearGradient>
                <linearGradient id="omegaGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFFFFF"/>
                    <stop offset="40%" stop-color="#FDE047"/>
                    <stop offset="100%" stop-color="#D97706"/>
                </linearGradient>
            </defs>
            <!-- Outer Energy Halo -->
            <circle cx="44" cy="44" r="38" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
            <!-- Hexagonal Omega Vault Frame -->
            <polygon points="44,8 74,25 74,63 44,80 14,63 14,25" fill="url(#vaultCore)" stroke="url(#omegaGold)" stroke-width="3"/>
            <polygon points="44,15 67,29 67,59 44,73 21,59 21,29" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
            <!-- Overflowing Star Burst -->
            <polygon points="26,22 29,28 35,29 30,33 32,39 26,36 20,39 22,33 17,29 23,28" fill="#FDE047"/>
            <polygon points="62,22 65,28 71,29 66,33 68,39 62,36 56,39 58,33 53,29 59,28" fill="#FDE047"/>
            <polygon points="25,52 28,57 34,58 29,62 31,68 25,65 19,68 21,62 16,58 22,57" fill="#38BDF8"/>
            <polygon points="63,52 66,57 72,58 67,62 69,68 63,65 57,68 59,62 54,58 60,57" fill="#38BDF8"/>
            <!-- Giant Radiant Omega Star -->
            <polygon points="44,18 51,35 69,37 55,49 59,67 44,57 29,67 33,49 19,37 37,35" fill="url(#omegaGold)" stroke="#FFFFFF" stroke-width="2"/>
        </svg>`
};

export const SHOP_DATA = {
    shapes: [
        { id: 'circle', name: 'Pure Sphere', desc: 'Classic smooth circle', cost: 0 },
        { id: 'square', name: 'Soft Cube', desc: 'Rounded geometric block', cost: 180 },
        { id: 'diamond', name: 'Prism', desc: 'Rotating 4-point rhomb', cost: 350 },
        { id: 'triangle', name: 'Delta Dart', desc: 'Points toward movement', cost: 520 },
        { id: 'hex', name: 'Hex Core', desc: 'Six-sided precision', cost: 750 },
        { id: 'ring', name: 'Hollow Halo', desc: 'Minimalist glowing ring', cost: 980 },
        { id: 'star', name: 'Nova Star', desc: 'Radiant 5-point astral core', cost: 1350 },
        { id: 'plus', name: 'Cyber Cross', desc: 'Precision tactical emblem', cost: 1750 },
        { id: 'shuriken', name: 'Shadow Blade', desc: 'High-spin 4-point shuriken', cost: 2400 },
        { id: 'octagon', name: 'Aegis Octagon', desc: 'Heavy armored 8-sided core', cost: 3200 }
    ],
    trails: [
        { id: 'fade', name: 'Smooth Fade', desc: 'Clean tapered ribbon', cost: 0 },
        { id: 'dots', name: 'Pulse Dots', desc: 'Rhythmic breadcrumb orbs', cost: 220 },
        { id: 'dual', name: 'Twin Wing', desc: 'Parallel wake lines', cost: 420 },
        { id: 'sparks', name: 'Ember Dust', desc: 'Scattering micro-sparks', cost: 680 },
        { id: 'chroma', name: 'Prismatic', desc: 'Shifting spectrum wake', cost: 950 },
        { id: 'squares', name: 'Pixel Glitch', desc: 'Digital holo-cubes wake', cost: 1300 },
        { id: 'wave', name: 'Sine Pulse', desc: 'Oscillating energy wave', cost: 1700 },
        { id: 'rings', name: 'Sonic Echo', desc: 'Expanding ripple rings', cost: 2200 },
        { id: 'bolt', name: 'Volt Arc', desc: 'Crackling high-voltage wake', cost: 2900 }
    ],
    themes: [
        { id: 'coral', name: 'Midnight Coral', desc: 'Charcoal & warm coral', cost: 0, bg: '#121316', arena: '#17191E', laser: '#FF5A5F', player: '#F3F4F6' },
        { id: 'mint', name: 'Cyber Mint', desc: 'Deep slate & neon mint', cost: 260, bg: '#0E1517', arena: '#131D20', laser: '#34D399', player: '#ECFDF5' },
        { id: 'gold', name: 'Solar Flare', desc: 'Obsidian & amber beam', cost: 480, bg: '#16130E', arena: '#1E1A13', laser: '#FBBF24', player: '#FEF3C7' },
        { id: 'amethyst', name: 'Void Violet', desc: 'Dusk indigo & magenta', cost: 720, bg: '#13101A', arena: '#1A1625', laser: '#C084FC', player: '#F3E8FF' },
        { id: 'mono', name: 'Monochrome', desc: 'Pure high-contrast ink', cost: 980, bg: '#0A0A0C', arena: '#121215', laser: '#FFFFFF', player: '#60A5FA' },
        { id: 'crimson', name: 'Blood Moon', desc: 'Abyssal red & scarlet', cost: 1350, bg: '#170B0E', arena: '#221015', laser: '#F43F5E', player: '#FFE4E6' },
        { id: 'arctic', name: 'Arctic Frost', desc: 'Glacial navy & ice cyan', cost: 1750, bg: '#0B131E', arena: '#101C2B', laser: '#38BDF8', player: '#E0F2FE' },
        { id: 'venom', name: 'Acid Venom', desc: 'Bio-dark & toxic lime', cost: 2300, bg: '#0E160B', arena: '#152110', laser: '#A3E635', player: '#ECFCCB' },
        { id: 'sunset', name: 'Synthwave', desc: 'Retro night & hot pink', cost: 2950, bg: '#160D1C', arena: '#21132B', laser: '#F472B6', player: '#FCE7F3' }
    ],
    fx: [
        { id: 'classic', name: 'Core Burst', desc: 'Classic radial energy scatter', cost: 0 },
        { id: 'pixel', name: 'Pixel Glitch', desc: 'Explosive digital holo-cubes', cost: 480 },
        { id: 'fireworks', name: 'Neon Fireworks', desc: 'Prismatic multi-star celebration', cost: 890 },
        { id: 'blackhole', name: 'Void Singularity', desc: 'Dark gravity collapse & implosion', cost: 1450 },
        { id: 'thunder', name: 'Volt Shockwave', desc: 'High-voltage radial lightning arcs', cost: 2100 },
        { id: 'supernova', name: 'Astral Supernova', desc: 'Blinding golden cosmic shockwave', cost: 3200 }
    ],
    perks: [
        {
            id: 'shield', name: 'Start Shield', desc: 'Begin every run with an energy barrier', baseCost: 450, max: 1, color: '#34D399',
            formatStat: l => l > 0 ? 'Active on every start (MAX)' : 'Locked → 1 Hit Barrier'
        },
        {
            id: 'magnet', name: 'Star Magnet', desc: 'Pulls nearby stars toward your core', baseCost: 220, max: 4, color: '#60A5FA',
            formatStat: l => l >= 4 ? 'Pull Radius: +100% (MAX)' : `Pull Radius: +${l * 25}% → +${(l + 1) * 25}%`
        },
        {
            id: 'slow', name: 'Chrono Cell', desc: 'Extends Slow-Mo pickup duration', baseCost: 240, max: 4, color: '#60A5FA',
            formatStat: l => l >= 4 ? `Duration: ${(3 + l * 0.6).toFixed(1)}s (MAX)` : `Duration: ${(3 + l * 0.6).toFixed(1)}s → ${(3 + (l + 1) * 0.6).toFixed(1)}s`
        },
        {
            id: 'greed', name: 'Star Bonus', desc: 'Bonus stars earned every 5 pickups', baseCost: 360, max: 3, color: '#FBBF24',
            formatStat: l => l >= 3 ? 'Bonus: +3 ★ per 5 pickups (MAX)' : `Bonus: +${l} ★ → +${l + 1} ★`
        },
        {
            id: 'secondwind', name: 'Second Wind', desc: 'Revive once per run & blast hazards', baseCost: 950, max: 1, color: '#C084FC',
            formatStat: l => l > 0 ? '1 Revive + EMP Blast / Run (MAX)' : 'Locked → 1 Fatal Hit Save'
        },
        {
            id: 'closecall', name: 'Close Call Master', desc: 'Wider near-miss zone & bonus stars', baseCost: 320, max: 3, color: '#FF5A5F',
            formatStat: l => l >= 3 ? 'Near Miss: +8 ★ Base (MAX)' : `Near Miss: +${2 + l * 2} ★ → +${4 + l * 2} ★`
        }
    ]
};

export const SHAPE_SVGS = {
    circle: `<circle cx="12" cy="12" r="7" fill="currentColor"/>`,
    square: `<rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor"/>`,
    diamond: `<polygon points="12 4 20 12 12 20 4 12" fill="currentColor"/>`,
    triangle: `<polygon points="12 4 20 19 4 19" fill="currentColor"/>`,
    hex: `<polygon points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5" fill="currentColor"/>`,
    ring: `<circle cx="12" cy="12" r="7" stroke-width="3"/>`,
    star: `<polygon points="12 3 14.8 8.8 21 9.7 16.5 14 17.6 20.2 12 17.2 6.4 20.2 7.5 14 3 9.7 9.2 8.8" fill="currentColor"/>`,
    plus: `<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z" fill="currentColor"/>`,
    shuriken: `<polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" fill="currentColor"/>`,
    octagon: `<polygon points="8.5 3 15.5 3 21 8.5 21 15.5 15.5 15.5 21 8.5 21 3 15.5 3 8.5" fill="currentColor"/>`
};

export const FX_SVGS = {
    classic: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="4" fill="currentColor"/><circle cx="14" cy="14" r="9" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3" fill="none"/></svg>`,
    pixel: `<svg width="28" height="28" viewBox="0 0 28 28"><rect x="5" y="5" width="5" height="5" fill="#38BDF8"/><rect x="18" y="6" width="4" height="4" fill="#34D399"/><rect x="11" y="11" width="6" height="6" fill="currentColor"/><rect x="6" y="17" width="4" height="4" fill="#FBBF24"/><rect x="17" y="17" width="5" height="5" fill="#FF5A5F"/></svg>`,
    fireworks: `<svg width="28" height="28" viewBox="0 0 28 28"><polygon points="14,3 16,10 23,10 17,14 19,21 14,17 9,21 11,14 5,10 12,10" fill="#FBBF24"/><circle cx="6" cy="6" r="2" fill="#FF5A5F"/><circle cx="22" cy="6" r="2" fill="#38BDF8"/><circle cx="14" cy="24" r="2" fill="#34D399"/></svg>`,
    blackhole: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" stroke="#C084FC" stroke-width="2" stroke-dasharray="5 3" fill="none"/><circle cx="14" cy="14" r="6" fill="#121316" stroke="#A855F7" stroke-width="2.5"/></svg>`,
    thunder: `<svg width="28" height="28" viewBox="0 0 28 28"><polyline points="15,3 8,14 14,14 11,25 20,12 14,12 15,3" fill="#FBBF24" stroke="#38BDF8" stroke-width="1"/></svg>`,
    supernova: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" stroke="#FBBF24" stroke-width="1.8" fill="rgba(251,191,36,0.2)"/><polygon points="14,2 16,12 26,14 16,16 14,26 12,16 2,14 12,12" fill="#FFFFFF"/></svg>`
};
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
    octagon: `<polygon points="8.5 3 15.5 3 21 8.5 21 15.5 15.5 21 8.5 21 3 15.5 3 8.5" fill="currentColor"/>`
};

export const FX_SVGS = {
    classic: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="4" fill="currentColor"/><circle cx="14" cy="14" r="9" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3" fill="none"/></svg>`,
    pixel: `<svg width="28" height="28" viewBox="0 0 28 28"><rect x="5" y="5" width="5" height="5" fill="#38BDF8"/><rect x="18" y="6" width="4" height="4" fill="#34D399"/><rect x="11" y="11" width="6" height="6" fill="currentColor"/><rect x="6" y="17" width="4" height="4" fill="#FBBF24"/><rect x="17" y="17" width="5" height="5" fill="#FF5A5F"/></svg>`,
    fireworks: `<svg width="28" height="28" viewBox="0 0 28 28"><polygon points="14,3 16,10 23,10 17,14 19,21 14,17 9,21 11,14 5,10 12,10" fill="#FBBF24"/><circle cx="6" cy="6" r="2" fill="#FF5A5F"/><circle cx="22" cy="6" r="2" fill="#38BDF8"/><circle cx="14" cy="24" r="2" fill="#34D399"/></svg>`,
    blackhole: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" stroke="#C084FC" stroke-width="2" stroke-dasharray="5 3" fill="none"/><circle cx="14" cy="14" r="6" fill="#121316" stroke="#A855F7" stroke-width="2.5"/></svg>`,
    thunder: `<svg width="28" height="28" viewBox="0 0 28 28"><polyline points="15,3 8,14 14,14 11,25 20,12 14,12 15,3" fill="#FBBF24" stroke="#38BDF8" stroke-width="1"/></svg>`,
    supernova: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" stroke="#FBBF24" stroke-width="1.8" fill="rgba(251,191,36,0.2)"/><polygon points="14,2 16,12 26,14 16,16 14,26 12,16 2,14 12,12" fill="#FFFFFF"/></svg>`
};
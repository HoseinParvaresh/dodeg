export const CHAPTERS = [
    [1, 'Calibration'], [2, 'Detonation'], [3, 'Kinetic'], [4, 'Singularity'],
    [5, 'Cyclone'], [6, 'Supernova'], [7, 'Ion Grid'], [8, 'Shockwave'],
    [9, 'Meteor'], [10, 'Omega Core'], [11, 'Prism Triad'], [12, 'Quantum Rift'],
    [13, 'Volt Barrier'], [14, 'Warp Horizon'], [15, 'Homing Seeker'], [16, 'Cluster Split'],
    [17, 'Laser Cage'], [18, 'Pendulum Scythe'], [19, 'Tesla Arcs'], [20, 'Helix Zenith']
].map(([id, name]) => ({ id, title: `Chapter ${id} • ${name}`, range: [(id - 1) * 5 + 1, id * 5] }));

// فقط در این مراحل خاص دیوار برقی یا دیوار پورتالی فعال است (چپتر ۱۳ و ۱۴ + چند مرحله منتخب در چپترهای ۱۵ تا ۲۰)
export const ELECTRIC_WALL_LEVELS = [61, 62, 63, 64, 65, 75, 85, 95];
export const PORTAL_WALL_LEVELS = [66, 67, 68, 69, 70, 80, 90, 100];

export const DASH_TUTORIAL = {
    tag: 'MOBILE SKILL TUTORIAL',
    title: 'PHASE DASH • DOUBLE-TAP',
    sub: 'Double-Tap Anywhere to Teleport',
    desc: 'Quickly tap twice anywhere on the screen to dash forward and phase safely through active lasers! Watch the blue ring around your core for cooldown.',
    svg: `<svg viewBox="0 0 160 90" width="160" height="90">
        <line x1="80" y1="8" x2="80" y2="82" stroke="#FF5A5F" stroke-width="10" opacity="0.35"/>
        <line x1="80" y1="8" x2="80" y2="82" stroke="#FFFFFF" stroke-width="3.5"/>
        <circle cx="34" cy="68" r="10" fill="none" stroke="#38BDF8" stroke-width="2">
            <animate attributeName="r" values="4;18;4;18" keyTimes="0;0.25;0.35;0.6" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0;1;0" keyTimes="0;0.25;0.35;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="34" y="84" fill="#38BDF8" font-size="8" font-family="Outfit, sans-serif" font-weight="700" text-anchor="middle">2x TAP</text>
        <line x1="42" y1="42" x2="118" y2="42" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" stroke-dasharray="6 6">
            <animate attributeName="opacity" values="0;0;0.85;0" keyTimes="0;0.35;0.55;0.9" dur="2s" repeatCount="indefinite"/>
        </line>
        <circle cx="42" cy="42" r="8" fill="#F3F4F6" stroke="#38BDF8" stroke-width="2">
            <animate attributeName="cx" values="42;42;122;122" keyTimes="0;0.35;0.58;1" dur="2s" repeatCount="indefinite"/>
        </circle>
    </svg>`
};

export const CHAPTER_INTROS = {
    1: {
        name: 'Linear Laser Beams',
        desc: 'Dashed red lines warn you where a laser is charging. Move out of the line before it flashes white and fires!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <line x1="15" y1="42" x2="135" y2="42" stroke="#FF5A5F" stroke-width="2" stroke-dasharray="6 5">
                <animate attributeName="opacity" values="0.3;0.9;0;0" keyTimes="0;0.55;0.6;1" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="15" y1="42" x2="135" y2="42" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round">
                <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.55;0.65;1" dur="2s" repeatCount="indefinite"/>
            </line>
            <circle cx="75" cy="42" r="7.5" fill="#F3F4F6">
                <animate attributeName="cy" values="42;20;20;42" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
            </circle>
        </svg>`
    },
    2: {
        name: 'Plasma Bombs & Crossfire',
        desc: 'Circular blast zones expand until they detonate. Stay outside the dashed ring before it reaches full size!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <circle cx="75" cy="42" r="28" fill="none" stroke="#FF5A5F" stroke-width="2" stroke-dasharray="5 4"/>
            <circle cx="75" cy="42" r="4" fill="#FF5A5F">
                <animate attributeName="r" values="2;28;28;2" keyTimes="0;0.65;0.85;1" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.35;0.5;0.95;0" keyTimes="0;0.65;0.75;1" dur="2s" repeatCount="indefinite"/>
            </circle>
        </svg>`
    },
    3: {
        name: 'Sweeping Beams & Ricochet Orbs',
        desc: 'Sweeping lasers travel across the arena while kinetic orbs bounce up to 3 times off the arena walls.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <line x1="20" y1="20" x2="130" y2="20" stroke="#FF5A5F" stroke-width="6" stroke-linecap="round">
                <animate attributeName="y1" values="18;68;18" dur="2.2s" repeatCount="indefinite"/>
                <animate attributeName="y2" values="18;68;18" dur="2.2s" repeatCount="indefinite"/>
            </line>
            <circle cx="40" cy="50" r="6.5" fill="#FFFFFF" stroke="#FF5A5F" stroke-width="3">
                <animate attributeName="cx" values="25;125;25" dur="1.8s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="65;25;65" dur="1.8s" repeatCount="indefinite"/>
            </circle>
        </svg>`
    },
    4: {
        name: 'Gravity Vortex & Sniper Lock',
        desc: 'Purple singularities pull your ball inward, while Sniper lasers track your movement before locking on!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,42)">
                <circle r="30" fill="none" stroke="#C084FC" stroke-width="1.8" stroke-dasharray="6 6">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle r="11" fill="#121316" stroke="#FF5A5F" stroke-width="3"/>
            </g>
        </svg>`
    },
    5: {
        name: 'Cyclone Rotating Blades',
        desc: 'Laser blades spin rapidly around a central core. Move in sync with the rotation direction to survive.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,42)">
                <g>
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.4s" repeatCount="indefinite"/>
                    <line x1="-34" y1="0" x2="34" y2="0" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                </g>
                <circle r="5" fill="#FF5A5F"/>
            </g>
        </svg>`
    },
    6: {
        name: 'Supernova 6-Way Starburst',
        desc: 'Nova cores charge up and unleash 3 intersecting laser beams in 6 directions simultaneously.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,42)">
                <line x1="-45" y1="0" x2="45" y2="0" stroke="#FF5A5F" stroke-width="4"/>
                <line x1="-25" y1="-32" x2="25" y2="32" stroke="#FF5A5F" stroke-width="4"/>
                <line x1="25" y1="-32" x2="-25" y2="32" stroke="#FF5A5F" stroke-width="4"/>
                <circle r="9" fill="#FFFFFF" stroke="#FF5A5F" stroke-width="3"/>
            </g>
        </svg>`
    },
    7: {
        name: 'Ion Grid Barrage',
        desc: 'Three parallel laser beams slice the arena at once. Position your core inside the safe lanes between them!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <line x1="18" y1="20" x2="132" y2="20" stroke="#FF5A5F" stroke-width="5"/>
            <line x1="18" y1="42" x2="132" y2="42" stroke="#FF5A5F" stroke-width="5"/>
            <line x1="18" y1="64" x2="132" y2="64" stroke="#FF5A5F" stroke-width="5"/>
            <circle cx="75" cy="31" r="6" fill="#F3F4F6"/>
        </svg>`
    },
    8: {
        name: 'Expanding Shockwave Rings',
        desc: 'Hollow laser rings expand outward from their core. Keep your distance or Dash straight through the ring wall!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <circle cx="75" cy="42" r="8" fill="none" stroke="#FF5A5F" stroke-width="6">
                <animate attributeName="r" values="6;34" dur="1.7s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0" dur="1.7s" repeatCount="indefinite"/>
            </circle>
        </svg>`
    },
    9: {
        name: 'Supersonic Meteors',
        desc: 'High-velocity meteors lock onto your position from the arena edges and streak across at extreme speed.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <circle cx="30" cy="60" r="8" fill="#FFFFFF" stroke="#FF5A5F" stroke-width="4">
                <animate attributeName="cx" values="20;130" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="65;20" dur="1.2s" repeatCount="indefinite"/>
            </circle>
        </svg>`
    },
    10: {
        name: 'Omega 4-Blade Cross',
        desc: 'Four heavy laser blades rotate together in a cross formation, dividing the arena into 4 moving quadrants.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,42)">
                <g>
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>
                    <line x1="-32" y1="0" x2="32" y2="0" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                    <line x1="0" y1="-32" x2="0" y2="32" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                </g>
                <circle r="5" fill="#FF5A5F"/>
            </g>
        </svg>`
    },
    11: {
        name: 'Prism Triad Spinner',
        desc: 'Three-pronged laser prisms spin across the arena. Rotate with the wide 120-degree pockets to stay safe.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,44)">
                <g>
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.8s" repeatCount="indefinite"/>
                    <line x1="0" y1="0" x2="0" y2="-32" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                    <line x1="0" y1="0" x2="28" y2="16" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                    <line x1="0" y1="0" x2="-28" y2="16" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                </g>
                <circle r="5" fill="#FF5A5F"/>
            </g>
        </svg>`
    },
    12: {
        name: 'Quantum Rift Walls',
        desc: 'Dual laser walls close in from opposite sides of the arena. Time your Double-Tap Dash to blink past them!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <line x1="20" y1="15" x2="130" y2="15" stroke="#FF5A5F" stroke-width="5">
                <animate attributeName="y1" values="12;42;12" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="y2" values="12;42;12" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="20" y1="70" x2="130" y2="70" stroke="#FF5A5F" stroke-width="5">
                <animate attributeName="y1" values="72;42;72" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="y2" values="72;42;72" dur="2s" repeatCount="indefinite"/>
            </line>
            <circle cx="75" cy="42" r="6" fill="#38BDF8"/>
        </svg>`
    },
    13: {
        name: 'High-Voltage Electric Walls',
        desc: 'Every few seconds, one of the 4 arena walls flashes red and electrifies with lethal lightning! Never touch an active wall.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <rect x="28" y="12" width="94" height="60" rx="10" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2"/>
            <line x1="32" y1="12" x2="118" y2="12" stroke="#FF1E38" stroke-width="8" stroke-linecap="round">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite"/>
            </line>
            <polyline points="32,12 48,20 64,9 82,21 98,10 118,14" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
        </svg>`
    },
    14: {
        name: 'Dimensional Portal Borders',
        desc: 'The arena walls are now interdimensional green portals! Exiting any wall teleports you straight out of the opposite wall.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <ellipse cx="26" cy="42" rx="7" ry="26" fill="#10B981" stroke="#39FF14" stroke-width="3"/>
            <ellipse cx="124" cy="42" rx="7" ry="26" fill="#10B981" stroke="#A3E635" stroke-width="3"/>
            <circle cx="50" cy="42" r="7" fill="#F3F4F6">
                <animate attributeName="cx" values="65;26;124;85" keyTimes="0;0.45;0.46;1" dur="2s" repeatCount="indefinite"/>
            </circle>
        </svg>`
    },
    15: {
        name: 'Homing Seeker Missiles',
        desc: 'Smart heat-seeking drones lock onto your core and curve their flight path toward you for 3 seconds before burning out!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <path d="M25,65 Q75,10 120,45" fill="none" stroke="#FF5A5F" stroke-width="2" stroke-dasharray="4 4"/>
            <polygon points="0,-6 14,0 0,6" fill="#FF5A5F" stroke="#FFFFFF" stroke-width="1.5">
                <animateMotion path="M25,65 Q75,15 115,44" dur="1.8s" repeatCount="indefinite" rotate="auto"/>
            </polygon>
            <circle cx="118" cy="44" r="7" fill="#F3F4F6"/>
        </svg>`
    },
    16: {
        name: 'Cluster Splitter Cores',
        desc: 'Unstable golden-red cores drift into the arena and violently shatter into 6 high-speed shrapnel orbs in all directions!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,42)">
                <circle r="10" fill="#FBBF24" stroke="#FF5A5F" stroke-width="3">
                    <animate attributeName="r" values="10;13;0;0" keyTimes="0;0.45;0.5;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle r="4" fill="#FFFFFF">
                    <animate attributeName="cx" values="0;0;32;38" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle r="4" fill="#FFFFFF">
                    <animate attributeName="cx" values="0;0;-32;-38" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle r="4" fill="#FFFFFF">
                    <animate attributeName="cy" values="0;0;-28;-34" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle r="4" fill="#FFFFFF">
                    <animate attributeName="cy" values="0;0;28;34" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.45;0.85;1" dur="2s" repeatCount="indefinite"/>
                </circle>
            </g>
        </svg>`
    },
    17: {
        name: 'Tactical Laser Cage',
        desc: 'Four interlocking laser beams form a box trap around your position. Escape the perimeter or Dash out before it fires!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <rect x="47" y="16" width="56" height="52" fill="none" stroke="#FF5A5F" stroke-width="4">
                <animate attributeName="stroke" values="#FF5A5F;#FFFFFF;#FF5A5F" dur="1.4s" repeatCount="indefinite"/>
                <animate attributeName="stroke-width" values="2;8;2" dur="1.4s" repeatCount="indefinite"/>
            </rect>
            <circle cx="75" cy="42" r="6.5" fill="#38BDF8">
                <animate attributeName="cx" values="75;122;75" dur="2.2s" repeatCount="indefinite"/>
            </circle>
        </svg>`
    },
    18: {
        name: 'Pendulum Scythe Beam',
        desc: 'A giant laser scythe anchored to the arena border swings back and forth like a pendulum. Duck under its arc!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,10)">
                <g>
                    <animateTransform attributeName="transform" type="rotate" values="-48;48;-48" dur="2.2s" repeatCount="indefinite"/>
                    <line x1="0" y1="0" x2="0" y2="62" stroke="#FF5A5F" stroke-width="10" stroke-linecap="round" opacity="0.4"/>
                    <line x1="0" y1="0" x2="0" y2="62" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
                </g>
                <circle r="5" fill="#FBBF24"/>
            </g>
        </svg>`
    },
    19: {
        name: 'Moving Tesla Coil Arcs',
        desc: 'Paired Tesla nodes drift across the arena while crackling with a deadly high-voltage lightning tether between them!',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g>
                <animateTransform attributeName="transform" type="translate" values="0,-12; 0,14; 0,-12" dur="2s" repeatCount="indefinite"/>
                <polyline points="38,42 54,35 68,48 84,36 98,46 112,42" fill="none" stroke="#38BDF8" stroke-width="4"/>
                <polyline points="38,42 54,35 68,48 84,36 98,46 112,42" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
                <circle cx="38" cy="42" r="7" fill="#121316" stroke="#38BDF8" stroke-width="3"/>
                <circle cx="112" cy="42" r="7" fill="#121316" stroke="#38BDF8" stroke-width="3"/>
            </g>
        </svg>`
    },
    20: {
        name: 'Helix Zenith • Dual DNA Beams',
        desc: 'The final frontier! Twin parallel laser beams spin in a double-helix formation alongside the ultimate arena hazards.',
        svg: `<svg viewBox="0 0 150 85" width="150" height="85">
            <g transform="translate(75,42)">
                <g>
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.6s" repeatCount="indefinite"/>
                    <line x1="-34" y1="-11" x2="34" y2="-11" stroke="#FF5A5F" stroke-width="8" stroke-linecap="round" opacity="0.45"/>
                    <line x1="-34" y1="-11" x2="34" y2="-11" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
                    <line x1="-34" y1="11" x2="34" y2="11" stroke="#FF5A5F" stroke-width="8" stroke-linecap="round" opacity="0.45"/>
                    <line x1="-34" y1="11" x2="34" y2="11" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
                </g>
                <circle r="6" fill="#FBBF24"/>
            </g>
        </svg>`
    }
};

const RAW_LEVELS = [
    // Ch 1..12 (Levels 1..60)
    [1.75, 1.10, 'axis'], [1.60, 1.05, 'axis', 'twin'], [1.50, 1.00, 'axis', 'diag', 'twin'], [1.40, 0.95, 'diag', 'twin'], [1.32, 0.92, 'axis', 'diag', 'twin'],
    [1.30, 0.92, 'axis', 'bomb'], [1.24, 0.90, 'diag', 'bomb', 'cross'], [1.18, 0.88, 'twin', 'bomb', 'cross'], [1.12, 0.85, 'axis', 'diag', 'bomb', 'cross'], [1.05, 0.82, 'cross', 'bomb'],
    [1.15, 0.86, 'axis', 'sweep', 'orb'], [1.10, 0.84, 'diag', 'sweep', 'orb'], [1.04, 0.82, 'bomb', 'sweep', 'orb'], [0.98, 0.80, 'cross', 'sweep', 'orb'], [0.92, 0.78, 'twin', 'bomb', 'sweep', 'orb'],
    [0.94, 0.78, 'axis', 'vortex', 'sniper'], [0.88, 0.75, 'bomb', 'vortex', 'sniper'], [0.84, 0.73, 'orb', 'sweep', 'vortex'], [0.80, 0.70, 'cross', 'orb', 'vortex', 'sniper'], [0.75, 0.68, 'twin', 'bomb', 'sweep', 'orb', 'vortex', 'sniper'],
    [0.92, 0.78, 'axis', 'spinner'], [0.88, 0.75, 'twin', 'bomb', 'spinner'], [0.84, 0.73, 'orb', 'spinner'], [0.80, 0.70, 'vortex', 'sniper', 'spinner'], [0.75, 0.68, 'cross', 'bomb', 'orb', 'spinner'],
    [0.90, 0.76, 'axis', 'nova'], [0.85, 0.74, 'bomb', 'sweep', 'nova'], [0.80, 0.72, 'orb', 'spinner', 'nova'], [0.76, 0.69, 'vortex', 'sniper', 'spinner', 'nova'], [0.70, 0.66, 'twin', 'bomb', 'orb', 'vortex', 'spinner', 'nova'],
    [0.90, 0.76, 'axis', 'grid'], [0.85, 0.74, 'diag', 'bomb', 'grid'], [0.80, 0.72, 'orb', 'grid'], [0.75, 0.69, 'spinner', 'sniper', 'grid'], [0.70, 0.66, 'vortex', 'nova', 'grid'],
    [0.88, 0.75, 'axis', 'ringwave'], [0.84, 0.73, 'twin', 'bomb', 'ringwave'], [0.79, 0.70, 'orb', 'sweep', 'ringwave'], [0.74, 0.68, 'vortex', 'spinner', 'ringwave'], [0.69, 0.65, 'nova', 'grid', 'ringwave'],
    [0.88, 0.75, 'axis', 'meteor'], [0.83, 0.72, 'cross', 'bomb', 'meteor'], [0.78, 0.70, 'orb', 'ringwave', 'meteor'], [0.73, 0.67, 'vortex', 'spinner', 'meteor'], [0.68, 0.65, 'sniper', 'nova', 'grid', 'meteor'],
    [0.86, 0.74, 'axis', 'omega'], [0.82, 0.72, 'bomb', 'meteor', 'omega'], [0.78, 0.69, 'orb', 'grid', 'omega'], [0.73, 0.67, 'vortex', 'ringwave', 'nova', 'omega'], [0.68, 0.64, 'sniper', 'spinner', 'nova', 'grid', 'ringwave', 'meteor', 'omega'],
    [0.86, 0.74, 'axis', 'prism'], [0.82, 0.72, 'twin', 'orb', 'prism'], [0.78, 0.69, 'bomb', 'ringwave', 'prism'], [0.73, 0.67, 'vortex', 'meteor', 'prism'], [0.68, 0.64, 'sniper', 'nova', 'omega', 'prism'],
    [0.85, 0.73, 'axis', 'rift'], [0.80, 0.71, 'cross', 'bomb', 'rift'], [0.76, 0.68, 'orb', 'prism', 'rift'], [0.71, 0.66, 'vortex', 'meteor', 'omega', 'rift'], [0.65, 0.62, 'sniper', 'nova', 'grid', 'ringwave', 'meteor', 'omega', 'prism', 'rift'],

    // Ch 13: Volt Barrier (Levels 61..65 - Electric Walls)
    [0.84, 0.72, 'axis', 'diag', 'orb'], [0.79, 0.70, 'twin', 'bomb', 'spinner'], [0.75, 0.68, 'vortex', 'ringwave', 'meteor'], [0.70, 0.65, 'sniper', 'omega', 'prism'], [0.65, 0.62, 'nova', 'grid', 'omega', 'prism', 'rift'],

    // Ch 14: Warp Horizon (Levels 66..70 - Portal Borders)
    [0.82, 0.72, 'spinner', 'orb'], [0.78, 0.70, 'omega', 'prism', 'sweep'], [0.74, 0.68, 'vortex', 'meteor', 'spinner'], [0.69, 0.65, 'sniper', 'nova', 'omega', 'prism'], [0.64, 0.61, 'spinner', 'nova', 'grid', 'meteor', 'omega', 'prism', 'rift'],

    // Ch 15: Homing Seeker (Levels 71..75 - Level 75 has Electric Wall)
    [0.84, 0.72, 'axis', 'seeker'], [0.79, 0.70, 'twin', 'bomb', 'seeker'], [0.75, 0.68, 'spinner', 'ringwave', 'seeker'], [0.70, 0.65, 'vortex', 'prism', 'seeker'], [0.65, 0.62, 'sniper', 'nova', 'omega', 'seeker'],

    // Ch 16: Cluster Split (Levels 76..80 - Level 80 has Portal Borders)
    [0.84, 0.72, 'axis', 'splitter'], [0.79, 0.70, 'cross', 'orb', 'splitter'], [0.74, 0.68, 'vortex', 'seeker', 'splitter'], [0.69, 0.65, 'grid', 'omega', 'splitter'], [0.64, 0.61, 'nova', 'prism', 'seeker', 'splitter'],

    // Ch 17: Laser Cage (Levels 81..85 - Level 85 has Electric Wall)
    [0.83, 0.72, 'axis', 'cage'], [0.78, 0.70, 'bomb', 'spinner', 'cage'], [0.73, 0.67, 'meteor', 'splitter', 'cage'], [0.68, 0.64, 'vortex', 'prism', 'seeker', 'cage'], [0.63, 0.61, 'sniper', 'omega', 'splitter', 'cage'],

    // Ch 18: Pendulum Scythe (Levels 86..90 - Level 90 has Portal Borders)
    [0.82, 0.71, 'axis', 'pendulum'], [0.77, 0.69, 'twin', 'ringwave', 'pendulum'], [0.72, 0.66, 'seeker', 'cage', 'pendulum'], [0.67, 0.63, 'vortex', 'splitter', 'pendulum'], [0.62, 0.60, 'nova', 'omega', 'cage', 'pendulum'],

    // Ch 19: Tesla Arcs (Levels 91..95 - Level 95 has Electric Wall)
    [0.81, 0.70, 'axis', 'tesla'], [0.76, 0.68, 'orb', 'pendulum', 'tesla'], [0.71, 0.65, 'seeker', 'splitter', 'tesla'], [0.66, 0.62, 'prism', 'cage', 'tesla'], [0.61, 0.59, 'sniper', 'omega', 'pendulum', 'tesla'],

    // Ch 20: Helix Zenith (Levels 96..100 - Level 100 Grand Finale has Portal Borders)
    [0.80, 0.70, 'axis', 'helix'], [0.75, 0.67, 'seeker', 'tesla', 'helix'], [0.70, 0.64, 'splitter', 'cage', 'helix'], [0.65, 0.61, 'pendulum', 'tesla', 'omega', 'helix'], [0.60, 0.58, 'seeker', 'splitter', 'cage', 'pendulum', 'tesla', 'helix']
];

export const LEVELS = RAW_LEVELS.map(([rate, charge, ...types], i) => ({
    id: i + 1,
    target: 6 + (i % 5) * 2,
    rate,
    charge,
    types
}));

export const ACHIEVEMENTS = [
    {
        id: 'untouchable',
        title: 'Untouchable',
        descTemplate: 'Clear {goal} levels without losing a shield',
        stat: 'noHitWins',
        tiers: [
            { goal: 8, reward: 60 },
            { goal: 25, reward: 140 },
            { goal: 60, reward: 300 },
            { goal: 120, reward: 600 }
        ]
    },
    {
        id: 'laserdancer',
        title: 'Laser Dancer',
        descTemplate: 'Perform {goal} Close Calls near firing lasers',
        stat: 'closeCalls',
        tiers: [
            { goal: 30, reward: 70 },
            { goal: 90, reward: 160 },
            { goal: 220, reward: 350 },
            { goal: 500, reward: 750 }
        ]
    },
    {
        id: 'speedrunner',
        title: 'Speedrunner',
        descTemplate: 'Clear {goal} levels in under 14 seconds',
        stat: 'fastWins',
        tiers: [
            { goal: 3, reward: 75 },
            { goal: 10, reward: 170 },
            { goal: 25, reward: 360 },
            { goal: 50, reward: 700 }
        ]
    },
    {
        id: 'campaignconqueror',
        title: 'Campaign Conqueror',
        descTemplate: 'Complete {goal} unique campaign levels',
        stat: 'completedCount',
        tiers: [
            { goal: 20, reward: 90 },
            { goal: 50, reward: 220 },
            { goal: 80, reward: 450 },
            { goal: 100, reward: 1000 }
        ]
    },
    {
        id: 'starharvester',
        title: 'Star Harvester',
        descTemplate: 'Collect {goal} stars inside arenas',
        stat: 'totalPickups',
        tiers: [
            { goal: 150, reward: 60 },
            { goal: 500, reward: 150 },
            { goal: 1500, reward: 340 },
            { goal: 3500, reward: 750 }
        ]
    },
    {
        id: 'phaseblinker',
        title: 'Phase Blinker',
        descTemplate: 'Use Double-Tap Dash {goal} times in battle',
        stat: 'dashesUsed',
        tiers: [
            { goal: 40, reward: 50 },
            { goal: 150, reward: 130 },
            { goal: 400, reward: 280 },
            { goal: 900, reward: 600 }
        ]
    },
    {
        id: 'endlesssurvivor',
        title: 'Endless Legend',
        descTemplate: 'Reach a score of {goal} in Endless Arena',
        stat: 'bestEndless',
        tiers: [
            { goal: 25, reward: 80 },
            { goal: 50, reward: 190 },
            { goal: 85, reward: 420 },
            { goal: 130, reward: 900 }
        ]
    },
    {
        id: 'overdrivemaster',
        title: 'Overdrive Master',
        descTemplate: 'Reach a score of {goal} in Overdrive Blitz',
        stat: 'bestOverdrive',
        tiers: [
            { goal: 20, reward: 80 },
            { goal: 45, reward: 190 },
            { goal: 75, reward: 420 },
            { goal: 110, reward: 900 }
        ]
    },
    {
        id: 'chaosmaster',
        title: 'Chaos Survivor',
        descTemplate: 'Reach a score of {goal} in Chaos Randomizer',
        stat: 'bestChaos',
        tiers: [
            { goal: 20, reward: 85 },
            { goal: 45, reward: 200 },
            { goal: 75, reward: 450 },
            { goal: 115, reward: 950 }
        ]
    },
    {
        id: 'powerupscavenger',
        title: 'Tech Scavenger',
        descTemplate: 'Activate {goal} special arena power-ups',
        stat: 'powerupsPicked',
        tiers: [
            { goal: 25, reward: 65 },
            { goal: 80, reward: 150 },
            { goal: 200, reward: 320 },
            { goal: 450, reward: 680 }
        ]
    }
];

export const CHAOS_RULES = [
    { id: 'HYPER', name: 'OVERCLOCK 1.6x', desc: 'Hazards charge & move 60% faster!' },
    { id: 'MIRROR', name: 'MIRROR CONTROLS', desc: 'Steering inputs are inverted!' },
    { id: 'STEALTH', name: 'STEALTH RADAR', desc: 'Lasers cloak until sonar pulse!' },
    { id: 'GRAVITY', name: 'CORE GRAVITY', desc: 'Center singularity pulls you in!' },
    { id: 'JACKPOT', name: 'STAR FRENZY 2x', desc: 'Double star value & giant pickups!' }
];
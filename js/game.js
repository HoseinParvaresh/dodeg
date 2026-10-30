import { CHAPTERS, LEVELS, CHAOS_RULES, ELECTRIC_WALL_LEVELS, PORTAL_WALL_LEVELS } from './levels.js';
import { SHOP_DATA } from './shop.js';
import { clamp, rand } from './math.js';
import { SaveStore } from './storage.js';
import { AudioController } from './audio.js';
import { Spawner } from './spawner.js';
import { EntityUpdater } from './updater.js';
import { ArenaRenderer } from './arenaRenderer.js';
import { UIManager } from './ui.js';
import { AdsManager } from './ads.js';
import { ContinueScreen } from './continueScreen.js';
import { StarsPopup } from './starsPopup.js';
import { CONTINUE } from './config.js';

// نوشتن در DOM فقط وقتی مقدار واقعاً عوض شده (هر نوشتن، حتی با مقدار یکسان، بازچینی/بازرسم دارد)
function setText(el, v) { if (el && el.__t !== v) { el.__t = v; el.textContent = v; } }
function setClass(el, v) { if (el && el.__c !== v) { el.__c = v; el.className = v; } }
function setStyle(el, prop, v) { const k = '__s_' + prop; if (el && el[k] !== v) { el[k] = v; el.style[prop] = v; } }

export class DodgeGame {
    constructor() {
        // فونت‌های محلی را از همان اول می‌گیریم تا متن روی بوم (canvas) با فونت درست کشیده شود
        if (document.fonts && document.fonts.load) {
            ['600', '700', '800'].forEach(w => document.fonts.load(`${w} 14px Outfit`).catch(() => { }));
        }
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.save = SaveStore.load();
        this.audio = new AudioController(this.save.settings);

        this.state = 'MENU';
        this.mode = 'LEVEL';
        this.currentLevelId = Math.min(this.save.unlockedLevel || 1, LEVELS.length);
        this.lastOutcome = null;

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.arena = { x: 0, y: 0, w: 320, h: 320, r: 24 };

        this.player = this.createPlayerObj(1, '#38BDF8');
        this.player2 = this.createPlayerObj(2, '#FBBF24');

        // متغیرهای مسابقه ۳ راندی در مود ۲ نفره
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.currentRound = 1;
        this.roundWinnerId = 1;
        this.roundTransitionTimer = 0;

        this.slowTimer = 0;
        this.phaseTimer = 0;
        this.miniTimer = 0;
        this.hitStopTimer = 0;
        this.chromaticFlash = 0;
        this.introTimer = 0;
        this.introMaxTime = 0.7;

        this.deathTimer = 0;
        this.killerEntity = null;
        this.dyingPlayer = null;
        this.electricWall = { side: -1, state: 'IDLE', timer: 1.8 };
        this.portalRifts = [];
        this.fxBolts = [];

        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashMaxCooldown = 4.0;

        this.score = 0;
        this.targetScore = 10;

        this.overdriveMaxTime = 14.0;
        this.overdriveTimer = 14.0;
        this.empCharge = 0;
        this.chaosTimer = 15.0;
        this.activeChaosRule = CHAOS_RULES[0];

        this.lasers = [];
        this.hazards = [];
        this.pickups = [];
        this.particles = [];
        this.rings = [];
        this.menuGridOffset = 0;
        this.shake = 0;
        this.spawnTimer = 1.0;
        this.specialSpawnTimer = 3.8;

        this.pointerP1 = { id: null, active: false, x: 0, y: 0, anchorX: 0, anchorY: 0, lastTap: 0 };
        this.pointerP2 = { id: null, active: false, x: 0, y: 0, anchorX: 0, anchorY: 0, lastTap: 0 };
        this.keys = {};

        // کیفیت رندر بوم: روی گوشی‌های ضعیف از ۱٫۵ شروع می‌شود و اگر فریم‌ریت پایین بود خودکار کم می‌شود
        const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
        const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
        let scale = lowEnd ? Math.min(maxDpr, 1.5) : maxDpr;
        try {
            const saved = parseFloat(localStorage.getItem('dodge_render_scale'));
            if (saved >= 1 && saved < scale) scale = saved;
        } catch { }
        this.renderScale = scale;
        this.lowFx = scale <= 1.25;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindInputs();
        this.ads = new AdsManager(this);
        this.ui = new UIManager(this);
        this.continueScreen = new ContinueScreen(this);
        this.starsPopup = new StarsPopup(this);
        this.applyThemeColors();
        this.ui.refreshHomeUI();

        this.lastTime = performance.now();
        this.nextDue = 0;       // زمان‌بندی: حداکثر ۶۰ فریم بر ثانیه (۳۰ در منو)
        this.dtSmooth = 0;      // dt هموارشده برای جلوگیری از پرش حرکت
        this._perfAcc = 0;
        this._perfN = 0;
        this._perfWarm = 2;     // دو پنجره‌ی اول (شروع بازی) در نظر گرفته نمی‌شود
        this._raf = (t) => this.loop(t);
        requestAnimationFrame(this._raf);
    }

    createPlayerObj(id, customColor) {
        return {
            id,
            customColor,
            x: 0, y: 0, vx: 0, vy: 0, radius: 11,
            angle: id === 2 ? Math.PI / 2 : -Math.PI / 2,
            shield: false, invuln: 0, trail: [], warpScale: 0,
            dashTimer: 0, dashCooldown: 0, phaseTimer: 0, miniTimer: 0, giantTimer: 0
        };
    }

    getActivePlayers() {
        return this.mode === 'VERSUS' ? [this.player, this.player2] : [this.player];
    }

    getActiveTheme() {
        return SHOP_DATA.themes.find(t => t.id === this.save.theme) || SHOP_DATA.themes[0];
    }

    getEffectiveRadius(p = this.player) {
        if (p.giantTimer > 0) return p.radius * 1.95; // ۲ برابر بزرگ‌تر در صورت خوردن آیتم Giant Hex
        const isMini = (p.miniTimer > 0) || (p === this.player && this.miniTimer > 0);
        return isMini ? p.radius * 0.52 : p.radius;
    }

    isElectricChapter() {
        return this.mode === 'LEVEL' && ELECTRIC_WALL_LEVELS.includes(this.currentLevelId);
    }

    isPortalChapter() {
        return this.mode === 'LEVEL' && PORTAL_WALL_LEVELS.includes(this.currentLevelId);
    }

    applyThemeColors() {
        const th = this.getActiveTheme();
        document.documentElement.style.setProperty('--bg', th.bg);
        document.documentElement.style.setProperty('--accent', th.laser);
    }

    // فقط اندازه‌ی پیکسلی بوم را عوض می‌کند (بدون دست زدن به محل آرنا یا بازیکن)
    applyCanvasScale() {
        const dpr = this.renderScale;
        this.canvas.width = Math.round(this.width * dpr);
        this.canvas.height = Math.round(this.height * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // اگر میانگین فریم‌تایم بالا بود، یک پله کیفیت بوم کم می‌کنیم (۲ ← ۱٫۵ ← ۱٫۲۵ ← ۱)
    lowerRenderScale() {
        const steps = [2, 1.5, 1.25, 1];
        const next = steps.find(s => s < this.renderScale - 0.01);
        if (!next) return false;
        this.renderScale = next;
        this.lowFx = next <= 1.25;
        this.applyCanvasScale();
        try { localStorage.setItem('dodge_render_scale', String(next)); } catch { }
        return true;
    }

    resize() {
        const dpr = this.renderScale;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const topPad = 142, botPad = 78;
        const size = Math.max(250, Math.min(480, this.width - 36, this.height - topPad - botPad));
        this.arena = {
            x: (this.width - size) / 2,
            y: topPad + (this.height - topPad - botPad - size) / 2,
            w: size, h: size, r: 24
        };

        if (this.state !== 'MENU') {
            this.getActivePlayers().forEach(p => {
                p.x = clamp(p.x, this.arena.x + 16, this.arena.x + this.arena.w - 16);
                p.y = clamp(p.y, this.arena.y + 16, this.arena.y + this.arena.h - 16);
            });
        }
    }

    bindInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape' && (this.state === 'PLAYING' || this.state === 'PAUSED')) {
                this.togglePause();
            }
            if (this.state === 'PLAYING') {
                if (e.code === 'Space' || e.code === 'ShiftLeft') {
                    e.preventDefault();
                    this.triggerDash(this.player);
                }
                if ((e.code === 'Enter' || e.code === 'ShiftRight') && this.mode === 'VERSUS') {
                    e.preventDefault();
                    this.triggerDash(this.player2);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('pointerdown', (e) => {
            this.audio.init();
            if (this.state === 'PLAYING') {
                if (e.target.closest('button')) return;
            } else if (e.target.closest('.interactive')) {
                return;
            }

            const now = performance.now();
            const isTopHalf = this.mode === 'VERSUS' && e.clientY < this.height / 2;
            const ptr = isTopHalf ? this.pointerP2 : this.pointerP1;
            const targetPlayer = isTopHalf ? this.player2 : this.player;

            if (this.state === 'PLAYING' && now - ptr.lastTap < 280) {
                this.triggerDash(targetPlayer);
            }
            ptr.lastTap = now;
            ptr.id = e.pointerId;
            ptr.active = true;
            ptr.x = e.clientX;
            ptr.y = e.clientY;
            ptr.anchorX = e.clientX;
            ptr.anchorY = e.clientY;
        });

        window.addEventListener('pointermove', (e) => {
            const updatePtr = (ptr) => {
                ptr.x = e.clientX;
                ptr.y = e.clientY;
                const dx = e.clientX - ptr.anchorX;
                const dy = e.clientY - ptr.anchorY;
                const dist = Math.hypot(dx, dy);
                if (dist > 48) {
                    ptr.anchorX = e.clientX - (dx / dist) * 48;
                    ptr.anchorY = e.clientY - (dy / dist) * 48;
                }
            };

            if (this.pointerP1.active && e.pointerId === this.pointerP1.id) {
                updatePtr(this.pointerP1);
            } else if (this.pointerP2.active && e.pointerId === this.pointerP2.id) {
                updatePtr(this.pointerP2);
            }
        });

        const release = (e) => {
            if (e.pointerId === this.pointerP1.id) {
                this.pointerP1.active = false;
                this.pointerP1.id = null;
            }
            if (e.pointerId === this.pointerP2.id) {
                this.pointerP2.active = false;
                this.pointerP2.id = null;
            }
        };
        window.addEventListener('pointerup', release);
        window.addEventListener('pointercancel', release);
    }

    triggerDash(p = this.player) {
        if (p.dashCooldown > 0 || this.introTimer > 0) return;
        p.dashTimer = 0.16;
        p.dashCooldown = this.dashMaxCooldown;
        p.invuln = Math.max(p.invuln, 0.22);
        p.vx = Math.cos(p.angle) * 920;
        p.vy = Math.sin(p.angle) * 920;

        if (p === this.player) {
            this.dashTimer = p.dashTimer;
            this.dashCooldown = p.dashCooldown;
            this.save.stats.dashesUsed = (this.save.stats.dashesUsed || 0) + 1;
        }

        const dashCol = p.id === 2 ? '#FBBF24' : '#38BDF8';
        this.audio.playDash();
        this.audio.vibrate(18);
        this.rings.push({ x: p.x, y: p.y, r: 8, maxR: 75, alpha: 0.7, color: dashCol });
        this.emitParticles(p.x, p.y, dashCol, 10);
    }

    triggerImpactFX(x, y, color) {
        this.hitStopTimer = 0.06;
        this.chromaticFlash = 1.0;
        this.rings.push({ x, y, r: 10, maxR: this.arena.w * 0.85, alpha: 0.85, color });
        this.rings.push({ x, y, r: 24, maxR: this.arena.w * 0.55, alpha: 0.6, color: '#FFFFFF' });
    }

    triggerFinishFX(x, y) {
        const fx = this.save.fx || 'classic';
        const th = this.getActiveTheme();

        if (fx === 'pixel') {
            const cols = ['#38BDF8', '#34D399', '#FBBF24', th.laser, '#FFFFFF'];
            for (let i = 0; i < 38; i++) {
                const a = rand(0, Math.PI * 2), s = rand(50, 240);
                this.particles.push({
                    x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                    r: rand(4, 8), life: 1.2, decay: rand(1.2, 2.2),
                    color: cols[i % cols.length], shape: 'square'
                });
            }
            this.rings.push({ x, y, r: 8, maxR: 150, alpha: 0.9, color: '#38BDF8' });
        } else if (fx === 'fireworks') {
            const cols = ['#FF5A5F', '#FBBF24', '#34D399', '#38BDF8', '#C084FC'];
            for (let i = 0; i < 42; i++) {
                const a = (i / 42) * Math.PI * 2 + rand(-0.1, 0.1);
                const s = (i % 2 === 0) ? rand(140, 250) : rand(65, 130);
                this.particles.push({
                    x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                    r: rand(4.5, 7.5), life: 1.35, decay: rand(1.1, 1.9),
                    color: cols[i % cols.length], shape: 'star'
                });
            }
            cols.slice(0, 3).forEach((c, idx) => {
                this.rings.push({ x, y, r: 6 + idx * 14, maxR: 120 + idx * 35, alpha: 0.85, color: c });
            });
        } else if (fx === 'blackhole') {
            for (let i = 0; i < 40; i++) {
                const a = rand(0, Math.PI * 2), dist = rand(45, 130);
                const px = x + Math.cos(a) * dist, py = y + Math.sin(a) * dist;
                this.particles.push({
                    x: px, y: py,
                    vx: -Math.cos(a) * dist * 2.1 - Math.sin(a) * 70,
                    vy: -Math.sin(a) * dist * 2.1 + Math.cos(a) * 70,
                    r: rand(3, 6), life: 1.2, decay: 1.6,
                    color: i % 2 === 0 ? '#C084FC' : '#121316', shape: 'circle'
                });
            }
            this.rings.push({ x, y, r: 95, maxR: 6, alpha: 0.95, color: '#C084FC' });
            this.rings.push({ x, y, r: 10, maxR: 150, alpha: 0.75, color: '#A855F7' });
        } else if (fx === 'thunder') {
            for (let b = 0; b < 8; b++) {
                const baseAng = (b * Math.PI) / 4 + rand(-0.2, 0.2);
                const pts = [{ x, y }];
                for (let step = 1; step <= 5; step++) {
                    const d = step * 24;
                    const jitter = rand(-14, 14);
                    pts.push({
                        x: x + Math.cos(baseAng) * d - Math.sin(baseAng) * jitter,
                        y: y + Math.sin(baseAng) * d + Math.cos(baseAng) * jitter
                    });
                }
                this.fxBolts.push({ pts, alpha: 1.0, color: b % 2 === 0 ? '#FBBF24' : '#38BDF8' });
            }
            this.emitParticles(x, y, '#FBBF24', 24);
            this.rings.push({ x, y, r: 10, maxR: 175, alpha: 0.9, color: '#FBBF24' });
        } else if (fx === 'supernova') {
            for (let i = 0; i < 44; i++) {
                const a = rand(0, Math.PI * 2), s = rand(60, 260);
                this.particles.push({
                    x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                    r: rand(4, 8), life: 1.3, decay: rand(1.1, 2.0),
                    color: i % 2 === 0 ? '#FBBF24' : '#FFFFFF', shape: 'star'
                });
            }
            this.rings.push({ x, y, r: 8, maxR: 190, alpha: 0.95, color: '#FBBF24' });
            this.rings.push({ x, y, r: 20, maxR: 130, alpha: 0.85, color: '#FFFFFF' });
        } else {
            this.emitParticles(x, y, th.laser, 32);
            this.emitParticles(x, y, '#FFFFFF', 14);
            this.rings.push({ x, y, r: 10, maxR: 155, alpha: 0.9, color: th.laser });
        }
    }

    startGame(mode, levelId = 1) {
        const validLvl = clamp(Number(levelId) || 1, 1, LEVELS.length);
        Object.assign(this, {
            mode, currentLevelId: validLvl, state: 'PLAYING', lastOutcome: null,
            lasers: [], hazards: [], pickups: [], particles: [], rings: [], portalRifts: [], fxBolts: [],
            score: 0,
            p1Wins: 0, p2Wins: 0, currentRound: 1, roundWinnerId: 1, roundTransitionTimer: 0,
            slowTimer: 0, phaseTimer: 0, miniTimer: 0, dashTimer: 0, dashCooldown: 0,
            deathTimer: 0, killerEntity: null, dyingPlayer: null,
            electricWall: { side: -1, state: 'IDLE', timer: 1.6 },
            introTimer: this.introMaxTime,
            specialSpawnTimer: mode === 'VERSUS' ? 2.8 : 3.8,
            overdriveMaxTime: 14.0, overdriveTimer: 14.0, empCharge: 0,
            spawnTimer: mode === 'OVERDRIVE' ? 0.8 : 1.15,
            secondWindAvailable: mode !== 'VERSUS' && (this.save.perks.secondwind || 0) > 0,
            shieldLostThisRun: false, runElapsedTime: 0, continuesUsed: 0
        });

        this.pointerP1.active = false;
        this.pointerP2.active = false;
        this.audio.setMusicDucking(false);
        this.audio.syncMusic();
        this.ads.prepare('continue');
        this.resize();

        this.resetPlayersForRound();

        if (mode === 'CHAOS') {
            this.chaosTimer = 15.0;
            this.pickNewChaosRule(0);
        }

        const cfg = LEVELS[this.currentLevelId - 1] || LEVELS[0];
        this.targetScore = mode === 'LEVEL' ? cfg.target : 999999;

        document.getElementById('screen-home').classList.add('hidden');
        document.getElementById('hud-center').classList.add('visible');
        document.getElementById('hud-dash-hint')?.classList.add('visible');
        document.getElementById('btn-pause').style.display = 'flex';
        document.getElementById('hud-progress-wrap').style.display =
            (mode === 'LEVEL' || mode === 'OVERDRIVE' || mode === 'CHAOS') ? 'block' : 'none';

        const hintEl = document.getElementById('hud-dash-hint');
        if (hintEl) {
            hintEl.textContent = mode === 'VERSUS'
                ? 'P1: BOTTOM • P2: TOP • GRAB RED ITEMS TO SABOTAGE!'
                : 'DOUBLE-TAP SCREEN TO DASH';
        }

        this.updateHUD();
        Spawner.spawnPickup(this);
        Spawner.spawnPickup(this);
        if (mode === 'OVERDRIVE') Spawner.spawnPickup(this);

        if (mode === 'LEVEL' && (this.currentLevelId - 1) % 5 === 0) {
            const chapId = Math.floor((this.currentLevelId - 1) / 5) + 1;
            if (this.ui.showChapterIntro(chapId)) {
                this.state = 'INTRO_MODAL';
            }
        }
    }

    resetPlayersForRound() {
        const hasStartShield = (this.save.perks.shield || 0) > 0;
        const cx = this.arena.x + this.arena.w / 2;
        const cy = this.arena.y + this.arena.h / 2;

        Object.assign(this.player, {
            x: cx,
            y: this.mode === 'VERSUS' ? cy + 55 : cy,
            vx: 0, vy: 0, trail: [], invuln: 0.9, warpScale: 0,
            dashTimer: 0, dashCooldown: 0, phaseTimer: 0, miniTimer: 0, giantTimer: 0,
            angle: -Math.PI / 2,
            shield: hasStartShield
        });

        Object.assign(this.player2, {
            x: cx,
            y: cy - 55,
            vx: 0, vy: 0, trail: [], invuln: 0.9, warpScale: 0,
            dashTimer: 0, dashCooldown: 0, phaseTimer: 0, miniTimer: 0, giantTimer: 0,
            angle: Math.PI / 2,
            shield: hasStartShield
        });

        this.rings.push({ x: this.player.x, y: this.player.y, r: 8, maxR: 110, alpha: 0.7, color: '#38BDF8' });
        if (this.mode === 'VERSUS') {
            this.rings.push({ x: this.player2.x, y: this.player2.y, r: 8, maxR: 110, alpha: 0.7, color: '#FBBF24' });
        }
    }

    // شروع خودکار راند بعدی در مسابقه ۳ راندی ۲ نفره
    startNextVersusRound() {
        this.currentRound++;
        this.state = 'PLAYING';
        this.lasers = [];
        this.hazards = [];
        this.pickups = [];
        this.killerEntity = null;
        this.dyingPlayer = null;
        this.introTimer = 0.65;
        this.spawnTimer = 0.9;
        this.specialSpawnTimer = 2.2;
        this.pointerP1.active = false;
        this.pointerP2.active = false;

        this.resetPlayersForRound();
        Spawner.spawnPickup(this);
        Spawner.spawnPickup(this);
        this.updateHUD();
    }

    pickNewChaosRule(forceIndex = null) {
        const pool = forceIndex !== null ? [CHAOS_RULES[forceIndex]] : CHAOS_RULES.filter(r => r.id !== this.activeChaosRule.id);
        this.activeChaosRule = pool[Math.floor(Math.random() * pool.length)];
        this.audio.playUpgrade();
        this.audio.vibrate([20, 40, 20]);
        this.rings.push({ x: this.player.x, y: this.player.y, r: 14, maxR: this.arena.w * 0.8, alpha: 0.65, color: '#C084FC' });
        this.showToast(`CHAOS SHIFT: ${this.activeChaosRule.name}`);
        this.updateHUD();
    }

    returnToMenu() {
        this.state = 'MENU';
        this.pointerP1.active = false;
        this.pointerP2.active = false;
        this.audio.setMusicDucking(false);
        document.getElementById('screen-home').classList.remove('hidden');
        document.getElementById('hud-center').classList.remove('visible');
        document.getElementById('hud-dash-hint')?.classList.remove('visible');
        document.getElementById('btn-pause').style.display = 'none';
        this.ui.refreshHomeUI();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.pointerP1.active = false;
            this.pointerP2.active = false;
            this.audio.setMusicDucking(true);
            const tag = document.getElementById('res-tag');
            tag.textContent = 'PAUSED';
            tag.className = 'result-tag';
            document.getElementById('res-heading').textContent = this.mode === 'LEVEL' ? `LEVEL ${this.currentLevelId}` : this.mode;
            document.getElementById('res-score').textContent = this.mode === 'VERSUS' ? `${this.p1Wins} - ${this.p2Wins}` : this.score;
            document.getElementById('res-sub').textContent = 'Game is paused';
            document.getElementById('res-primary-text').textContent = 'RESUME';
            document.getElementById('modal-result').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.audio.setMusicDucking(false);
            document.getElementById('modal-result').classList.add('hidden');
        }
    }

    updateHUD() {
        const el = this._hudEls || (this._hudEls = {
            score: document.getElementById('hud-score'),
            stars: document.getElementById('ui-stars'),
            combo: document.getElementById('hud-combo'),
            chaos: document.getElementById('hud-chaos'),
            bar: document.getElementById('hud-progress'),
            title: document.getElementById('hud-title')
        });

        setText(el.score, this.mode === 'VERSUS' ? `${this.p1Wins} - ${this.p2Wins}` : String(this.score));
        setText(el.stars, String(this.save.stars));
        if (el.combo) setClass(el.combo, 'combo-pill');

        if (el.chaos) {
            if (this.mode === 'CHAOS') setText(el.chaos, `${this.activeChaosRule.name} (${Math.ceil(this.chaosTimer)}s)`);
            setClass(el.chaos, `chaos-pill ${this.mode === 'CHAOS' ? 'active' : ''}`);
        }

        if (this.mode === 'LEVEL') {
            const chap = CHAPTERS.find(c => this.currentLevelId >= c.range[0] && this.currentLevelId <= c.range[1]) || CHAPTERS[0];
            setStyle(el.bar, 'width', `${Math.min(100, (this.score / this.targetScore) * 100)}%`);
            setStyle(el.bar, 'background', 'var(--text)');
            setText(el.title, `LEVEL ${this.currentLevelId} • CH.${chap.id}`);
        } else if (this.mode === 'OVERDRIVE') {
            setStyle(el.bar, 'width', `${clamp((this.overdriveTimer / this.overdriveMaxTime) * 100, 0, 100)}%`);
            setStyle(el.bar, 'background', this.overdriveTimer < 4 ? 'var(--accent)' : 'var(--blue)');
            setText(el.title, `OVERDRIVE • ${this.overdriveTimer.toFixed(1)}s`);
        } else if (this.mode === 'CHAOS') {
            setStyle(el.bar, 'width', `${clamp((this.chaosTimer / 15.0) * 100, 0, 100)}%`);
            setStyle(el.bar, 'background', 'var(--purple)');
            setText(el.title, 'CHAOS ARENA');
        } else if (this.mode === 'VERSUS') {
            setText(el.title, `ROUND ${this.currentRound} • P1 [ ${this.p1Wins} - ${this.p2Wins} ] P2 (FIRST TO 3)`);
        } else {
            setText(el.title, 'ENDLESS ARENA');
        }
    }

    showToast(msg) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => el.classList.remove('show'), 1150);
    }

    emitParticles(x, y, color, count = 12) {
        if (this.lowFx) count = Math.max(2, Math.ceil(count * 0.55));
        for (let i = 0; i < count; i++) {
            const a = rand(0, Math.PI * 2), s = rand(40, 180);
            this.particles.push({
                x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                r: rand(2, 4.5), life: 1, decay: rand(1.8, 3.2), color
            });
        }
    }

    handlePlayerHit(th, sourceEntity = null, targetPlayer = this.player) {
        const isInvuln = targetPlayer.invuln > 0 || targetPlayer.phaseTimer > 0 || targetPlayer.dashTimer > 0 ||
            (targetPlayer === this.player && (this.phaseTimer > 0 || this.dashTimer > 0));
        if (isInvuln || this.state === 'DYING' || this.state === 'ROUND_END') return false;

        if (targetPlayer.shield) {
            targetPlayer.shield = false;
            this.shieldLostThisRun = true;
            targetPlayer.invuln = 1.1;
            this.shake = 10;
            this.triggerImpactFX(targetPlayer.x, targetPlayer.y, '#34D399');
            this.audio.vibrate([30, 40, 30]);
            this.emitParticles(targetPlayer.x, targetPlayer.y, '#34D399', 18);
            this.showToast(this.mode === 'VERSUS' ? `P${targetPlayer.id} SHIELD SAVED!` : 'SHIELD SAVED YOU!');
            return false;
        }

        if (this.mode !== 'VERSUS' && this.secondWindAvailable) {
            this.secondWindAvailable = false;
            targetPlayer.invuln = 1.4;
            this.lasers = [];
            this.hazards = [];
            this.shake = 12;
            this.triggerImpactFX(targetPlayer.x, targetPlayer.y, '#C084FC');
            this.audio.playUpgrade();
            this.audio.vibrate([40, 50, 60]);
            this.emitParticles(targetPlayer.x, targetPlayer.y, '#C084FC', 26);
            this.showToast('SECOND WIND REVIVE!');
            return false;
        }

        this.state = 'DYING';
        this.deathTimer = 0.5;
        this.killerEntity = sourceEntity;
        this.dyingPlayer = targetPlayer;
        if (sourceEntity) sourceEntity.isKiller = true;
        this.pointerP1.active = false;
        this.pointerP2.active = false;
        this.shake = 6;
        this.audio.playSlowMo();
        this.audio.vibrate(40);
        this.rings.push({ x: targetPlayer.x, y: targetPlayer.y, r: 8, maxR: 70, alpha: 0.85, color: '#FF2A3B' });
        return true;
    }

    // ---------- ادامه‌ی بازی بعد از باخت با دیدن تبلیغ ----------
    shouldOfferContinue() {
        return CONTINUE.enabled &&
            CONTINUE.modes.includes(this.mode) &&
            this.continuesUsed < CONTINUE.maxPerRun &&
            this.score >= CONTINUE.minScore &&
            !this.ads.busy &&
            this.ads.isReady('continue');
    }

    beginContinueOffer() {
        this.state = 'CONTINUE_OFFER';
        this.pointerP1.active = false;
        this.pointerP2.active = false;
        this.audio.setMusicDucking(true);
        this.continueScreen.open({
            onContinue: () => this.resumeAfterContinue(),
            onDecline: () => this.finishGame('LOSE')
        });
    }

    resumeAfterContinue() {
        const p = this.dyingPlayer || this.player;
        this.continuesUsed++;
        this.state = 'PLAYING';
        this.lasers = [];
        this.hazards = [];
        this.fxBolts = [];
        this.portalRifts = [];
        this.electricWall = { side: -1, state: 'IDLE', timer: 1.6 };
        this.killerEntity = null;
        this.dyingPlayer = null;
        this.deathTimer = 0;
        this.pointerP1.active = false;
        this.pointerP2.active = false;
        p.vx = 0;
        p.vy = 0;
        p.invuln = CONTINUE.invulnSec;
        this.introTimer = CONTINUE.readySec;
        this.spawnTimer = 0.9;
        if (this.mode === 'OVERDRIVE' && this.overdriveTimer < 3) {
            this.overdriveTimer = Math.min(this.overdriveMaxTime, CONTINUE.overdriveBonusSec);
        }
        this.audio.setMusicDucking(false);
        this.audio.syncMusic();
        this.audio.playUpgrade();
        this.audio.vibrate([40, 50, 60]);
        this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 150, alpha: 0.9, color: '#FBBF24' });
        this.emitParticles(p.x, p.y, '#FBBF24', 24);
        this.showToast('KEEP GOING!');
        this.updateHUD();
    }

    finishGame(outcome) {
        this.state = 'OVER';
        this.pointerP1.active = false;
        this.pointerP2.active = false;
        this.lastOutcome = outcome;
        this.audio.setMusicDucking(true);

        const tag = document.getElementById('res-tag');
        const heading = document.getElementById('res-heading');
        const subEl = document.getElementById('res-sub');
        const btnText = document.getElementById('res-primary-text');
        document.getElementById('res-score').textContent =
            this.mode === 'VERSUS' ? `${this.p1Wins} - ${this.p2Wins}` : this.score;

        if (this.mode === 'VERSUS') {
            this.audio.playWin();
            const champId = this.p1Wins >= 3 ? 1 : 2;
            tag.textContent = 'CHAMPION CROWNED';
            tag.className = 'result-tag win';
            heading.textContent = `PLAYER ${champId} WINS!`;
            subEl.textContent = `Final Match Score: P1 [ ${this.p1Wins} - ${this.p2Wins} ] P2`;
            btnText.textContent = 'REMATCH (BEST OF 5)';
        } else if (outcome === 'WIN') {
            this.audio.playWin();
            this.triggerFinishFX(this.player.x, this.player.y);
            const bonus = 4 + Math.floor(this.currentLevelId * 0.7);
            this.save.stars += bonus;
            if (!this.shieldLostThisRun) this.save.stats.noHitWins = (this.save.stats.noHitWins || 0) + 1;
            if (this.runElapsedTime < 14.0) this.save.stats.fastWins = (this.save.stats.fastWins || 0) + 1;
            if (!this.save.completedLevels.includes(this.currentLevelId)) {
                this.save.completedLevels.push(this.currentLevelId);
            }
            if (this.currentLevelId === this.save.unlockedLevel && this.save.unlockedLevel < LEVELS.length) {
                this.save.unlockedLevel = this.currentLevelId + 1;
            }
            tag.textContent = 'COMPLETED';
            tag.className = 'result-tag win';
            heading.textContent = `LEVEL ${this.currentLevelId}`;
            subEl.textContent = `Level Bonus: +${bonus} ★`;
            btnText.textContent = this.currentLevelId < LEVELS.length ? `NEXT: LEVEL ${this.currentLevelId + 1}` : 'PLAY AGAIN';
        } else {
            this.audio.playFail();
            if (this.mode === 'ENDLESS') this.save.bestEndless = Math.max(this.save.bestEndless, this.score);
            if (this.mode === 'OVERDRIVE') this.save.bestOverdrive = Math.max(this.save.bestOverdrive || 0, this.score);
            if (this.mode === 'CHAOS') this.save.bestChaos = Math.max(this.save.bestChaos || 0, this.score);

            tag.textContent = (this.mode === 'OVERDRIVE' && this.overdriveTimer <= 0) ? 'TIME EXPIRED' : 'GAME OVER';
            tag.className = 'result-tag';
            heading.textContent = this.mode === 'LEVEL' ? `LEVEL ${this.currentLevelId}` : this.mode;
            subEl.textContent = this.mode === 'LEVEL' ? `Progress: ${this.score} / ${this.targetScore}` : `Final Score: ${this.score}`;
            btnText.textContent = 'RETRY';
        }

        SaveStore.save(this.save);
        this.updateHUD();
        this.ui.refreshHomeUI();
        setTimeout(() => {
            if (this.state === 'OVER') document.getElementById('modal-result').classList.remove('hidden');
        }, 380);
    }

    updateElectricWall(worldDt, th) {
        const ew = this.electricWall;
        ew.timer -= worldDt;
        if (ew.timer <= 0) {
            if (ew.state === 'IDLE') {
                const sides = [0, 1, 2, 3].filter(s => s !== ew.side);
                ew.side = sides[Math.floor(Math.random() * sides.length)];
                ew.state = 'WARN';
                ew.timer = 1.2;
            } else if (ew.state === 'WARN') {
                ew.state = 'ACTIVE';
                ew.timer = 3.2;
                this.shake = 5;
                this.audio.playLaserPulse();
            } else {
                ew.state = 'IDLE';
                ew.timer = 2.0;
            }
        }

        if (ew.state === 'ACTIVE') {
            const effR = this.getEffectiveRadius(this.player);
            const margin = effR + 11;
            const { x: ax, y: ay, w: aw, h: ah } = this.arena;
            const hit =
                (ew.side === 0 && this.player.y <= ay + margin) ||
                (ew.side === 1 && this.player.x >= ax + aw - margin) ||
                (ew.side === 2 && this.player.y >= ay + ah - margin) ||
                (ew.side === 3 && this.player.x <= ax + margin);

            if (hit) this.handlePlayerHit(th, ew, this.player);
        }
    }

    spawnPortalRiftPair(xIn, yIn, xOut, yOut, isVerticalWall) {
        const maxLife = 0.65;
        this.portalRifts.push(
            { x: xIn, y: yIn, vertical: isVerticalWall, life: maxLife, maxLife, rot: rand(0, 6.28) },
            { x: xOut, y: yOut, vertical: isVerticalWall, life: maxLife, maxLife, rot: rand(0, 6.28) }
        );
        this.player.warpScale = 0.35;
        this.audio.playDash();
        this.audio.vibrate(20);
        this.emitParticles(xIn, yIn, '#39FF14', 10);
        this.emitParticles(xOut, yOut, '#A3E635', 14);
        this.rings.push({ x: xOut, y: yOut, r: 6, maxR: 58, alpha: 0.85, color: '#39FF14' });
    }

    updateSinglePlayerPhysics(p, ptr, keyCfg, dt, smooth) {
        ['dashTimer', 'dashCooldown', 'phaseTimer', 'miniTimer', 'giantTimer', 'invuln', 'warpScale'].forEach(k => {
            if (p[k] > 0) p[k] = Math.max(0, p[k] - dt);
        });

        let ix = (this.keys[keyCfg.right] ? 1 : 0) - (this.keys[keyCfg.left] ? 1 : 0);
        let iy = (this.keys[keyCfg.down] ? 1 : 0) - (this.keys[keyCfg.up] ? 1 : 0);

        if (ix !== 0 || iy !== 0) {
            const l = Math.hypot(ix, iy);
            ix /= l; iy /= l;
        } else if (ptr.active) {
            const dx = ptr.x - ptr.anchorX;
            const dy = ptr.y - ptr.anchorY;
            const dist = Math.hypot(dx, dy);
            if (dist > 1.5) {
                const f = Math.min(1, dist / (4 + smooth * 32));
                ix = (dx / dist) * f;
                iy = (dy / dist) * f;
            }
        }

        if (this.mode === 'CHAOS' && this.activeChaosRule.id === 'MIRROR') {
            ix = -ix; iy = -iy;
        }

        const isDashing = p.dashTimer > 0 || (p === this.player && this.dashTimer > 0);
        if (!isDashing) {
            const inertia = smooth * 0.68;
            const isMini = p.miniTimer > 0 || (p === this.player && this.miniTimer > 0);
            const speed = p.giantTimer > 0 ? 255 : (isMini ? 375 : 315);
            p.vx = p.vx * inertia + ix * speed * (1 - inertia);
            p.vy = p.vy * inertia + iy * speed * (1 - inertia);
        }

        if (this.mode === 'CHAOS' && this.activeChaosRule.id === 'GRAVITY') {
            const gdx = this.arena.x + this.arena.w / 2 - p.x;
            const gdy = this.arena.y + this.arena.h / 2 - p.y;
            const gDist = Math.hypot(gdx, gdy);
            if (gDist > 8) {
                p.vx += (gdx / gDist) * 115 * dt;
                p.vy += (gdy / gDist) * 115 * dt;
            }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (Math.hypot(p.vx, p.vy) > 15) {
            p.angle = Math.atan2(p.vy, p.vx);
        }

        const effR = this.getEffectiveRadius(p);
        const pad = effR + 4;

        if (p === this.player && this.isPortalChapter()) {
            const minX = this.arena.x + pad, maxX = this.arena.x + this.arena.w - pad;
            const minY = this.arena.y + pad, maxY = this.arena.y + this.arena.h - pad;
            let warped = false;

            if (p.x < minX) {
                const y = p.y; p.x = maxX - 3;
                this.spawnPortalRiftPair(this.arena.x + 4, y, this.arena.x + this.arena.w - 4, y, true);
                warped = true;
            } else if (p.x > maxX) {
                const y = p.y; p.x = minX + 3;
                this.spawnPortalRiftPair(this.arena.x + this.arena.w - 4, y, this.arena.x + 4, y, true);
                warped = true;
            }
            if (p.y < minY) {
                const x = p.x; p.y = maxY - 3;
                this.spawnPortalRiftPair(x, this.arena.y + 4, x, this.arena.y + this.arena.h - 4, false);
                warped = true;
            } else if (p.y > maxY) {
                const x = p.x; p.y = minY + 3;
                this.spawnPortalRiftPair(x, this.arena.y + this.arena.h - 4, x, this.arena.y + 4, false);
                warped = true;
            }

            if (warped) {
                p.trail = [];
                if (ptr.active) { ptr.anchorX = ptr.x; ptr.anchorY = ptr.y; }
            }
        } else {
            p.x = clamp(p.x, this.arena.x + pad, this.arena.x + this.arena.w - pad);
            p.y = clamp(p.y, this.arena.y + pad, this.arena.y + this.arena.h - pad);
        }

        p.trail.unshift({ x: p.x, y: p.y, hue: (performance.now() * 0.2) % 360 });
        if (p.trail.length > 16) p.trail.pop();
    }

    update(dt) {
        if (this.chromaticFlash > 0) this.chromaticFlash = Math.max(0, this.chromaticFlash - dt * 5);
        if (this.hitStopTimer > 0) { this.hitStopTimer -= dt; return; }
        if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 28);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= 0.94; p.vy *= 0.94;
            p.life -= p.decay * dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.rings.length - 1; i >= 0; i--) {
            const r = this.rings[i];
            r.r += (r.maxR - r.r) * 8 * dt;
            r.alpha -= 1.2 * dt;
            if (r.alpha <= 0) this.rings.splice(i, 1);
        }

        for (let i = this.fxBolts.length - 1; i >= 0; i--) {
            this.fxBolts[i].alpha -= dt * 2.4;
            if (this.fxBolts[i].alpha <= 0) this.fxBolts.splice(i, 1);
        }

        for (let i = this.portalRifts.length - 1; i >= 0; i--) {
            const pr = this.portalRifts[i];
            pr.life -= dt;
            pr.rot += dt * 7;
            if (pr.life <= 0) this.portalRifts.splice(i, 1);
        }

        // مکث کوتاه بین راندهای مود ۲ نفره و شروع خودکار راند بعدی
        if (this.state === 'ROUND_END') {
            this.roundTransitionTimer -= dt;
            if (this.roundTransitionTimer <= 0) {
                this.startNextVersusRound();
            }
            return;
        }

        if (this.state === 'DYING') {
            const slowDt = dt * 0.12;
            this.lasers.forEach(l => {
                if (l.state === 'FIRE') {
                    l.x1 += l.vx * slowDt; l.x2 += l.vx * slowDt;
                    l.y1 += l.vy * slowDt; l.y2 += l.vy * slowDt;
                }
            });
            this.hazards.forEach(h => {
                if (h.state === 'FIRE') {
                    if (h.vx) { h.x += h.vx * slowDt; h.y += h.vy * slowDt; }
                    if (h.vRot) h.angle += h.vRot * slowDt;
                    if (h.kind === 'ringwave') h.r += 110 * slowDt;
                }
            });

            this.deathTimer -= dt;
            if (this.deathTimer <= 0) {
                const deadP = this.dyingPlayer || this.player;
                this.shake = 16;
                this.chromaticFlash = 1.0;
                this.audio.vibrate([70, 40, 100]);
                this.triggerFinishFX(deadP.x, deadP.y);

                // بررسی امتیاز راند در مود ۲ نفره (اولین بازیکن که به ۳ برد برسد قهرمان می‌شود)
                if (this.mode === 'VERSUS') {
                    const winnerId = deadP.id === 1 ? 2 : 1;
                    if (winnerId === 1) this.p1Wins++;
                    else this.p2Wins++;
                    this.roundWinnerId = winnerId;
                    this.updateHUD();

                    if (this.p1Wins >= 3 || this.p2Wins >= 3) {
                        this.finishGame('WIN');
                    } else {
                        this.audio.playWin();
                        this.lasers = [];
                        this.hazards = [];
                        this.state = 'ROUND_END';
                        this.roundTransitionTimer = 1.75;
                    }
                    return;
                }

                if (this.shouldOfferContinue()) this.beginContinueOffer();
                else this.finishGame('LOSE');
            }
            return;
        }

        if (this.state === 'MENU') {
            this.menuGridOffset = (this.menuGridOffset + dt * 14) % 44;
            return;
        }
        if (this.state !== 'PLAYING') return;

        this.runElapsedTime += dt;
        ['introTimer', 'slowTimer', 'phaseTimer', 'miniTimer', 'dashTimer', 'dashCooldown'].forEach(k => {
            if (this[k] > 0) this[k] = Math.max(0, this[k] - dt);
        });

        if (this.mode === 'CHAOS') {
            if ((this.chaosTimer -= dt) <= 0) {
                this.chaosTimer = 15.0;
                this.pickNewChaosRule();
            }
            this.updateHUD();
        }

        if (this.mode === 'OVERDRIVE') {
            this.overdriveTimer = Math.max(0, this.overdriveTimer - dt);
            this.updateHUD();
            if (this.overdriveTimer <= 0) {
                this.handlePlayerHit(this.getActiveTheme(), null, this.player);
                return;
            }
        }

        if (this.mode !== 'OVERDRIVE') {
            if ((this.specialSpawnTimer -= dt) <= 0) {
                Spawner.spawnSpecialPickup(this);
                this.specialSpawnTimer = this.mode === 'VERSUS' ? rand(3.6, 5.4) : rand(6.5, 9.0);
            }
        }

        const smooth = clamp((this.save.settings.smoothness ?? 100) / 100, 0, 1);

        if (this.mode === 'VERSUS') {
            this.updateSinglePlayerPhysics(
                this.player,
                this.pointerP1,
                { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS' },
                dt, smooth
            );
            this.updateSinglePlayerPhysics(
                this.player2,
                this.pointerP2,
                { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' },
                dt, smooth
            );
        } else {
            const singleKeys = {
                left: this.keys.ArrowLeft ? 'ArrowLeft' : 'KeyA',
                right: this.keys.ArrowRight ? 'ArrowRight' : 'KeyD',
                up: this.keys.ArrowUp ? 'ArrowUp' : 'KeyW',
                down: this.keys.ArrowDown ? 'ArrowDown' : 'KeyS'
            };
            this.updateSinglePlayerPhysics(this.player, this.pointerP1, singleKeys, dt, smooth);
        }

        if (this.introTimer > 0) return;

        const chaosSpeedMult = (this.mode === 'CHAOS' && this.activeChaosRule.id === 'HYPER') ? 1.55 : 1.0;
        const worldDt = (this.slowTimer > 0 ? dt * 0.38 : dt) * chaosSpeedMult;
        const th = this.getActiveTheme();

        if (this.isElectricChapter()) {
            this.updateElectricWall(worldDt, th);
            if (this.state !== 'PLAYING') return;
        }

        if ((this.spawnTimer -= worldDt) <= 0) {
            Spawner.spawnPattern(this);
            this.spawnTimer = this.mode === 'LEVEL'
                ? LEVELS[this.currentLevelId - 1].rate
                : (this.mode === 'OVERDRIVE' ? Math.max(0.45, 0.92 - this.score * 0.008) : Math.max(0.5, 1.25 - this.score * 0.012));
        }

        EntityUpdater.updateAll(this, dt, worldDt, th);
    }

    loop(now) {
        requestAnimationFrame(this._raf);

        // ۱) سقف فریم‌ریت: روی صفحه‌های ۹۰/۱۲۰ هرتز هم بیشتر از ~۶۰ فریم رسم نمی‌کنیم (منو: ۳۰)
        const frameMs = this.state === 'MENU' ? 33.2 : 16.0;
        if (now + 1.5 < this.nextDue) return;
        this.nextDue += frameMs;
        if (this.nextDue < now - frameMs) this.nextDue = now;

        const rawMs = now - this.lastTime;
        this.lastTime = now;

        // ۲) dt: پرش‌های بزرگ (GC، برگشت از پس‌زمینه) بریده و نوسان‌های کوچک هموار می‌شود
        const dt = Math.min(rawMs / 1000, 1 / 30);
        if (this.dtSmooth === 0 || Math.abs(dt - this.dtSmooth) > this.dtSmooth) this.dtSmooth = dt;
        else this.dtSmooth += (dt - this.dtSmooth) * 0.25;

        this.update(this.dtSmooth);
        ArenaRenderer.draw(this);

        // ۳) کیفیت تطبیقی: اگر در حین بازی میانگین فریم‌تایم از ~۲۲ms بیشتر بود، رزولوشن بوم کم می‌شود
        if (this.state !== 'MENU' && this.state !== 'PAUSED' && rawMs < 250) {
            this._perfAcc += rawMs;
            if (++this._perfN >= 45) {
                const avg = this._perfAcc / this._perfN;
                this._perfAcc = 0;
                this._perfN = 0;
                if (this._perfWarm > 0) this._perfWarm--;
                else if (avg > 22 && this.lowerRenderScale()) this._perfWarm = 2;
            }
        }
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => { window.game = new DodgeGame(); });
} else {
    window.game = new DodgeGame();
}
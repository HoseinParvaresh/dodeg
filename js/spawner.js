import { LEVELS } from './levels.js';
import { clipSegment, clamp, rand } from './math.js';

export class Spawner {
    static getUnlockedPowerups(g) {
        if (g.mode === 'VERSUS') {
            // در مود ۲ نفره، آیتم‌های تهاجمی (خرابکاری روی رقیب) اولویت بالایی دارند
            return ['atk_seeker', 'atk_sniper', 'atk_giant', 'atk_seeker', 'atk_giant', 'shield', 'phase', 'mini'];
        }

        const effLvl = g.mode === 'LEVEL' ? g.currentLevelId : (1 + Math.floor(g.score * 1.5));
        const pool = ['shield'];
        if (effLvl >= 11) pool.push('slow');
        if (effLvl >= 21) pool.push('emp');
        if (effLvl >= 31) pool.push('phase');
        if (effLvl >= 41) pool.push('mini');

        return pool.filter(t => !(
            (t === 'shield' && g.player.shield) ||
            (t === 'slow' && g.slowTimer > 0) ||
            (t === 'phase' && g.phaseTimer > 0) ||
            (t === 'mini' && g.miniTimer > 0)
        ));
    }

    static spawnSpecialPickup(g) {
        const maxSpecials = g.mode === 'VERSUS' ? 2 : 1;
        if (g.mode === 'OVERDRIVE' || g.pickups.filter(p => p.isSpecial).length >= maxSpecials) return;
        const candidates = this.getUnlockedPowerups(g);
        if (!candidates.length) return;
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const pos = this.findSafePos(g, 42, 80);
        g.pickups.push({ ...pos, r: 13, type: chosen, isSpecial: true, phase: 0, life: 9.5, maxLife: 9.5 });
    }

    static spawnPickup(g) {
        const pos = this.findSafePos(g, 34, 75);
        const isOv = g.mode === 'OVERDRIVE';
        g.pickups.push({ ...pos, r: isOv ? 9 : 7, type: isOv ? 'overdrive_node' : 'star', isSpecial: false, phase: rand(0, 6.28) });
    }

    static findSafePos(g, pad, minDist) {
        let x, y, tries = 0;
        do {
            x = rand(g.arena.x + pad, g.arena.x + g.arena.w - pad);
            y = rand(g.arena.y + pad, g.arena.y + g.arena.h - pad);
            tries++;
        } while (Math.hypot(x - g.player.x, y - g.player.y) < minDist && tries < 14);
        return { x, y };
    }

    static spawnPattern(g) {
        let cfg;
        if (g.mode === 'LEVEL') {
            cfg = LEVELS[g.currentLevelId - 1];
        } else {
            const pool = ['axis', 'diag', 'twin', 'bomb', 'cross'];
            if (g.score >= 8 || g.mode === 'VERSUS') pool.push('sweep', 'orb', 'vortex', 'sniper');
            if (g.score >= 16) pool.push('spinner', 'nova', 'grid', 'ringwave');
            if (g.score >= 25) pool.push('meteor', 'omega', 'prism', 'rift');
            if (g.score >= 35) pool.push('seeker', 'splitter', 'cage', 'pendulum', 'tesla', 'helix');
            cfg = { charge: Math.max(0.56, 0.95 - g.score * 0.005), types: pool };
        }

        const type = cfg.types[Math.floor(Math.random() * cfg.types.length)];
        const { x: ax, y: ay, w: aw, h: ah } = g.arena;
        const players = g.getActivePlayers ? g.getActivePlayers() : [g.player];
        const targetPlayer = players[Math.floor(Math.random() * players.length)];
        const tx = Math.random() < 0.68 ? targetPlayer.x : rand(ax + 32, ax + aw - 32);
        const ty = Math.random() < 0.68 ? targetPlayer.y : rand(ay + 32, ay + ah - 32);

        const addBeam = (x1, y1, x2, y2, extra = {}) => g.lasers.push({
            x1, y1, x2, y2, charge: 0, chargeTime: extra.chargeTime || cfg.charge,
            active: 0, activeTime: extra.activeTime || 0.28,
            state: 'WARN', vx: extra.vx || 0, vy: extra.vy || 0,
            sniper: !!extra.sniper, targetPlayer: extra.targetPlayer || targetPlayer
        });

        if (type === 'axis') {
            Math.random() < 0.5 ? addBeam(ax, ty, ax + aw, ty) : addBeam(tx, ay, tx, ay + ah);
        } else if (type === 'twin') {
            const gap = 46;
            if (Math.random() < 0.5) {
                const cy = clamp(ty, ay + 62, ay + ah - 62);
                addBeam(ax, cy - gap, ax + aw, cy - gap); addBeam(ax, cy + gap, ax + aw, cy + gap);
            } else {
                const cx = clamp(tx, ax + 62, ax + aw - 62);
                addBeam(cx - gap, ay, cx - gap, ay + ah); addBeam(cx + gap, ay, cx + gap, ay + ah);
            }
        } else if (type === 'diag') {
            const s = Math.random() < 0.5 ? 1 : -1;
            const seg = clipSegment(g.arena, tx - aw, ty - s * aw, tx + aw, ty + s * aw);
            if (seg) addBeam(seg.x1, seg.y1, seg.x2, seg.y2);
        } else if (type === 'cross') {
            addBeam(ax, ty, ax + aw, ty); addBeam(tx, ay, tx, ay + ah);
        } else if (type === 'bomb') {
            g.hazards.push({ kind: 'bomb', x: clamp(tx, ax + 52, ax + aw - 52), y: clamp(ty, ay + 52, ay + ah - 52), r: 56, charge: 0, chargeTime: cfg.charge * 1.15, active: 0, activeTime: 0.26, state: 'WARN' });
        } else if (type === 'sweep') {
            const spd = 76, first = Math.random() < 0.5;
            if (Math.random() < 0.5) addBeam(ax, first ? ay + 36 : ay + ah - 36, ax + aw, first ? ay + 36 : ay + ah - 36, { vy: first ? spd : -spd, activeTime: 0.85 });
            else addBeam(first ? ax + 36 : ax + aw - 36, ay, first ? ax + 36 : ax + aw - 36, ay + ah, { vx: first ? spd : -spd, activeTime: 0.85 });
        } else if (type === 'orb' || type === 'meteor') {
            const isM = type === 'meteor', spd = isM ? 340 : 195;
            const ox = Math.random() < 0.5 ? ax + 22 : ax + aw - 22, oy = rand(ay + 36, ay + ah - 36);
            const aim = Math.atan2(targetPlayer.y - oy, targetPlayer.x - ox);
            g.hazards.push({ kind: type, x: ox, y: oy, vx: Math.cos(aim) * spd, vy: Math.sin(aim) * spd, r: isM ? 12 : 10, charge: 0, chargeTime: cfg.charge * 0.82, bouncesLeft: 3, state: 'WARN', trail: [] });
        } else if (type === 'vortex') {
            g.hazards.push({ kind: 'vortex', x: rand(ax + 75, ax + aw - 75), y: rand(ay + 75, ay + ah - 75), r: 20, pullRadius: 155, charge: 0, chargeTime: cfg.charge * 1.1, active: 0, activeTime: 2.8, state: 'WARN', rot: 0 });
        } else if (type === 'sniper') {
            const ang = rand(0, Math.PI), d = aw * 1.5;
            const seg = clipSegment(g.arena, targetPlayer.x - Math.cos(ang) * d, targetPlayer.y - Math.sin(ang) * d, targetPlayer.x + Math.cos(ang) * d, targetPlayer.y + Math.sin(ang) * d);
            if (seg) addBeam(seg.x1, seg.y1, seg.x2, seg.y2, { sniper: true, targetPlayer });
        } else if (type === 'spinner' || type === 'omega' || type === 'prism') {
            g.hazards.push({ kind: type, x: rand(ax + 75, ax + aw - 75), y: rand(ay + 75, ay + ah - 75), len: aw * 0.4, angle: rand(0, Math.PI), vRot: (Math.random() < 0.5 ? 1 : -1) * 1.8, charge: 0, chargeTime: cfg.charge * 1.1, active: 0, activeTime: 1.8, state: 'WARN' });
        } else if (type === 'nova') {
            g.hazards.push({ kind: 'nova', x: rand(ax + 65, ax + aw - 65), y: rand(ay + 65, ay + ah - 65), r: 22, baseAng: rand(0, Math.PI), charge: 0, chargeTime: cfg.charge * 1.15, state: 'WARN' });
        } else if (type === 'grid') {
            const horiz = Math.random() < 0.5, step = ah / 4;
            for (let k = 1; k <= 3; k++) horiz ? addBeam(ax, ay + k * step, ax + aw, ay + k * step) : addBeam(ax + k * step, ay, ax + k * step, ay + ah);
        } else if (type === 'ringwave') {
            g.hazards.push({ kind: 'ringwave', x: rand(ax + 60, ax + aw - 60), y: rand(ay + 60, ay + ah - 60), r: 10, maxR: aw * 0.23, charge: 0, chargeTime: cfg.charge, state: 'WARN' });
        } else if (type === 'rift') {
            addBeam(ax, ay + 18, ax + aw, ay + 18, { vy: 88, activeTime: 1.05 });
            addBeam(ax, ay + ah - 18, ax + aw, ay + ah - 18, { vy: -88, activeTime: 1.05 });
        } else if (type === 'seeker') {
            const side = Math.floor(Math.random() * 4);
            const sx = side === 0 ? ax + 20 : (side === 1 ? ax + aw - 20 : rand(ax + 40, ax + aw - 40));
            const sy = side === 2 ? ay + 20 : (side === 3 ? ay + ah - 20 : rand(ay + 40, ay + ah - 40));
            const angle = Math.atan2(targetPlayer.y - sy, targetPlayer.x - sx);
            g.hazards.push({
                kind: 'seeker', x: sx, y: sy, angle, speed: 185, r: 9,
                charge: 0, chargeTime: cfg.charge * 0.9,
                active: 0, activeTime: 3.1, state: 'WARN', trail: [], targetPlayer
            });
        } else if (type === 'splitter') {
            const sx = Math.random() < 0.5 ? ax + 28 : ax + aw - 28;
            const sy = rand(ay + 50, ay + ah - 50);
            const aim = Math.atan2(ay + ah / 2 - sy, ax + aw / 2 - sx);
            g.hazards.push({
                kind: 'splitter', x: sx, y: sy,
                vx: Math.cos(aim) * 125, vy: Math.sin(aim) * 125,
                r: 13, charge: 0, chargeTime: cfg.charge * 0.85,
                splitTimer: 1.15, state: 'WARN'
            });
        } else if (type === 'cage') {
            const half = 54;
            const cx = clamp(tx, ax + half + 20, ax + aw - half - 20);
            const cy = clamp(ty, ay + half + 20, ay + ah - half - 20);
            addBeam(cx - half, cy - half, cx + half, cy - half, { activeTime: 0.38 });
            addBeam(cx + half, cy - half, cx + half, cy + half, { activeTime: 0.38 });
            addBeam(cx + half, cy + half, cx - half, cy + half, { activeTime: 0.38 });
            addBeam(cx - half, cy + half, cx - half, cy - half, { activeTime: 0.38 });
        } else if (type === 'pendulum') {
            const topMount = Math.random() < 0.5;
            g.hazards.push({
                kind: 'pendulum',
                x: ax + aw / 2,
                y: topMount ? ay + 6 : ay + ah - 6,
                baseAngle: topMount ? Math.PI / 2 : -Math.PI / 2,
                swingAmp: 0.95,
                len: ah * 0.34,
                charge: 0, chargeTime: cfg.charge * 1.1,
                active: 0, activeTime: 2.4, state: 'WARN'
            });
        } else if (type === 'tesla') {
            const span = 96;
            const cx = rand(ax + 75, ax + aw - 75);
            const cy = rand(ay + 65, ay + ah - 65);
            const horiz = Math.random() < 0.5;
            const dir = Math.random() < 0.5 ? 1 : -1;
            g.hazards.push({
                kind: 'tesla',
                x1: horiz ? cx - span * 0.5 : cx,
                y1: horiz ? cy : cy - span * 0.5,
                x2: horiz ? cx + span * 0.5 : cx,
                y2: horiz ? cy : cy + span * 0.5,
                vx: horiz ? 0 : dir * 68,
                vy: horiz ? dir * 68 : 0,
                charge: 0, chargeTime: cfg.charge,
                active: 0, activeTime: 2.3, state: 'WARN'
            });
        } else if (type === 'helix') {
            g.hazards.push({
                kind: 'helix',
                x: rand(ax + 85, ax + aw - 85),
                y: rand(ay + 85, ay + ah - 85),
                len: aw * 0.32,
                offset: 13,
                angle: rand(0, Math.PI),
                vRot: (Math.random() < 0.5 ? 1 : -1) * 1.95,
                charge: 0, chargeTime: cfg.charge * 1.1,
                active: 0, activeTime: 2.1, state: 'WARN'
            });
        }
    }
}
import { clipSegment } from './math.js';
import { PlayerRenderer } from './playerRenderer.js';

export class ArenaRenderer {
    static drawBeam(ctx, x1, y1, x2, y2, isWarn, prog, color, sonarVis = 1, width = 18, isKiller = false) {
        if (isWarn) {
            ctx.strokeStyle = color;
            ctx.globalAlpha = (0.18 + prog * 0.45) * sonarVis;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.globalAlpha = (prog * 0.3) * sonarVis;
            ctx.lineWidth = 10 * prog;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else {
            const flash = isKiller && Math.floor(performance.now() / 45) % 2 === 0;
            const outerCol = isKiller ? (flash ? '#FFFFFF' : '#FF1E38') : color;
            const coreCol = isKiller ? (flash ? '#FF1E38' : '#FFFFFF') : '#FFFFFF';

            ctx.strokeStyle = outerCol;
            ctx.globalAlpha = isKiller ? 0.85 : 0.34;
            ctx.lineWidth = isKiller ? width * 1.45 : width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.strokeStyle = coreCol;
            ctx.globalAlpha = 1;
            ctx.lineWidth = isKiller ? width * 0.5 : width * 0.3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    static drawMenuScene(ctx, g) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        const step = 44;
        for (let x = (g.menuGridOffset % step); x < g.width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, g.height);
            ctx.stroke();
        }
        for (let y = (g.menuGridOffset % step); y < g.height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(g.width, y);
            ctx.stroke();
        }
    }

    static drawElectricWall(ctx, g) {
        const ew = g.electricWall;
        if (!ew || ew.state === 'IDLE' || ew.side < 0) return;

        const { x: ax, y: ay, w: aw, h: ah } = g.arena;
        let x1 = ax, y1 = ay, x2 = ax + aw, y2 = ay;
        if (ew.side === 1) { x1 = ax + aw; y1 = ay; x2 = ax + aw; y2 = ay + ah; }
        else if (ew.side === 2) { x1 = ax; y1 = ay + ah; x2 = ax + aw; y2 = ay + ah; }
        else if (ew.side === 3) { x1 = ax; y1 = ay; x2 = ax; y2 = ay + ah; }

        if (ew.state === 'WARN') {
            const pulse = 0.35 + 0.65 * Math.abs(Math.sin(performance.now() * 0.012));
            ctx.strokeStyle = '#FF2A3B';
            ctx.globalAlpha = pulse * 0.85;
            ctx.lineWidth = 5;
            ctx.setLineDash([10, 8]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            return;
        }

        const isK = !!ew.isKiller && Math.floor(performance.now() / 45) % 2 === 0;
        ctx.strokeStyle = isK ? '#FFFFFF' : '#FF1E38';
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const segments = 18;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        const nx = ew.side === 1 ? -1 : (ew.side === 3 ? 1 : 0);
        const ny = ew.side === 2 ? -1 : (ew.side === 0 ? 1 : 0);

        for (let bolt = 0; bolt < 2; bolt++) {
            ctx.strokeStyle = bolt === 0 ? '#FF2A3B' : '#FFFFFF';
            ctx.globalAlpha = bolt === 0 ? 0.95 : 1;
            ctx.lineWidth = bolt === 0 ? 4 : 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            for (let i = 1; i < segments; i++) {
                const jitter = (Math.random() - 0.2) * (bolt === 0 ? 14 : 9);
                ctx.lineTo(x1 + dx * i + nx * jitter, y1 + dy * i + ny * jitter);
            }
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    static drawPortalBorders(ctx, g) {
        const { x: ax, y: ay, w: aw, h: ah } = g.arena;
        const t = performance.now() * 0.004;

        ctx.save();
        ctx.strokeStyle = '#10B981';
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 14;
        ctx.strokeRect(ax + 2, ay + 2, aw - 4, ah - 4);

        const walls = [
            { x1: ax, y1: ay, x2: ax + aw, y2: ay, nx: 0, ny: 1 },
            { x1: ax + aw, y1: ay, x2: ax + aw, y2: ay + ah, nx: -1, ny: 0 },
            { x1: ax + aw, y1: ay + ah, x2: ax, y2: ay + ah, nx: 0, ny: -1 },
            { x1: ax, y1: ay + ah, x2: ax, y2: ay, nx: 1, ny: 0 }
        ];

        walls.forEach((w, wIdx) => {
            const steps = 28;
            const dx = (w.x2 - w.x1) / steps;
            const dy = (w.y2 - w.y1) / steps;

            ctx.strokeStyle = '#39FF14';
            ctx.globalAlpha = 0.85;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const wave = Math.sin(i * 0.6 + t * 2.2 + wIdx) * 4.5 + 3.5;
                const px = w.x1 + dx * i + w.nx * wave;
                const py = w.y1 + dy * i + w.ny * wave;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();

            ctx.strokeStyle = '#D9F99D';
            ctx.globalAlpha = 0.9;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const wave = Math.cos(i * 0.75 - t * 2.8 + wIdx) * 3.5 + 3.5;
                const px = w.x1 + dx * i + w.nx * wave;
                const py = w.y1 + dy * i + w.ny * wave;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        });
        ctx.restore();
    }

    static drawPortalRifts(ctx, g) {
        if (!g.portalRifts || !g.portalRifts.length) return;

        g.portalRifts.forEach(pr => {
            const ratio = pr.life / pr.maxLife;
            const scale = ratio > 0.8 ? (1 - ratio) * 5 : ratio / 0.8;
            const rx = (pr.vertical ? 13 : 34) * scale;
            const ry = (pr.vertical ? 34 : 13) * scale;

            ctx.save();
            ctx.translate(pr.x, pr.y);

            ctx.fillStyle = '#10B981';
            ctx.globalAlpha = 0.45 * scale;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx * 1.35, ry * 1.35, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#39FF14';
            ctx.strokeStyle = '#BEF264';
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.92;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#A3E635';
            ctx.beginPath();
            ctx.ellipse(
                Math.cos(pr.rot) * rx * 0.2,
                Math.sin(pr.rot) * ry * 0.2,
                rx * 0.65,
                ry * 0.65,
                0, 0, Math.PI * 2
            );
            ctx.fill();

            ctx.fillStyle = '#ecfccb';
            ctx.beginPath();
            ctx.ellipse(
                -Math.sin(pr.rot * 1.3) * rx * 0.18,
                Math.cos(pr.rot * 1.3) * ry * 0.18,
                rx * 0.32,
                ry * 0.32,
                0, 0, Math.PI * 2
            );
            ctx.fill();

            ctx.restore();
        });
        ctx.globalAlpha = 1;
    }

    static draw(g) {
        const ctx = g.ctx;
        const th = g.getActiveTheme();

        ctx.fillStyle = th.bg;
        ctx.fillRect(0, 0, g.width, g.height);

        if (g.state === 'MENU') {
            this.drawMenuScene(ctx, g);
            return;
        }

        if (g.mode === 'VERSUS') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(0, g.height / 2);
            ctx.lineTo(g.width, g.height / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '700 10px Outfit, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
            ctx.fillText('▲ P2 TOUCH ZONE (TOP)', g.width - 16, g.height / 2 - 8);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.fillText('▼ P1 TOUCH ZONE (BOTTOM)', g.width - 16, g.height / 2 + 16);
            ctx.restore();
        }

        ctx.save();
        if (g.shake > 0) {
            ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
        }

        const cx = g.arena.x + g.arena.w / 2;
        const cy = g.arena.y + g.arena.h / 2;

        ctx.save();
        if (g.introTimer > 0) {
            const introScale = 0.86 + 0.14 * (1 - Math.pow(g.introTimer / g.introMaxTime, 2));
            ctx.translate(cx, cy);
            ctx.scale(introScale, introScale);
            ctx.translate(-cx, -cy);
        }

        ctx.fillStyle = th.arena;
        if (g.state === 'DYING' || g.state === 'CONTINUE_OFFER') {
            ctx.strokeStyle = '#FF1E38';
            ctx.lineWidth = 3;
        } else if (g.chromaticFlash > 0) {
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 3;
        } else if (g.isPortalChapter && g.isPortalChapter()) {
            ctx.strokeStyle = '#39FF14';
            ctx.lineWidth = 2.5;
        } else if (g.mode === 'CHAOS') {
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
            ctx.lineWidth = 1.8;
        } else {
            ctx.strokeStyle = g.slowTimer > 0 ? 'rgba(96, 165, 250, 0.45)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1.5;
        }

        ctx.beginPath();
        ctx.roundRect(g.arena.x, g.arena.y, g.arena.w, g.arena.h, g.arena.r);
        ctx.fill();
        ctx.stroke();

        if (g.chromaticFlash > 0) {
            ctx.save();
            ctx.globalAlpha = g.chromaticFlash * 0.7;
            ctx.strokeStyle = '#FF5A5F';
            ctx.lineWidth = 2;
            ctx.strokeRect(g.arena.x - 3, g.arena.y - 1, g.arena.w, g.arena.h);
            ctx.strokeStyle = '#38BDF8';
            ctx.strokeRect(g.arena.x + 3, g.arena.y + 1, g.arena.w, g.arena.h);
            ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(g.arena.x, g.arena.y, g.arena.w, g.arena.h, g.arena.r);
        ctx.clip();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        const step = 32;
        for (let x = g.arena.x + step; x < g.arena.x + g.arena.w; x += step) {
            for (let y = g.arena.y + step; y < g.arena.y + g.arena.h; y += step) {
                ctx.beginPath();
                ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (g.isPortalChapter && g.isPortalChapter()) {
            this.drawPortalBorders(ctx, g);
            this.drawPortalRifts(ctx, g);
        }

        if (g.isElectricChapter && g.isElectricChapter()) {
            this.drawElectricWall(ctx, g);
        }

        if (g.mode === 'CHAOS' && g.activeChaosRule.id === 'GRAVITY') {
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.22)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(cx, cy, 48 + Math.sin(performance.now() * 0.006) * 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        g.rings.forEach(r => {
            ctx.strokeStyle = r.color;
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(r.x, r.y, Math.max(1, r.r), 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;

        if (g.fxBolts && g.fxBolts.length) {
            g.fxBolts.forEach(b => {
                ctx.strokeStyle = b.color;
                ctx.globalAlpha = Math.max(0, b.alpha);
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                b.pts.forEach((pt, idx) => idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
                ctx.stroke();
            });
            ctx.globalAlpha = 1;
        }

        g.pickups.forEach(p => PlayerRenderer.drawPickup(ctx, p, g));

        const stealthRule = g.mode === 'CHAOS' && g.activeChaosRule.id === 'STEALTH';
        const sonarVis = stealthRule ? (0.12 + 0.88 * Math.pow(Math.max(0, Math.sin(performance.now() * 0.005)), 6)) : 1;

        g.lasers.forEach(l => {
            this.drawBeam(ctx, l.x1, l.y1, l.x2, l.y2, l.state === 'WARN', l.charge / l.chargeTime, th.laser, sonarVis, 20, !!l.isKiller);
        });

        this.drawHazards(ctx, g, th, sonarVis);

        if (g.state === 'PLAYING' || g.state === 'PAUSED' || g.state === 'DYING' || g.state === 'CONTINUE_OFFER' || g.state === 'INTRO_MODAL' || g.state === 'ROUND_END') {
            g.getActivePlayers().forEach(p => {
                if (g.state === 'ROUND_END' && g.dyingPlayer === p) return;
                PlayerRenderer.drawTrail(ctx, g, th, p);

                ctx.save();
                if (p.warpScale > 0) {
                    const ws = 1 + Math.sin((p.warpScale / 0.35) * Math.PI) * 0.45;
                    ctx.translate(p.x, p.y);
                    ctx.scale(ws, 2 - ws * 0.7);
                    ctx.translate(-p.x, -p.y);
                }
                PlayerRenderer.drawPlayer(ctx, g, th, p);
                ctx.restore();

                if ((g.state === 'DYING' || g.state === 'CONTINUE_OFFER') && g.dyingPlayer === p) {
                    const flash = Math.floor(performance.now() / 45) % 2 === 0;
                    ctx.strokeStyle = flash ? '#FFFFFF' : '#FF1E38';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, g.getEffectiveRadius(p) + 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        g.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
            if (p.shape === 'square') {
                ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
            } else if (p.shape === 'star') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.life * 4);
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const rad = i % 2 === 0 ? p.r * 1.4 : p.r * 0.5;
                    const a = (i * Math.PI) / 4;
                    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
                    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;

        if (g.introTimer > 0 && g.state === 'PLAYING') {
            const ratio = g.introTimer / g.introMaxTime;
            ctx.fillStyle = th.player;
            ctx.globalAlpha = ratio * 0.22;
            ctx.fillRect(g.player.x - 16 * ratio, g.arena.y, 32 * ratio, g.arena.h);

            ctx.globalAlpha = Math.min(1, ratio * 1.8);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '800 26px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const readyLabel = g.mode === 'VERSUS' ? `ROUND ${g.currentRound}` : 'READY';
            ctx.fillText(g.introTimer > 0.32 ? readyLabel : 'FIGHT!', cx, cy - 36);
            ctx.globalAlpha = 1;
        }

        // بنر اعلام برنده راند در مود ۲ نفره (قبل از شروع راند بعدی)
        if (g.state === 'ROUND_END' && g.mode === 'VERSUS') {
            ctx.save();
            ctx.fillStyle = 'rgba(12, 13, 16, 0.72)';
            ctx.fillRect(g.arena.x, cy - 58, g.arena.w, 116);

            const winCol = g.roundWinnerId === 1 ? '#38BDF8' : '#FBBF24';
            ctx.strokeStyle = winCol;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(g.arena.x, cy - 58); ctx.lineTo(g.arena.x + g.arena.w, cy - 58);
            ctx.moveTo(g.arena.x, cy + 58); ctx.lineTo(g.arena.x + g.arena.w, cy + 58);
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillStyle = winCol;
            ctx.font = '800 13px Outfit, sans-serif';
            ctx.fillText(`ROUND ${g.currentRound} WINNER`, cx, cy - 26);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 26px Outfit, sans-serif';
            ctx.fillText(`PLAYER ${g.roundWinnerId} SCORES!`, cx, cy + 6);

            ctx.fillStyle = '#9CA3AF';
            ctx.font = '700 14px Outfit, sans-serif';
            ctx.fillText(`P1 [ ${g.p1Wins}  -  ${g.p2Wins} ] P2   •   FIRST TO 3`, cx, cy + 34);
            ctx.restore();
        }

        ctx.restore();
        ctx.restore();
        ctx.restore();
    }

    static drawHazards(ctx, g, th, sonarVis) {
        g.hazards.forEach(h => {
            const prog = Math.min(1, h.charge / h.chargeTime);
            const isWarn = h.state === 'WARN';
            const isK = !!h.isKiller;
            const kFlash = isK && Math.floor(performance.now() / 45) % 2 === 0;
            const kOuter = kFlash ? '#FFFFFF' : '#FF1E38';
            const kCore = kFlash ? '#FF1E38' : '#FFFFFF';

            if (h.kind === 'bomb') {
                if (isWarn) {
                    ctx.strokeStyle = th.laser;
                    ctx.globalAlpha = (0.25 + prog * 0.45) * sonarVis;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 6]);
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.fillStyle = th.laser;
                    ctx.globalAlpha = (0.08 + prog * 0.22) * sonarVis;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r * prog, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = isK ? kOuter : th.laser;
                    ctx.globalAlpha = isK ? 0.85 : 0.45;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = isK ? kCore : '#FFFFFF';
                    ctx.globalAlpha = 0.95;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r * 0.65, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (h.kind === 'orb' || h.kind === 'meteor') {
                if (isWarn) {
                    ctx.strokeStyle = th.laser;
                    ctx.globalAlpha = (0.3 + prog * 0.6) * sonarVis;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r + (1 - prog) * 14, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(h.x, h.y);
                    ctx.lineTo(h.x + h.vx * 0.35, h.y + h.vy * 0.35);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    for (let i = 0; i < h.trail.length; i++) {
                        const t = 1 - i / h.trail.length;
                        ctx.fillStyle = isK ? '#FF1E38' : th.laser;
                        ctx.globalAlpha = t * 0.35;
                        ctx.beginPath();
                        ctx.arc(h.trail[i].x, h.trail[i].y, h.r * t * 0.85, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillStyle = isK ? kOuter : th.laser;
                    ctx.globalAlpha = isK ? 0.9 : 0.35;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, isK ? h.r + 9 : h.r + 5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = isK ? kCore : '#FFFFFF';
                    ctx.globalAlpha = 1;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (h.kind === 'vortex') {
                const vProg = isWarn ? prog : 1;
                ctx.save();
                ctx.translate(h.x, h.y);
                ctx.rotate(h.rot);

                ctx.strokeStyle = isK ? kOuter : '#C084FC';
                ctx.globalAlpha = isWarn ? 0.15 * vProg : 0.35;
                ctx.lineWidth = 1.8;
                ctx.setLineDash([8, 10]);
                ctx.beginPath();
                ctx.arc(0, 0, h.pullRadius * vProg, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = isK ? kCore : '#121316';
                ctx.strokeStyle = isK ? kOuter : th.laser;
                ctx.globalAlpha = 0.3 + vProg * 0.7;
                ctx.lineWidth = isK ? 5 : 3;
                ctx.beginPath();
                ctx.arc(0, 0, h.r * vProg, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            } else if (h.kind === 'spinner' || h.kind === 'omega' || h.kind === 'prism') {
                const blades = h.kind === 'prism' ? 3 : (h.kind === 'omega' ? 2 : 1);
                for (let k = 0; k < blades; k++) {
                    const a = h.angle + (h.kind === 'prism' ? (k * Math.PI * 2) / 3 : (k * Math.PI) / 2);
                    const x1 = h.kind === 'prism' ? h.x : h.x - Math.cos(a) * h.len;
                    const y1 = h.kind === 'prism' ? h.y : h.y - Math.sin(a) * h.len;
                    const x2 = h.x + Math.cos(a) * h.len;
                    const y2 = h.y + Math.sin(a) * h.len;
                    this.drawBeam(ctx, x1, y1, x2, y2, isWarn, prog, th.laser, sonarVis, 16, isK);
                }
                ctx.fillStyle = isK ? kOuter : '#FFFFFF';
                ctx.globalAlpha = 0.95;
                ctx.beginPath();
                ctx.arc(h.x, h.y, isK ? 7.5 : 5.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (h.kind === 'nova') {
                const d = g.arena.w * 1.5;
                for (let k = 0; k < 3; k++) {
                    const ang = h.baseAng + (k * Math.PI) / 3;
                    const seg = clipSegment(
                        g.arena,
                        h.x - Math.cos(ang) * d, h.y - Math.sin(ang) * d,
                        h.x + Math.cos(ang) * d, h.y + Math.sin(ang) * d
                    );
                    if (seg) this.drawBeam(ctx, seg.x1, seg.y1, seg.x2, seg.y2, true, prog, th.laser, sonarVis);
                }
                ctx.fillStyle = th.laser;
                ctx.globalAlpha = 0.25 + prog * 0.65;
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.r * prog, 0, Math.PI * 2);
                ctx.fill();
            } else if (h.kind === 'ringwave') {
                if (isWarn) {
                    ctx.strokeStyle = th.laser;
                    ctx.globalAlpha = (0.3 + prog * 0.6) * sonarVis;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, 18 * prog, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = isK ? kOuter : th.laser;
                    ctx.globalAlpha = isK ? 0.85 : 0.35;
                    ctx.lineWidth = isK ? 18 : 14;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.strokeStyle = isK ? kCore : '#FFFFFF';
                    ctx.globalAlpha = 0.95;
                    ctx.lineWidth = isK ? 6 : 4;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else if (h.kind === 'seeker') {
                if (!isWarn) {
                    for (let i = 0; i < h.trail.length; i++) {
                        const t = 1 - i / h.trail.length;
                        ctx.fillStyle = isK ? '#FF1E38' : '#FF5A5F';
                        ctx.globalAlpha = t * 0.4;
                        ctx.beginPath();
                        ctx.arc(h.trail[i].x, h.trail[i].y, h.r * t * 0.75, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.save();
                ctx.translate(h.x, h.y);
                ctx.rotate(h.angle);
                ctx.fillStyle = isK ? kOuter : th.laser;
                ctx.strokeStyle = isK ? kCore : '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.globalAlpha = isWarn ? (0.35 + prog * 0.6) * sonarVis : 1;
                ctx.beginPath();
                ctx.moveTo(h.r * 1.4, 0);
                ctx.lineTo(-h.r, -h.r * 0.85);
                ctx.lineTo(-h.r * 0.5, 0);
                ctx.lineTo(-h.r, h.r * 0.85);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            } else if (h.kind === 'splitter') {
                const pulse = 1 + Math.sin(performance.now() * 0.025) * 0.15;
                ctx.fillStyle = isK ? kOuter : '#FBBF24';
                ctx.strokeStyle = isK ? kCore : th.laser;
                ctx.lineWidth = 3;
                ctx.globalAlpha = isWarn ? (0.35 + prog * 0.6) * sonarVis : 1;
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.r * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.r * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (h.kind === 'pendulum') {
                const curAngle = h.baseAngle + Math.sin((isWarn ? 0 : h.active) * 3.1) * h.swingAmp;
                const x2 = h.x + Math.cos(curAngle) * h.len;
                const y2 = h.y + Math.sin(curAngle) * h.len;
                this.drawBeam(ctx, h.x, h.y, x2, y2, isWarn, prog, th.laser, sonarVis, 16, isK);

                ctx.fillStyle = '#FBBF24';
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (h.kind === 'tesla') {
                if (isWarn) {
                    this.drawBeam(ctx, h.x1, h.y1, h.x2, h.y2, true, prog, '#38BDF8', sonarVis);
                } else {
                    ctx.strokeStyle = isK ? kOuter : '#38BDF8';
                    ctx.globalAlpha = 0.85;
                    ctx.lineWidth = isK ? 6 : 3.5;
                    ctx.beginPath();
                    ctx.moveTo(h.x1, h.y1);
                    const steps = 8;
                    for (let s = 1; s < steps; s++) {
                        const t = s / steps;
                        const jx = (Math.random() - 0.5) * 12;
                        const jy = (Math.random() - 0.5) * 12;
                        ctx.lineTo(h.x1 + (h.x2 - h.x1) * t + jx, h.y1 + (h.y2 - h.y1) * t + jy);
                    }
                    ctx.lineTo(h.x2, h.y2);
                    ctx.stroke();
                }
                [[h.x1, h.y1], [h.x2, h.y2]].forEach(([nx, ny]) => {
                    ctx.fillStyle = '#121316';
                    ctx.strokeStyle = isK ? kOuter : '#38BDF8';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 1;
                    ctx.beginPath();
                    ctx.arc(nx, ny, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                });
            } else if (h.kind === 'helix') {
                const nx = -Math.sin(h.angle) * h.offset;
                const ny = Math.cos(h.angle) * h.offset;
                const dx = Math.cos(h.angle) * h.len;
                const dy = Math.sin(h.angle) * h.len;

                for (const sign of [-1, 1]) {
                    const x1 = h.x + nx * sign - dx, y1 = h.y + ny * sign - dy;
                    const x2 = h.x + nx * sign + dx, y2 = h.y + ny * sign + dy;
                    this.drawBeam(ctx, x1, y1, x2, y2, isWarn, prog, th.laser, sonarVis, 14, isK);
                }
                ctx.fillStyle = '#FBBF24';
                ctx.globalAlpha = 0.95;
                ctx.beginPath();
                ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        });
    }
}

export { ArenaRenderer as GameRenderer };
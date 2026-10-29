import { clipSegment, pointSegDist, rand } from './math.js';
import { SaveStore } from './storage.js';
import { Spawner } from './spawner.js';

export class EntityUpdater {
    static updateAll(g, dt, worldDt, th) {
        const players = g.getActivePlayers();
        const ccLvl = g.save.perks.closecall || 0;

        // ۱. بروزرسانی لیزرها
        for (let i = g.lasers.length - 1; i >= 0; i--) {
            const l = g.lasers[i];
            if (!l) break;

            if (l.state === 'WARN') {
                l.charge += worldDt;
                if (l.sniper && l.charge < l.chargeTime * 0.68) {
                    const targetP = l.targetPlayer || players[0];
                    const ang = Math.atan2(l.y2 - l.y1, l.x2 - l.x1);
                    const d = g.arena.w * 1.5;
                    const seg = clipSegment(
                        g.arena,
                        targetP.x - Math.cos(ang) * d, targetP.y - Math.sin(ang) * d,
                        targetP.x + Math.cos(ang) * d, targetP.y + Math.sin(ang) * d
                    );
                    if (seg) Object.assign(l, seg);
                }
                if (l.charge >= l.chargeTime) {
                    l.state = 'FIRE';
                    g.shake = 5;
                    g.audio.playLaserPulse();

                    players.forEach(p => {
                        const effR = g.getEffectiveRadius(p);
                        const dist = pointSegDist(p.x, p.y, l.x1, l.y1, l.x2, l.y2);
                        if (dist > effR + 5 && dist < effR + 26 + ccLvl * 5) {
                            const bonus = 2 + ccLvl * 2;
                            g.save.stars += bonus;
                            g.save.stats.closeCalls = (g.save.stats.closeCalls || 0) + 1;
                            SaveStore.save(g.save);
                            g.audio.vibrate(14);
                            g.showToast(`CLOSE CALL +${bonus} ★`);
                            g.updateHUD();
                        }
                    });
                }
            } else {
                l.active += worldDt;
                l.x1 += l.vx * worldDt; l.x2 += l.vx * worldDt;
                l.y1 += l.vy * worldDt; l.y2 += l.vy * worldDt;

                for (const p of players) {
                    const effR = g.getEffectiveRadius(p);
                    if (pointSegDist(p.x, p.y, l.x1, l.y1, l.x2, l.y2) < effR + 5) {
                        if (g.handlePlayerHit(th, l, p)) return;
                        if (!g.lasers.length) break;
                    }
                }
                if (!g.lasers.length) break;
                if (l.active >= l.activeTime) g.lasers.splice(i, 1);
            }
        }

        // ۲. بروزرسانی موانع چپترها
        for (let i = g.hazards.length - 1; i >= 0; i--) {
            const h = g.hazards[i];
            if (!h) break;

            if (h.state === 'WARN') {
                h.charge += worldDt;
                if (h.vRot) h.angle += h.vRot * 0.25 * worldDt;
                if (h.charge >= h.chargeTime) {
                    if (h.kind === 'nova') {
                        const d = g.arena.w * 1.5;
                        for (let k = 0; k < 3; k++) {
                            const a = h.baseAng + (k * Math.PI) / 3;
                            const seg = clipSegment(
                                g.arena,
                                h.x - Math.cos(a) * d, h.y - Math.sin(a) * d,
                                h.x + Math.cos(a) * d, h.y + Math.sin(a) * d
                            );
                            if (seg) {
                                g.lasers.push({
                                    ...seg, charge: 1, chargeTime: 1,
                                    active: 0, activeTime: 0.32, state: 'FIRE', vx: 0, vy: 0
                                });
                            }
                        }
                        g.shake = 7;
                        g.audio.playLaserPulse();
                        g.rings.push({ x: h.x, y: h.y, r: 10, maxR: 110, alpha: 0.65, color: th.laser });
                        g.hazards.splice(i, 1);
                        continue;
                    }
                    h.state = 'FIRE';
                    if (h.kind === 'bomb') {
                        g.shake = 6;
                        g.rings.push({ x: h.x, y: h.y, r: 12, maxR: h.r * 1.35, alpha: 0.6, color: th.laser });
                    }
                    h.kind === 'vortex' ? g.audio.playSlowMo() : g.audio.playLaserPulse();
                }
                continue;
            }

            if (h.kind === 'bomb') {
                h.active += worldDt;
                for (const p of players) {
                    if (Math.hypot(p.x - h.x, p.y - h.y) < h.r + g.getEffectiveRadius(p) - 4) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
                if (!g.hazards.length) break;
                if (h.active >= h.activeTime) g.hazards.splice(i, 1);
            } else if (h.kind === 'orb' || h.kind === 'meteor') {
                h.x += h.vx * worldDt;
                h.y += h.vy * worldDt;
                h.trail.unshift({ x: h.x, y: h.y });
                if (h.trail.length > 10) h.trail.pop();

                if (h.kind === 'orb') {
                    const minX = g.arena.x + h.r + 4, maxX = g.arena.x + g.arena.w - h.r - 4;
                    const minY = g.arena.y + h.r + 4, maxY = g.arena.y + g.arena.h - h.r - 4;
                    let bounced = false;
                    if (h.x <= minX) { h.x = minX; h.vx = Math.abs(h.vx); bounced = true; }
                    else if (h.x >= maxX) { h.x = maxX; h.vx = -Math.abs(h.vx); bounced = true; }
                    if (h.y <= minY) { h.y = minY; h.vy = Math.abs(h.vy); bounced = true; }
                    else if (h.y >= maxY) { h.y = maxY; h.vy = -Math.abs(h.vy); bounced = true; }
                    if (bounced) {
                        h.bouncesLeft--;
                        g.emitParticles(h.x, h.y, th.laser, 6);
                    }
                    if (h.bouncesLeft < 0) {
                        g.emitParticles(h.x, h.y, th.laser, 10);
                        g.hazards.splice(i, 1);
                        continue;
                    }
                } else if (
                    h.x < g.arena.x - 20 || h.x > g.arena.x + g.arena.w + 20 ||
                    h.y < g.arena.y - 20 || h.y > g.arena.y + g.arena.h + 20
                ) {
                    g.hazards.splice(i, 1);
                    continue;
                }
                for (const p of players) {
                    if (Math.hypot(p.x - h.x, p.y - h.y) < g.getEffectiveRadius(p) + h.r) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
            } else if (h.kind === 'vortex') {
                h.rot += worldDt * 3.5;
                h.active += worldDt;
                for (const p of players) {
                    const dx = h.x - p.x, dy = h.y - p.y, dist = Math.hypot(dx, dy);
                    if (dist < h.pullRadius && dist > 4) {
                        const pull = (1 - dist / h.pullRadius) * 155;
                        p.x += (dx / dist) * pull * worldDt;
                        p.y += (dy / dist) * pull * worldDt;
                    }
                    if (dist < h.r + g.getEffectiveRadius(p) - 3) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
                if (!g.hazards.length) break;
                if (h.active >= h.activeTime) {
                    g.rings.push({ x: h.x, y: h.y, r: h.r, maxR: 80, alpha: 0.4, color: '#C084FC' });
                    g.hazards.splice(i, 1);
                }
            } else if (h.kind === 'spinner' || h.kind === 'omega' || h.kind === 'prism') {
                h.active += worldDt;
                h.angle += h.vRot * worldDt;
                const blades = h.kind === 'prism' ? 3 : (h.kind === 'omega' ? 2 : 1);
                for (let k = 0; k < blades; k++) {
                    const a = h.angle + (h.kind === 'prism' ? (k * Math.PI * 2) / 3 : (k * Math.PI) / 2);
                    const x1 = h.kind === 'prism' ? h.x : h.x - Math.cos(a) * h.len;
                    const y1 = h.kind === 'prism' ? h.y : h.y - Math.sin(a) * h.len;
                    const x2 = h.x + Math.cos(a) * h.len;
                    const y2 = h.y + Math.sin(a) * h.len;
                    for (const p of players) {
                        if (pointSegDist(p.x, p.y, x1, y1, x2, y2) < g.getEffectiveRadius(p) + 5) {
                            if (g.handlePlayerHit(th, h, p)) return;
                            if (!g.hazards.length) break;
                        }
                    }
                }
                if (!g.hazards.length) break;
                if (h.active >= h.activeTime) g.hazards.splice(i, 1);
            } else if (h.kind === 'ringwave') {
                h.r += 110 * worldDt;
                for (const p of players) {
                    if (Math.abs(Math.hypot(p.x - h.x, p.y - h.y) - h.r) < g.getEffectiveRadius(p) + 5) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
                if (!g.hazards.length) break;
                if (h.r >= h.maxR) g.hazards.splice(i, 1);
            } else if (h.kind === 'seeker') {
                h.active += worldDt;
                const targetP = h.targetPlayer || players[0];
                const desired = Math.atan2(targetP.y - h.y, targetP.x - h.x);
                let diff = desired - h.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                h.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2.7 * worldDt);

                h.x += Math.cos(h.angle) * h.speed * worldDt;
                h.y += Math.sin(h.angle) * h.speed * worldDt;
                h.trail.unshift({ x: h.x, y: h.y });
                if (h.trail.length > 9) h.trail.pop();

                for (const p of players) {
                    // اگر موشک توسط یکی از بازیکنان شلیک شده، در ۰.۴ ثانیه اول به خود شلیک‌کننده برخورد نکند
                    if (h.ownerId === p.id && h.active < 0.4) continue;
                    if (Math.hypot(p.x - h.x, p.y - h.y) < g.getEffectiveRadius(p) + h.r) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
                if (!g.hazards.length) break;
                if (h.active >= h.activeTime) {
                    g.emitParticles(h.x, h.y, th.laser, 10);
                    g.hazards.splice(i, 1);
                }
            } else if (h.kind === 'splitter') {
                h.x += h.vx * worldDt;
                h.y += h.vy * worldDt;
                h.splitTimer -= worldDt;

                for (const p of players) {
                    if (Math.hypot(p.x - h.x, p.y - h.y) < g.getEffectiveRadius(p) + h.r) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
                if (!g.hazards.length) break;

                if (h.splitTimer <= 0) {
                    g.audio.playLaserPulse();
                    g.shake = 6;
                    g.rings.push({ x: h.x, y: h.y, r: 8, maxR: 85, alpha: 0.7, color: '#FBBF24' });
                    for (let k = 0; k < 6; k++) {
                        const a = (k * Math.PI) / 3;
                        g.hazards.push({
                            kind: 'meteor', x: h.x, y: h.y,
                            vx: Math.cos(a) * 235, vy: Math.sin(a) * 235,
                            r: 7.5, charge: 1, chargeTime: 1, state: 'FIRE', trail: []
                        });
                    }
                    g.hazards.splice(i, 1);
                }
            } else if (h.kind === 'pendulum') {
                h.active += worldDt;
                const curAngle = h.baseAngle + Math.sin(h.active * 3.1) * h.swingAmp;
                const x2 = h.x + Math.cos(curAngle) * h.len;
                const y2 = h.y + Math.sin(curAngle) * h.len;
                for (const p of players) {
                    if (pointSegDist(p.x, p.y, h.x, h.y, x2, y2) < g.getEffectiveRadius(p) + 5) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
                if (!g.hazards.length) break;
                if (h.active >= h.activeTime) g.hazards.splice(i, 1);
            } else if (h.kind === 'tesla') {
                h.active += worldDt;
                h.x1 += h.vx * worldDt; h.x2 += h.vx * worldDt;
                h.y1 += h.vy * worldDt; h.y2 += h.vy * worldDt;

                const pad = 24;
                if (h.x1 < g.arena.x + pad || h.x2 > g.arena.x + g.arena.w - pad) h.vx = -h.vx;
                if (h.y1 < g.arena.y + pad || h.y2 > g.arena.y + g.arena.h - pad) h.vy = -h.vy;

                for (const p of players) {
                    if (pointSegDist(p.x, p.y, h.x1, h.y1, h.x2, h.y2) < g.getEffectiveRadius(p) + 6) {
                        if (g.handlePlayerHit(th, h, p)) return;
                        if (!g.hazards.length) break;
                    }
                }
                if (!g.hazards.length) break;
                if (h.active >= h.activeTime) g.hazards.splice(i, 1);
            } else if (h.kind === 'helix') {
                h.active += worldDt;
                h.angle += h.vRot * worldDt;
                const nx = -Math.sin(h.angle) * h.offset;
                const ny = Math.cos(h.angle) * h.offset;
                const dx = Math.cos(h.angle) * h.len;
                const dy = Math.sin(h.angle) * h.len;

                for (const sign of [-1, 1]) {
                    const x1 = h.x + nx * sign - dx, y1 = h.y + ny * sign - dy;
                    const x2 = h.x + nx * sign + dx, y2 = h.y + ny * sign + dy;
                    for (const p of players) {
                        if (pointSegDist(p.x, p.y, x1, y1, x2, y2) < g.getEffectiveRadius(p) + 5) {
                            if (g.handlePlayerHit(th, h, p)) return;
                            if (!g.hazards.length) break;
                        }
                    }
                }
                if (!g.hazards.length) break;
                if (h.active >= h.activeTime) g.hazards.splice(i, 1);
            }
        }

        // ۳. بروزرسانی ستاره‌ها و پاورآپ‌ها
        const magnetRange = 28 + (g.save.perks.magnet || 0) * 26;
        for (let i = g.pickups.length - 1; i >= 0; i--) {
            const pItem = g.pickups[i];
            if (!pItem) break;
            pItem.phase += dt * 4;
            if (pItem.isSpecial && (pItem.life -= dt) <= 0) {
                g.pickups.splice(i, 1);
                continue;
            }

            for (const collector of players) {
                const effR = g.getEffectiveRadius(collector);
                const dist = Math.hypot(collector.x - pItem.x, collector.y - pItem.y);
                if (!pItem.isSpecial && dist < magnetRange) {
                    pItem.x += (collector.x - pItem.x) * 7 * dt;
                    pItem.y += (collector.y - pItem.y) * 7 * dt;
                }
                if (dist < effR + pItem.r + 5) {
                    this.collectPickup(g, pItem, collector);
                    g.pickups.splice(i, 1);
                    if (!pItem.isSpecial && g.state === 'PLAYING') Spawner.spawnPickup(g);
                    break;
                }
            }
        }
    }

    static collectPickup(g, p, collector = g.player) {
        g.audio.vibrate(12);
        const rival = collector.id === 1 ? g.player2 : g.player;

        const actions = {
            shield: () => {
                collector.shield = true;
                g.emitParticles(p.x, p.y, '#34D399', 16);
                g.rings.push({ x: p.x, y: p.y, r: 8, maxR: 110, alpha: 0.55, color: '#34D399' });
                g.audio.playPickup(4);
                g.showToast(g.mode === 'VERSUS' ? `P${collector.id} SHIELD ACTIVE` : 'SHIELD ACTIVE');
            },
            slow: () => {
                g.slowTimer = 3.0 + (g.save.perks.slow || 0) * 0.6;
                g.emitParticles(p.x, p.y, '#60A5FA', 16);
                g.rings.push({ x: collector.x, y: collector.y, r: 10, maxR: 210, alpha: 0.55, color: '#60A5FA' });
                g.audio.playSlowMo();
                g.showToast('SLOW MOTION ACTIVE');
            },
            emp: () => {
                g.lasers.forEach(l => g.emitParticles((l.x1 + l.x2) * 0.5, (l.y1 + l.y2) * 0.5, '#38BDF8', 8));
                g.hazards.forEach(h => g.emitParticles(h.x, h.y, '#38BDF8', 10));
                g.lasers = [];
                g.hazards = [];
                g.save.stars += 2;
                SaveStore.save(g.save);
                g.triggerImpactFX(collector.x, collector.y, '#38BDF8');
                g.audio.playUpgrade();
                g.showToast('EMP BLAST! ARENA CLEARED +2 ★');
                g.updateHUD();
            },
            phase: () => {
                collector.phaseTimer = 4.2;
                if (collector === g.player) g.phaseTimer = 4.2;
                g.emitParticles(p.x, p.y, '#C084FC', 18);
                g.rings.push({ x: collector.x, y: collector.y, r: 10, maxR: 190, alpha: 0.65, color: '#C084FC' });
                g.audio.playUpgrade();
                g.showToast(g.mode === 'VERSUS' ? `P${collector.id} PHASE GHOST` : 'PHASE GHOST • 4.2s INVULNERABLE');
            },
            mini: () => {
                collector.miniTimer = 5.0;
                if (collector === g.player) g.miniTimer = 5.0;
                g.emitParticles(p.x, p.y, '#A3E635', 16);
                g.rings.push({ x: collector.x, y: collector.y, r: 8, maxR: 150, alpha: 0.6, color: '#A3E635' });
                g.audio.playUpgrade();
                g.showToast(g.mode === 'VERSUS' ? `P${collector.id} MINI CORE` : 'MINI CORE • 5s SHRINK & SPEED');
            },

            // آیتم‌های تهاجمی و خرابکاری مخصوص مود ۲ نفره
            atk_seeker: () => {
                for (let k = -1; k <= 1; k += 2) {
                    const baseAim = Math.atan2(rival.y - collector.y, rival.x - collector.x) + k * 0.38;
                    g.hazards.push({
                        kind: 'seeker',
                        x: collector.x,
                        y: collector.y,
                        angle: baseAim,
                        speed: 215,
                        r: 9,
                        charge: 0,
                        chargeTime: 0.45,
                        active: 0,
                        activeTime: 3.3,
                        state: 'WARN',
                        trail: [],
                        targetPlayer: rival,
                        ownerId: collector.id
                    });
                }
                g.emitParticles(p.x, p.y, '#FF5A5F', 18);
                g.rings.push({ x: rival.x, y: rival.y, r: 36, maxR: 8, alpha: 0.85, color: '#FF5A5F' });
                g.audio.playLaserPulse();
                g.showToast(`P${collector.id} FIRED SEEKERS AT P${rival.id}!`);
            },

            atk_sniper: () => {
                const ang = rand(0, Math.PI), d = g.arena.w * 1.5;
                const seg = clipSegment(
                    g.arena,
                    rival.x - Math.cos(ang) * d, rival.y - Math.sin(ang) * d,
                    rival.x + Math.cos(ang) * d, rival.y + Math.sin(ang) * d
                );
                if (seg) {
                    g.lasers.push({
                        ...seg,
                        charge: 0,
                        chargeTime: 0.62,
                        active: 0,
                        activeTime: 0.34,
                        state: 'WARN',
                        vx: 0, vy: 0,
                        sniper: true,
                        targetPlayer: rival
                    });
                }
                g.emitParticles(p.x, p.y, '#F97316', 18);
                g.rings.push({ x: rival.x, y: rival.y, r: 42, maxR: 6, alpha: 0.85, color: '#F97316' });
                g.audio.playUpgrade();
                g.showToast(`P${collector.id} LOCKED SNIPER ON P${rival.id}!`);
            },

            atk_giant: () => {
                rival.giantTimer = 4.2;
                rival.miniTimer = 0;
                g.emitParticles(rival.x, rival.y, '#F43F5E', 22);
                g.rings.push({ x: rival.x, y: rival.y, r: 8, maxR: 95, alpha: 0.85, color: '#F43F5E' });
                g.audio.playSlowMo();
                g.audio.vibrate([25, 30, 25]);
                g.showToast(`P${rival.id} HEXED: 2X GIANT SIZE (4s)!`);
            }
        };

        if (actions[p.type]) {
            g.save.stats.powerupsPicked = (g.save.stats.powerupsPicked || 0) + 1;
            SaveStore.save(g.save);
            return actions[p.type]();
        }

        g.score++;
        g.save.stats.totalPickups = (g.save.stats.totalPickups || 0) + 1;

        if (g.mode === 'OVERDRIVE') {
            g.overdriveTimer = Math.min(g.overdriveMaxTime, g.overdriveTimer + 2.4);
            if (++g.empCharge >= 3) {
                g.empCharge = 0;
                g.lasers = [];
                g.hazards = [];
                g.triggerImpactFX(collector.x, collector.y, '#60A5FA');
                g.audio.playUpgrade();
                g.showToast('OVERDRIVE EMP BLAST!');
            }
        }

        const jackpot = (g.mode === 'CHAOS' && g.activeChaosRule.id === 'JACKPOT') ? 2 : 1;
        let gained = 1 * jackpot + ((g.save.perks.greed && g.score % 5 === 0) ? g.save.perks.greed : 0);
        g.save.stars += gained;
        SaveStore.save(g.save);
        g.emitParticles(p.x, p.y, p.type === 'overdrive_node' ? '#60A5FA' : '#FBBF24', 12);
        g.audio.playPickup(g.score);
        g.updateHUD();

        if (g.mode === 'LEVEL' && g.score >= g.targetScore) {
            g.finishGame('WIN');
        }
    }
}
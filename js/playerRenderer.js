export class PlayerRenderer {
    static drawPoly(ctx, points, rOuter, rInner = null, rotSpeed = 0.0015) {
        ctx.rotate(performance.now() * rotSpeed);
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
            const rad = rInner && i % 2 !== 0 ? rInner : rOuter;
            const a = (i * Math.PI * 2) / points;
            const x = Math.cos(a) * rad;
            const y = Math.sin(a) * rad;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    static drawTrail(ctx, g, th, entity = g.player) {
        const pts = entity.trail;
        const r = g.getEffectiveRadius(entity);
        const trailType = g.save.trail;
        const baseColor = g.mode === 'VERSUS' ? entity.customColor : th.player;

        if (pts.length < 2) return;

        if (entity.dashTimer > 0) {
            for (let i = 1; i < Math.min(pts.length, 8); i += 2) {
                ctx.fillStyle = entity.id === 2 ? '#FBBF24' : '#38BDF8';
                ctx.globalAlpha = (1 - i / 8) * 0.55;
                ctx.beginPath();
                ctx.arc(pts[i].x, pts[i].y, r * 1.05, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        if (trailType === 'bolt') {
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                const jx = i === 0 ? 0 : (Math.random() - 0.5) * 7;
                const jy = i === 0 ? 0 : (Math.random() - 0.5) * 7;
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x + jx, p.y + jy);
            }
            ctx.globalAlpha = 0.65;
            ctx.stroke();
            ctx.globalAlpha = 1;
            return;
        }

        for (let i = 1; i < pts.length; i++) {
            const t = 1 - i / pts.length;
            const p = pts[i];

            if (trailType === 'fade' || g.mode === 'VERSUS') {
                ctx.fillStyle = baseColor;
                ctx.globalAlpha = t * 0.28;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * t * 0.85, 0, Math.PI * 2);
                ctx.fill();
            } else if (trailType === 'dots' && i % 2 === 0) {
                ctx.fillStyle = th.laser;
                ctx.globalAlpha = t * 0.55;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.5 * t, 0, Math.PI * 2);
                ctx.fill();
            } else if (trailType === 'dual') {
                const perpX = -Math.sin(entity.angle) * 6;
                const perpY = Math.cos(entity.angle) * 6;
                ctx.fillStyle = baseColor;
                ctx.globalAlpha = t * 0.35;
                ctx.beginPath();
                ctx.arc(p.x + perpX, p.y + perpY, 2.5 * t, 0, Math.PI * 2);
                ctx.arc(p.x - perpX, p.y - perpY, 2.5 * t, 0, Math.PI * 2);
                ctx.fill();
            } else if (trailType === 'chroma') {
                ctx.fillStyle = `hsl(${p.hue}, 85%, 65%)`;
                ctx.globalAlpha = t * 0.45;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * t * 0.8, 0, Math.PI * 2);
                ctx.fill();
            } else if (trailType === 'squares' && i % 2 === 0) {
                const sz = r * t * 1.1;
                ctx.fillStyle = '#60A5FA';
                ctx.globalAlpha = t * 0.45;
                ctx.fillRect(p.x - sz * 0.5, p.y - sz * 0.5, sz, sz);
            } else if (trailType === 'wave') {
                const waveOffset = Math.sin(i * 0.65 + performance.now() * 0.01) * 7;
                const perpX = -Math.sin(entity.angle) * waveOffset;
                const perpY = Math.cos(entity.angle) * waveOffset;
                ctx.fillStyle = '#34D399';
                ctx.globalAlpha = t * 0.5;
                ctx.beginPath();
                ctx.arc(p.x + perpX, p.y + perpY, 3.2 * t, 0, Math.PI * 2);
                ctx.fill();
            } else if (trailType === 'rings' && i % 3 === 0) {
                ctx.strokeStyle = th.laser;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = t * 0.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, (1 - t) * 14 + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }

    static drawPlayer(ctx, g, th, entity = g.player) {
        const r = g.getEffectiveRadius(entity);

        ctx.save();
        ctx.translate(entity.x, entity.y);

        const drawRing = (rad, ratio, color, lineWidth = 2) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.arc(0, 0, rad, -Math.PI / 2, -Math.PI / 2 + Math.max(0, Math.min(1, ratio)) * Math.PI * 2);
            ctx.stroke();
        };

        if (entity.dashCooldown > 0) {
            drawRing(r + 4, 1 - (entity.dashCooldown / g.dashMaxCooldown), 'rgba(56, 189, 248, 0.45)', 1.8);
        }

        if (entity.phaseTimer > 0) {
            drawRing(r + 9, entity.phaseTimer / 4.2, '#C084FC', 2.5);
            ctx.fillStyle = 'rgba(192, 132, 252, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.58 + Math.sin(performance.now() * 0.02) * 0.18;
        }

        if (entity.miniTimer > 0) {
            drawRing(r + 7, entity.miniTimer / 5.0, '#A3E635', 2.0);
        }

        // نمایش هاله نفرین ۲ برابر شدن سایز (Giant Hex)
        if (entity.giantTimer > 0) {
            drawRing(r + 7, entity.giantTimer / 4.2, '#F43F5E', 2.8);
            ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
            ctx.fill();
        }

        if (entity.shield) {
            drawRing(r + 6, 1, '#34D399', 2.2);
        }

        const baseColor = g.mode === 'VERSUS' ? entity.customColor : th.player;
        const coreColor = entity.dashTimer > 0 ? '#FFFFFF' : (entity.phaseTimer > 0 ? '#E9D5FF' : baseColor);
        ctx.fillStyle = coreColor;
        ctx.strokeStyle = coreColor;

        const shape = g.save.shape;

        if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'square') {
            ctx.beginPath();
            ctx.roundRect(-r, -r, r * 2, r * 2, 4);
            ctx.fill();
        } else if (shape === 'diamond') {
            this.drawPoly(ctx, 4, r * 1.2, null, 0.002);
        } else if (shape === 'triangle') {
            ctx.rotate(entity.angle);
            ctx.beginPath();
            ctx.moveTo(r * 1.25, 0);
            ctx.lineTo(-r * 0.9, -r * 0.95);
            ctx.lineTo(-r * 0.9, r * 0.95);
            ctx.closePath();
            ctx.fill();
        } else if (shape === 'hex') {
            this.drawPoly(ctx, 6, r * 1.1, null, 0.0015);
        } else if (shape === 'ring') {
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (shape === 'star') {
            this.drawPoly(ctx, 10, r * 1.25, r * 0.55, 0.002);
        } else if (shape === 'plus') {
            ctx.rotate(performance.now() * 0.0015);
            const w = r * 0.48, l = r * 1.15;
            ctx.beginPath();
            ctx.rect(-w, -l, w * 2, l * 2);
            ctx.rect(-l, -w, l * 2, w * 2);
            ctx.fill();
        } else if (shape === 'shuriken') {
            this.drawPoly(ctx, 8, r * 1.3, r * 0.42, 0.004);
        } else if (shape === 'octagon') {
            this.drawPoly(ctx, 8, r * 1.12, null, 0.001);
        }

        if (g.mode === 'VERSUS') {
            ctx.fillStyle = entity.giantTimer > 0 ? '#F43F5E' : entity.customColor;
            ctx.font = '800 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(entity.giantTimer > 0 ? `P${entity.id} (2X!)` : `P${entity.id}`, 0, -r - 9);
        }

        ctx.restore();
    }

    static drawPickup(ctx, p, g) {
        const pulse = Math.sin(p.phase) * 2;
        const isJackpot = g.mode === 'CHAOS' && g.activeChaosRule.id === 'JACKPOT';

        if (!p.isSpecial) {
            const drawR = isJackpot ? p.r * 1.35 : p.r;
            ctx.fillStyle = p.type === 'overdrive_node' ? '#38BDF8' : '#FBBF24';
            ctx.globalAlpha = 0.22;
            ctx.beginPath();
            ctx.arc(p.x, p.y, drawR + 5 + pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
            ctx.fill();

            if (p.type === 'overdrive_node') {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, drawR + 3 - pulse * 0.5, 0, Math.PI * 2);
                ctx.stroke();
            }
            return;
        }

        const colors = {
            shield: '#34D399', slow: '#60A5FA', emp: '#38BDF8', phase: '#C084FC', mini: '#A3E635',
            atk_seeker: '#FF5A5F', atk_sniper: '#F97316', atk_giant: '#F43F5E'
        };
        const col = colors[p.type] || '#34D399';
        const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
        const blink = (p.life < 2.2 && Math.floor(p.life * 7) % 2 === 0) ? 0.45 : 1;

        ctx.save();
        ctx.translate(p.x, p.y);

        ctx.fillStyle = col;
        ctx.globalAlpha = 0.22 * blink;
        ctx.beginPath();
        ctx.arc(0, 0, p.r + 6 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.94 * blink;
        ctx.fillStyle = '#121316';
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = col;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, -Math.PI / 2, -Math.PI / 2 + lifeRatio * Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = blink;
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (p.type === 'shield') {
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, -6.5);
            ctx.lineTo(5.8, -4.2);
            ctx.lineTo(5.8, 0.8);
            ctx.quadraticCurveTo(5.8, 5.2, 0, 7.2);
            ctx.quadraticCurveTo(-5.8, 5.2, -5.8, 0.8);
            ctx.lineTo(-5.8, -4.2);
            ctx.closePath();
            ctx.stroke();
        } else if (p.type === 'slow') {
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 1, 5.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(0, 1);
            ctx.lineTo(0, -2.2);
            ctx.moveTo(0, 1);
            ctx.lineTo(2.5, 2.4);
            ctx.stroke();
        } else if (p.type === 'emp') {
            ctx.beginPath();
            ctx.moveTo(1.2, -6.8);
            ctx.lineTo(-4.5, 0.6);
            ctx.lineTo(-0.4, 0.6);
            ctx.lineTo(-1.4, 6.8);
            ctx.lineTo(4.5, -0.8);
            ctx.lineTo(0.4, -0.8);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'phase') {
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(0, -6.5);
            ctx.lineTo(6.5, 0);
            ctx.lineTo(0, 6.5);
            ctx.lineTo(-6.5, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'mini') {
            ctx.lineWidth = 1.7;
            ctx.strokeRect(-4.5, -4.5, 9, 9);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'atk_seeker') {
            // آیکون موشک تهاجمی
            ctx.beginPath();
            ctx.moveTo(6.5, -4.5);
            ctx.lineTo(-5.5, -1.5);
            ctx.lineTo(-2.5, 1.5);
            ctx.lineTo(-5.5, 5.5);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'atk_sniper') {
            // آیکون نشانه‌گیر اسنایپر
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
            ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
            ctx.moveTo(0, -8); ctx.lineTo(0, 8);
            ctx.stroke();
        } else if (p.type === 'atk_giant') {
            // آیکون ۲ برابر کردن سایز رقیب (2X)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('2X', 0, 3.2);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

export { PlayerRenderer as ShapeDrawer };
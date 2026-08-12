// 캔버스 visual 파티클 시스템

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.rings = [];
        this.beams = [];
    }

    addExplosion(x, y, color = '#ff7f50', count = 16, maxRadius = 4) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 120;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                radius: 1.5 + Math.random() * maxRadius,
                alpha: 1,
                decay: 1.5 + Math.random() * 2.0
            });
        }
    }

    addShockwaveRing(x, y, maxRadius = 60, color = 'rgba(0, 210, 255, 0.8)') {
        this.rings.push({
            x, y,
            radius: 5,
            maxRadius,
            color,
            alpha: 1,
            speed: 180
        });
    }

    addBeam(x1, y1, x2, y2, color = '#00ffaa', width = 6) {
        this.beams.push({
            x1, y1, x2, y2,
            color,
            width,
            alpha: 1,
            decay: 4.0
        });
    }

    addFloatingText(x, y, text, color = '#ffffff', fontSize = 12) {
        this.floatingTexts.push({
            x, y,
            text,
            color,
            fontSize,
            alpha: 1,
            vy: -25,
            decay: 1.2
        });
    }

    update(dt) {
        // Update Normal Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= p.decay * dt;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update Shockwave Rings
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const r = this.rings[i];
            r.radius += r.speed * dt;
            r.alpha = 1 - (r.radius / r.maxRadius);
            if (r.radius >= r.maxRadius || r.alpha <= 0) {
                this.rings.splice(i, 1);
            }
        }

        // Update Laser Beams
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const b = this.beams[i];
            b.alpha -= b.decay * dt;
            if (b.alpha <= 0) {
                this.beams.splice(i, 1);
            }
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.alpha -= ft.decay * dt;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();

        // Render Laser Beams
        for (const b of this.beams) {
            ctx.globalAlpha = Math.max(0, b.alpha);
            ctx.strokeStyle = b.color;
            ctx.lineWidth = b.width;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(b.x1, b.y1);
            ctx.lineTo(b.x2, b.y2);
            ctx.stroke();
        }

        // Render Shockwave Rings
        for (const r of this.rings) {
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Render Particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render Floating Texts
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = `bold ${ft.fontSize}px Orbitron, sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }

        ctx.restore();
    }
}

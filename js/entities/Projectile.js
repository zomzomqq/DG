// 투사체 (Projectile) 클래스
import { SynergySystem } from '../engine/SynergySystem.js';
import { statusSystem } from '../engine/StatusEffectSystem.js';
import { drawGlowOrb, polygonPath } from '../engine/CanvasArt.js';

export class Projectile {
    constructor(params) {
        this.x = params.x;
        this.y = params.y;
        this.target = params.target;
        this.targetPos = params.targetPos || (params.target ? { x: params.target.x, y: params.target.y } : { x: params.x, y: params.y });
        this.damage = params.damage;
        this.speed = params.speed || 500;
        this.type = params.type || 'bullet'; // bullet, cannon, cluster, railgun, base_laser
        this.color = params.color || '#ffffff';
        this.splashRadius = params.splashRadius || 0;
        this.clusterCount = params.clusterCount || 0;
        this.towerRef = params.towerRef || null;

        this.active = true;
        this.radius = params.type === 'cannon' ? 5 : 3;

        if (this.type === 'railgun') {
            this.isBeam = true;
            this.targetAngle = Math.atan2(this.targetPos.y - this.y, this.targetPos.x - this.x);
        }
    }

    update(dt, enemyList, projectileList, particleSystem, soundManager) {
        if (!this.active) return;

        if (this.type === 'railgun') {
            const endX = this.x + Math.cos(this.targetAngle) * 600;
            const endY = this.y + Math.sin(this.targetAngle) * 600;

            particleSystem.addBeam(this.x, this.y, endX, endY, '#00ffaa', 5);

            for (const enemy of enemyList) {
                if (enemy.active && enemy.hp > 0) {
                    const distToLine = this.distToSegment({ x: enemy.x, y: enemy.y }, { x: this.x, y: this.y }, { x: endX, y: endY });
                    if (distToLine <= enemy.size + 10) {
                        enemy.takeDamage(this.damage, 'railgun');
                        particleSystem.addExplosion(enemy.x, enemy.y, '#00ffaa', 4, 2);
                    }
                }
            }
            this.active = false;
            return;
        }

        if (this.target && this.target.active && this.target.hp > 0) {
            this.targetPos = { x: this.target.x, y: this.target.y };
        }

        const dx = this.targetPos.x - this.x;
        const dy = this.targetPos.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= this.speed * dt + 5) {
            this.hitTarget(enemyList, projectileList, particleSystem, soundManager);
            this.active = false;
        } else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    hitTarget(enemyList, projectileList, particleSystem, soundManager) {
        if (this.type === 'bullet' || this.type === 'base_laser') {
            if (this.target && this.target.active && this.target.hp > 0) {
                let dmg = this.damage;
                if (statusSystem.hasEffect(this.target, 'Shattered')) {
                    dmg *= 1.5;
                }

                this.target.takeDamage(dmg, this.type);
                particleSystem.addExplosion(this.x, this.y, this.color, 5, 2);

                if (this.towerRef && this.towerRef.type === 'gatling') {
                    SynergySystem.onGatlingHit(this.target, this.towerRef, particleSystem);
                }
            }
        } else if (this.type === 'cannon' || this.type === 'cluster') {
            soundManager.playExplosion();

            const { finalDamage, finalSplash } = SynergySystem.processCannonHit(
                this.target, this.damage, this.splashRadius, enemyList, particleSystem
            );

            particleSystem.addExplosion(this.x, this.y, '#ff7f50', 20, 5);
            particleSystem.addShockwaveRing(this.x, this.y, finalSplash, 'rgba(255, 127, 80, 0.7)');

            for (const enemy of enemyList) {
                if (enemy.active && enemy.hp > 0) {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist <= finalSplash) {
                        const falloff = 1 - (dist / finalSplash) * 0.4;
                        enemy.takeDamage(finalDamage * falloff, 'cannon');
                    }
                }
            }

            if (this.clusterCount > 0 && projectileList) {
                for (let i = 0; i < this.clusterCount; i++) {
                    const angle = (Math.PI * 2 / this.clusterCount) * i + Math.random() * 0.5;
                    const subTarget = {
                        x: this.x + Math.cos(angle) * 45,
                        y: this.y + Math.sin(angle) * 45
                    };
                    projectileList.push(new Projectile({
                        x: this.x,
                        y: this.y,
                        targetPos: subTarget,
                        damage: this.damage * 0.4,
                        speed: 300,
                        type: 'cluster',
                        splashRadius: 30,
                        color: '#ffd166'
                    }));
                }
            }
        }
    }

    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    render(ctx) {
        if (!this.active || this.isBeam) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        const angle = Math.atan2(this.targetPos.y - this.y, this.targetPos.x - this.x);
        ctx.rotate(angle);

        ctx.globalCompositeOperation = 'lighter';
        const trail = ctx.createLinearGradient(-18, 0, 4, 0);
        trail.addColorStop(0, 'rgba(0, 0, 0, 0)');
        trail.addColorStop(1, this.color);
        ctx.fillStyle = trail;

        if (this.type === 'cannon' || this.type === 'cluster') {
            ctx.beginPath();
            ctx.moveTo(-16, 0);
            ctx.lineTo(-4, -3);
            ctx.lineTo(3, -3);
            ctx.lineTo(6, 0);
            ctx.lineTo(3, 3);
            ctx.lineTo(-4, 3);
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            polygonPath(ctx, 2, 0, this.radius + 1, 6, 0, 0.85);
            ctx.fillStyle = '#20272a';
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            drawGlowOrb(ctx, 3, 0, 2, this.color);
        } else {
            ctx.beginPath();
            ctx.moveTo(-15, -1.5);
            ctx.lineTo(3, -1.5);
            ctx.lineTo(6, 0);
            ctx.lineTo(3, 1.5);
            ctx.lineTo(-15, 1.5);
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            drawGlowOrb(ctx, 4, 0, this.radius * 0.7, this.color);
        }
        ctx.restore();
    }
}

// 지켜야 하는 메인 타워 (Main Base) 클래스
import { CONFIG } from '../config.js';
import { Projectile } from './Projectile.js';
import { drawBolts, drawGlowOrb, drawSegmentedRing, polygonPath } from '../engine/CanvasArt.js';

export class BaseTower {
    constructor(col, row, cellSize) {
        this.col = col;
        this.row = row;
        this.cellSize = cellSize;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;

        this.maxHp = CONFIG.BASE_TOWER.MAX_HP;
        this.hp = this.maxHp;

        this.range = CONFIG.BASE_TOWER.RANGE;
        this.damage = CONFIG.BASE_TOWER.DAMAGE;
        this.attackSpeed = CONFIG.BASE_TOWER.ATTACK_SPEED;
        this.cooldownTimer = 0;

        // Orbital Strike Skill
        this.orbitalCooldown = 0; // 남은 쿨타임 (초)
        this.orbitalMaxCooldown = CONFIG.BASE_TOWER.ORBITAL_STRIKE_COOLDOWN;

        this.target = null;
        this.animTimer = 0;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }

    useOrbitalStrike(targetPos, enemyList, particleSystem, soundManager) {
        if (this.orbitalCooldown > 0) return false;

        this.orbitalCooldown = this.orbitalMaxCooldown;
        soundManager.playOrbitalStrike();

        particleSystem.addShockwaveRing(
            targetPos.x, targetPos.y,
            CONFIG.BASE_TOWER.ORBITAL_STRIKE_RADIUS,
            'rgba(255, 71, 87, 0.9)'
        );

        setTimeout(() => {
            particleSystem.addExplosion(
                targetPos.x, targetPos.y,
                '#ff4757', 35, 8
            );

            // 범위 내 피해
            const radius = CONFIG.BASE_TOWER.ORBITAL_STRIKE_RADIUS;
            const dmg = CONFIG.BASE_TOWER.ORBITAL_STRIKE_DAMAGE;

            for (const enemy of enemyList) {
                if (enemy.active && enemy.hp > 0) {
                    const dist = Math.hypot(enemy.x - targetPos.x, enemy.y - targetPos.y);
                    if (dist <= radius) {
                        enemy.takeDamage(dmg, 'orbital');
                        particleSystem.addFloatingText(enemy.x, enemy.y, `-${dmg}`, '#ff4757', 16);
                    }
                }
            }
        }, 400);

        return true;
    }

    update(dt, enemyList, projectileList, soundManager) {
        this.animTimer += dt;
        if (this.orbitalCooldown > 0) {
            this.orbitalCooldown = Math.max(0, this.orbitalCooldown - dt);
        }

        // Automatic Base Self-Defense Turret Attack
        this.cooldownTimer -= dt;
        if (this.cooldownTimer <= 0) {
            // Find closest enemy
            const target = enemyList.find(e => e.active && e.hp > 0 && Math.hypot(e.x - this.x, e.y - this.y) <= this.range);
            if (target) {
                this.cooldownTimer = 1 / this.attackSpeed;
                soundManager.playShoot('gatling');
                projectileList.push(new Projectile({
                    x: this.x,
                    y: this.y,
                    target: target,
                    damage: this.damage,
                    speed: 600,
                    type: 'base_laser',
                    color: '#00d2ff'
                }));
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const pulse = Math.sin(this.animTimer * 3.2);
        const hpRatio = this.hp / this.maxHp;
        const coreColor = hpRatio > 0.5 ? '#d7ff66' : (hpRatio > 0.25 ? '#ffd166' : '#ff6b5f');

        // Ground beacon and shield telemetry.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(0, 13, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.rotate(this.animTimer * 0.18);
        drawSegmentedRing(ctx, 0, 0, 24 + pulse, 12, 'rgba(114, 231, 255, 0.58)', 1.5, 0);
        ctx.restore();

        ctx.save();
        ctx.rotate(-this.animTimer * 0.26);
        drawSegmentedRing(ctx, 0, 0, 19, 6, 'rgba(215, 255, 102, 0.44)', 1.1, Math.PI / 6, Math.max(1, Math.ceil(hpRatio * 6)));
        ctx.restore();

        // Layered command citadel.
        polygonPath(ctx, 0, 4, 18, 8, Math.PI / 8, 0.82);
        ctx.fillStyle = '#071318';
        ctx.fill();
        ctx.strokeStyle = 'rgba(114, 231, 255, 0.34)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        polygonPath(ctx, 0, -1, 15, 8, Math.PI / 8, 0.82);
        const armor = ctx.createLinearGradient(0, -16, 0, 14);
        armor.addColorStop(0, '#34505a');
        armor.addColorStop(0.5, '#182e36');
        armor.addColorStop(1, '#0e2026');
        ctx.fillStyle = armor;
        ctx.fill();
        ctx.strokeStyle = '#72e7ff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        drawBolts(ctx, 11, 4, '#8ba2a6', 1.1);

        // Four defensive pylons.
        ctx.fillStyle = '#1b343d';
        ctx.strokeStyle = 'rgba(114, 231, 255, 0.65)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = Math.PI / 4 + i * Math.PI / 2;
            const px = Math.cos(angle) * 13;
            const py = Math.sin(angle) * 10;
            ctx.fillRect(px - 2.5, py - 4, 5, 8);
            ctx.strokeRect(px - 2.5, py - 4, 5, 8);
        }

        // Animated reactor core.
        ctx.shadowColor = coreColor;
        ctx.shadowBlur = 12 + pulse * 2;
        polygonPath(ctx, 0, -2, 7, 6, Math.PI / 6, 0.95);
        ctx.fillStyle = coreColor;
        ctx.fill();
        ctx.shadowBlur = 0;
        drawGlowOrb(ctx, 0, -2, 3.2, coreColor);

        // Self-defense emitter.
        ctx.fillStyle = '#0b171c';
        ctx.strokeStyle = '#72e7ff';
        ctx.lineWidth = 1;
        ctx.fillRect(-3, -17, 6, 10);
        ctx.strokeRect(-3, -17, 6, 10);
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(0, -18, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 지켜야 하는 메인 타워 (Main Base) 클래스
import { CONFIG } from '../config.js';
import { Projectile } from './Projectile.js';

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

        // Base Protective Aura / Ring
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20 + Math.sin(this.animTimer * 4) * 2, 0, Math.PI * 2);
        ctx.stroke();

        // Main Fortress Structure
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-16, -16, 32, 32);
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -16, 32, 32);

        // Core Neon Crystal
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 프로스트 타워 (Frost Tower) & Blizzard/Cryo 분기
import { Tower } from './Tower.js';
import { statusSystem } from '../../engine/StatusEffectSystem.js';
import { CONFIG } from '../../config.js';

export class FrostTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'frost', cellSize);
        this.slowAmount = CONFIG.TOWERS.frost.slowAmount;
        this.slowDuration = CONFIG.TOWERS.frost.slowDuration;
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('frost');

        const isBlizzard = this.branch === 'blizzard';
        const isCryo = this.branch === 'cryo';

        const range = isBlizzard ? this.range * 1.5 : this.range;
        const slow = isCryo ? 0.75 : (isBlizzard ? 0.5 : 0.4);

        // Visual Frost Pulsing Ring Effect
        particleSystem.addShockwaveRing(this.x, this.y, range, 'rgba(0, 210, 255, 0.8)');

        // Apply Frost / Cryo Freeze to all enemies in range
        for (const enemy of enemyList) {
            if (enemy.active && enemy.hp > 0) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= range) {
                    if (isCryo && Math.random() < 0.35) {
                        // 35% 확률로 1.5초 완전 동결 (Frozen)
                        statusSystem.applyEffect(enemy, 'Frozen', 1.5);
                        particleSystem.addFloatingText(enemy.x, enemy.y, 'FROZEN!', '#93c5fd', 12);
                    } else {
                        // Chilled Slow Status
                        statusSystem.applyEffect(enemy, 'Chilled', this.slowDuration, slow);
                        enemy.takeDamage(this.damage, 'frost');
                    }
                }
            }
        }
    }

    renderTurret(ctx) {
        super.renderTurret(ctx);

        // Frost Ice Crystal Top Animation
        ctx.fillStyle = '#00d2ff';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing Ice Crystal Aura
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
    }
}

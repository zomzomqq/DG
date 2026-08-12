// 프로스트 타워 (Frost Tower) & Blizzard/Cryo 분기
import { Tower } from './Tower.js';
import { statusSystem } from '../../engine/StatusEffectSystem.js';
import { CONFIG } from '../../config.js';
import { drawGlowOrb, drawSegmentedRing, polygonPath } from '../../engine/CanvasArt.js';

export class FrostTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'frost', cellSize);
        this.slowAmount = CONFIG.TOWERS.frost.slowAmount;
        this.slowDuration = CONFIG.TOWERS.frost.slowDuration;
        this.visualTimer = Math.random() * Math.PI * 2;
    }

    upgradeBranch(branchKey) {
        const ok = super.upgradeBranch(branchKey);
        if (ok) {
            const spec = CONFIG.TOWERS.frost.upgrades.branches[branchKey];
            if (spec.slowMult) {
                this.slowAmount = Math.min(0.85, CONFIG.TOWERS.frost.slowAmount * spec.slowMult);
            }
        }
        return ok;
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('frost');

        const isCryo = this.branch === 'cryo';
        const range = this.range;
        const slow = this.slowAmount;

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

    update(dt, enemyList, projectileList, particleSystem, soundManager) {
        this.visualTimer += dt;
        super.update(dt, enemyList, projectileList, particleSystem, soundManager);
    }

    renderTurret(ctx) {
        super.renderTurret(ctx);

        const accent = this.branch === 'cryo' ? '#e6fbff' : (this.branch === 'blizzard' ? '#72e7ff' : '#8bdfff');
        const pulse = Math.sin(this.visualTimer * 2.4) * 0.8;

        ctx.save();
        ctx.rotate(this.visualTimer * 0.34);
        drawSegmentedRing(ctx, 0, -2, 13 + pulse, this.branch === 'blizzard' ? 8 : 6, accent, 1.4, 0);
        ctx.restore();

        ctx.save();
        ctx.rotate(-this.visualTimer * 0.2);
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#183942';
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(3, -13);
            ctx.lineTo(0, -17);
            ctx.lineTo(-3, -13);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();

        polygonPath(ctx, 0, -2, 8, 6, Math.PI / 6, 0.95);
        ctx.fillStyle = '#15323a';
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.stroke();

        drawGlowOrb(ctx, 0, -2, this.isOverclocked ? 4 : 3.2, this.isOverclocked ? '#ff9d66' : accent);
    }
}

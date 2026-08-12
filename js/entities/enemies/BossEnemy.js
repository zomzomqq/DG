// 보스 유닛 (Siege Walker Boss) & 4-Phase System
import { Enemy } from './Enemy.js';
import { statusSystem } from '../../engine/StatusEffectSystem.js';

export class BossEnemy extends Enemy {
    constructor(path, worldPos) {
        super('boss', path, worldPos);

        this.phase = 1;
        this.phaseShieldTriggered = false;
        this.phaseEmpTriggered = false;
        this.phaseRageTriggered = false;
    }

    update(dt, gameEngine) {
        super.update(dt, gameEngine);
        if (!this.active || this.hp <= 0) return;

        const hpRatio = this.hp / this.maxHp;

        // Phase 2: Shield Phase (70% HP)
        if (hpRatio <= 0.7 && !this.phaseShieldTriggered) {
            this.phaseShieldTriggered = true;
            this.phase = 2;
            this.shieldHp = 500;
            this.maxShieldHp = 500;
            if (gameEngine) {
                gameEngine.particleSystem.addFloatingText(this.x, this.y - 25, 'BOSS PHASE 2: SHIELD ENGAGED!', '#3498db', 16);
                gameEngine.soundManager.playExplosion();
            }
        }

        // Phase 3: EMP Phase (40% HP)
        if (hpRatio <= 0.4 && !this.phaseEmpTriggered) {
            this.phaseEmpTriggered = true;
            this.phase = 3;
            if (gameEngine) {
                gameEngine.particleSystem.addFloatingText(this.x, this.y - 25, 'BOSS PHASE 3: EMP PULSE!', '#9b59b6', 16);
                gameEngine.soundManager.playOrbitalStrike();

                // 주변 타워 EMP 마비 디버프 적용
                for (const tower of gameEngine.towers) {
                    if (tower.active && Math.hypot(tower.x - this.x, tower.y - this.y) <= 220) {
                        statusSystem.applyEffect(tower, 'EMP', 5.0);
                        gameEngine.particleSystem.addFloatingText(tower.x, tower.y - 10, 'EMP DISABLED', '#9b59b6', 12);
                    }
                }
            }
        }

        // Phase 4: Rage Phase (20% HP)
        if (hpRatio <= 0.2 && !this.phaseRageTriggered) {
            this.phaseRageTriggered = true;
            this.phase = 4;
            this.speed *= 1.6;
            this.slowResist = 0.9; // 둔화 90% 저항
            if (gameEngine) {
                gameEngine.particleSystem.addFloatingText(this.x, this.y - 25, 'BOSS PHASE 4: OVERDRIVE RAGE!', '#e74c3c', 18);
                gameEngine.soundManager.playExplosion();
            }
        }
    }

    render(ctx) {
        super.render(ctx);
        if (!this.active || this.hp <= 0) return;

        // Phase Crown Overlay
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.fillStyle = '#ff4757';
        ctx.textAlign = 'center';
        ctx.fillText(`P${this.phase} BOSS`, 0, -this.size - 18);
        ctx.restore();
    }
}

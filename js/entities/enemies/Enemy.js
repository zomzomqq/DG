// 적 유닛 (Enemy) 기본 클래스 & 행동 특성 (Traits)
import { CONFIG } from '../../config.js';
import { statusSystem } from '../../engine/StatusEffectSystem.js';

export class Enemy {
    constructor(type, path, worldPos) {
        this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.type = type;
        const spec = CONFIG.ENEMIES[type] || CONFIG.ENEMIES.basic;

        this.name = spec.name;
        this.maxHp = spec.hp;
        this.hp = spec.hp;

        this.shieldHp = spec.shieldHp || 0;
        this.maxShieldHp = this.shieldHp;

        this.speed = spec.speed;
        this.reward = spec.reward;
        this.color = spec.color;
        this.size = spec.size || 10;

        this.aiLevel = spec.aiLevel || 'normal';
        this.slowResist = spec.slowResist || 0;
        this.regenRate = spec.regenRate || 0;
        this.auraRange = spec.auraRange || 0;

        // [P3 수정] 피격 후 일정 시간(3초) 미피격 시에만 자연 회복
        this.timeSinceLastHit = 999;

        // Path Movement
        this.path = path || [];
        this.pathIndex = 0;

        if (worldPos) {
            this.x = worldPos.x;
            this.y = worldPos.y;
        } else if (this.path.length > 0) {
            this.x = this.path[0].x;
            this.y = this.path[0].y;
        } else {
            this.x = 0;
            this.y = 0;
        }

        this.active = true;
        this.currentSpeed = this.speed;
        this.gatlingHits = 0;
    }

    updatePath(newPath) {
        if (!newPath || newPath.length === 0) return;
        this.path = newPath;
        let closestDist = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < newPath.length; i++) {
            const d = Math.hypot(newPath[i].x - this.x, newPath[i].y - this.y);
            if (d < closestDist) {
                closestDist = d;
                closestIdx = i;
            }
        }
        this.pathIndex = closestIdx;
    }

    getDistanceToBase() {
        if (!this.path || this.pathIndex >= this.path.length) return 0;
        let dist = Math.hypot(this.path[this.pathIndex].x - this.x, this.path[this.pathIndex].y - this.y);
        for (let i = this.pathIndex; i < this.path.length - 1; i++) {
            dist += Math.hypot(this.path[i + 1].x - this.path[i].x, this.path[i + 1].y - this.path[i].y);
        }
        return dist;
    }

    takeDamage(amount, damageType = 'normal') {
        this.timeSinceLastHit = 0; // Reset last hit timer
        let finalDamage = amount;

        // [P2 수정] Engineer 쉴드 버프(statusSystem Shield) 및 본체 shieldHp 통합 반영
        const statusShield = statusSystem.getEffectValue(this, 'Shield');
        if (statusShield > 0) {
            if (statusShield >= finalDamage) {
                statusSystem.applyEffect(this, 'Shield', 1.0, statusShield - finalDamage);
                return;
            } else {
                finalDamage -= statusShield;
                statusSystem.removeEffect(this, 'Shield');
            }
        }

        if (this.shieldHp > 0) {
            if (this.shieldHp >= finalDamage) {
                this.shieldHp -= finalDamage;
                return;
            } else {
                finalDamage -= this.shieldHp;
                this.shieldHp = 0;
            }
        }

        this.hp -= finalDamage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
        }
    }

    update(dt, gameEngine) {
        if (!this.active || this.hp <= 0) return;

        this.timeSinceLastHit += dt;

        // [P3 수정] Regenerator Trait: 피격되지 않은 상태로 3초 이상 경과 시 회복
        if (this.regenRate > 0 && this.hp < this.maxHp && this.timeSinceLastHit >= 3.0) {
            this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
        }

        // Engineer Trait: Aura Buff to surrounding allies
        if (this.auraRange > 0 && gameEngine && gameEngine.enemies) {
            for (const ally of gameEngine.enemies) {
                if (ally !== this && ally.active && Math.hypot(ally.x - this.x, ally.y - this.y) <= this.auraRange) {
                    statusSystem.applyEffect(ally, 'Shield', 1.0, 50);
                }
            }
        }

        let speedMult = 1.0;

        if (statusSystem.hasEffect(this, 'Frozen')) {
            speedMult = 0;
        } else if (statusSystem.hasEffect(this, 'Chilled')) {
            const slowVal = statusSystem.getEffectValue(this, 'Chilled');
            const effectiveSlow = slowVal * (1 - this.slowResist);
            speedMult = Math.max(0.2, 1.0 - effectiveSlow);
        }

        this.currentSpeed = this.speed * speedMult;

        if (this.path && this.pathIndex < this.path.length) {
            const targetNode = this.path[this.pathIndex];
            const dx = targetNode.x - this.x;
            const dy = targetNode.y - this.y;
            const dist = Math.hypot(dx, dy);

            const moveStep = this.currentSpeed * dt;

            if (dist <= moveStep + 2) {
                this.x = targetNode.x;
                this.y = targetNode.y;
                this.pathIndex++;

                if (this.pathIndex >= this.path.length) {
                    this.onReachBase(gameEngine);
                }
            } else {
                this.x += (dx / dist) * moveStep;
                this.y += (dy / dist) * moveStep;
            }
        }
    }

    onReachBase(gameEngine) {
        this.active = false;
        if (gameEngine && gameEngine.baseTower) {
            gameEngine.baseTower.takeDamage(10);
            gameEngine.particleSystem.addFloatingText(this.x, this.y, '-10 HP', '#ff4757', 16);
            gameEngine.soundManager.playExplosion();
        }
    }

    render(ctx) {
        if (!this.active || this.hp <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const statusShield = statusSystem.getEffectValue(this, 'Shield');
        if (this.shieldHp > 0 || statusShield > 0) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        const barWidth = 24;
        const barHeight = 4;
        const hpPercent = this.hp / this.maxHp;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barWidth / 2, -this.size - 10, barWidth, barHeight);

        ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : (hpPercent > 0.25 ? '#f1c40f' : '#e74c3c');
        ctx.fillRect(-barWidth / 2, -this.size - 10, barWidth * hpPercent, barHeight);

        ctx.restore();

        statusSystem.renderTargetBadges(ctx, this);
    }
}

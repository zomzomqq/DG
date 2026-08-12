// 적 유닛 (Enemy) 기본 클래스 & 행동 특성 (Traits)
import { CONFIG } from '../../config.js';
import { statusSystem } from '../../engine/StatusEffectSystem.js';
import { drawGlowOrb, drawSegmentedRing, drawTacticalBar, polygonPath } from '../../engine/CanvasArt.js';

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

        this.timeSinceLastHit = 999;
        this.auraTimer = 0; // [P2 2차 수정] Engineer 쉴드 오라 쿨다운 타이머 (2.5초 간격)

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
        this.visualTimer = Math.random() * Math.PI * 2;
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
        this.timeSinceLastHit = 0;
        let finalDamage = amount;

        // [P2 2차 수정] setEffectValue를 통해 쉴드 잔량 직접 감소
        const statusShield = statusSystem.getEffectValue(this, 'Shield');
        if (statusShield > 0) {
            if (statusShield >= finalDamage) {
                statusSystem.setEffectValue(this, 'Shield', statusShield - finalDamage);
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

        this.visualTimer += dt;
        this.timeSinceLastHit += dt;

        // Regenerator Trait: 피격 후 3초 경과 시 회복
        if (this.regenRate > 0 && this.hp < this.maxHp && this.timeSinceLastHit >= 3.0) {
            this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
        }

        // [P2 2차 수정] Engineer Trait: 2.5초 간격으로 주변 아군에 50 쉴드 부여 (무한 재충전 방지)
        if (this.auraRange > 0 && gameEngine && gameEngine.enemies) {
            this.auraTimer -= dt;
            if (this.auraTimer <= 0) {
                this.auraTimer = 2.5; // 2.5초 쿨다운
                for (const ally of gameEngine.enemies) {
                    if (ally !== this && ally.active && Math.hypot(ally.x - this.x, ally.y - this.y) <= this.auraRange) {
                        statusSystem.applyEffect(ally, 'Shield', 3.0, 50);
                    }
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

        const pulse = Math.sin(this.visualTimer * 4) * 0.8;
        const heading = this.path && this.pathIndex < this.path.length
            ? Math.atan2(this.path[this.pathIndex].y - this.y, this.path[this.pathIndex].x - this.x)
            : 0;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(1, this.size * 0.55, this.size * 1.15, this.size * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(heading);
        this.renderUnitBody(ctx, pulse);
        ctx.rotate(-heading);

        const statusShield = statusSystem.getEffectValue(this, 'Shield');
        if (this.shieldHp > 0 || statusShield > 0) {
            ctx.save();
            ctx.rotate(this.visualTimer * 0.7);
            drawSegmentedRing(ctx, 0, 0, this.size + 5 + pulse * 0.3, 6, '#72e7ff', 1.8, 0, 5);
            ctx.restore();
        }

        const barWidth = Math.max(24, this.size * 2.2);
        const barHeight = 3;
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? '#d7ff66' : (hpPercent > 0.25 ? '#ffd166' : '#ff6b5f');
        drawTacticalBar(ctx, -barWidth / 2, -this.size - 11, barWidth, barHeight, hpPercent, hpColor);

        ctx.restore();

        statusSystem.renderTargetBadges(ctx, this);
    }

    renderUnitBody(ctx, pulse) {
        const outline = '#f2b0a8';
        const accent = this.color;
        const size = this.size;

        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        ctx.fillStyle = '#2b1719';

        if (this.type === 'runner') {
            ctx.fillStyle = '#302b16';
            ctx.beginPath();
            ctx.moveTo(size + 4, 0);
            ctx.lineTo(-size * 0.55, -size * 0.72);
            ctx.lineTo(-size * 0.25, 0);
            ctx.lineTo(-size * 0.55, size * 0.72);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = accent;
            ctx.beginPath();
            ctx.moveTo(-size * 0.2, -size * 0.8);
            ctx.lineTo(-size * 1.2, -size * 1.15);
            ctx.moveTo(-size * 0.2, size * 0.8);
            ctx.lineTo(-size * 1.2, size * 1.15);
            ctx.stroke();
        } else if (this.type === 'tank' || this.type === 'unstoppable') {
            ctx.fillStyle = this.type === 'tank' ? '#2b1b31' : '#292d2e';
            polygonPath(ctx, 0, 0, size, 8, Math.PI / 8, 0.82);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#101719';
            ctx.fillRect(-size * 0.45, -size * 0.7, size * 0.9, size * 1.4);
            ctx.strokeStyle = accent;
            ctx.strokeRect(-size * 0.45, -size * 0.7, size * 0.9, size * 1.4);
            ctx.fillStyle = accent;
            ctx.fillRect(size * 0.25, -2, size * 0.9, 4);
        } else if (this.type === 'shield') {
            polygonPath(ctx, -1, 0, size, 6, 0, 0.9);
            ctx.fillStyle = '#152d3a';
            ctx.fill();
            ctx.strokeStyle = '#72e7ff';
            ctx.stroke();
            ctx.strokeStyle = 'rgba(114, 231, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(3, 0, size * 0.7, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
        } else if (this.type === 'swarm') {
            ctx.fillStyle = '#382114';
            polygonPath(ctx, 0, 0, size, 6, 0, 0.82);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = accent;
            for (const y of [-size * 0.65, 0, size * 0.65]) {
                ctx.beginPath();
                ctx.moveTo(-size * 0.3, y);
                ctx.lineTo(-size * 1.25, y * 1.25);
                ctx.moveTo(size * 0.25, y);
                ctx.lineTo(size * 1.15, y * 1.2);
                ctx.stroke();
            }
        } else if (this.type === 'regenerator') {
            polygonPath(ctx, 0, 0, size, 6, Math.PI / 6, 0.95);
            ctx.fillStyle = '#153126';
            ctx.fill();
            ctx.strokeStyle = '#73f0a6';
            ctx.stroke();
            ctx.strokeStyle = '#73f0a6';
            ctx.beginPath();
            ctx.moveTo(-size * 0.45, 0);
            ctx.lineTo(size * 0.45, 0);
            ctx.moveTo(0, -size * 0.45);
            ctx.lineTo(0, size * 0.45);
            ctx.stroke();
        } else if (this.type === 'splitter') {
            polygonPath(ctx, 0, 0, size, 6, Math.PI / 6, 0.9);
            ctx.fillStyle = '#123632';
            ctx.fill();
            ctx.strokeStyle = '#4ff0d0';
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-size * 0.55, -size * 0.55);
            ctx.lineTo(size * 0.55, size * 0.55);
            ctx.moveTo(size * 0.55, -size * 0.55);
            ctx.lineTo(-size * 0.55, size * 0.55);
            ctx.stroke();
        } else if (this.type === 'engineer') {
            polygonPath(ctx, 0, 0, size, 8, Math.PI / 8, 0.86);
            ctx.fillStyle = '#352016';
            ctx.fill();
            ctx.strokeStyle = '#ff9d66';
            ctx.stroke();
            ctx.save();
            ctx.rotate(this.visualTimer);
            drawSegmentedRing(ctx, 0, 0, size * 0.75, 4, '#ffd166', 1.2, Math.PI / 4);
            ctx.restore();
        } else {
            // Grunt body: directional assault drone.
            ctx.fillStyle = '#32191c';
            polygonPath(ctx, 0, 0, size, 6, 0, 0.85);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#101719';
            ctx.fillRect(-size * 0.25, -size * 0.72, size * 0.52, size * 1.44);
            ctx.fillStyle = accent;
            ctx.fillRect(size * 0.45, -2, size * 0.78, 4);
        }

        drawGlowOrb(ctx, size * 0.12, 0, Math.max(1.4, size * 0.18 + pulse * 0.05), accent, '#fff4ee');
    }
}

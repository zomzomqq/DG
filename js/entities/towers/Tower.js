// 기본 디펜스 타워 (Tower) 공통 추상 클래스
import { CONFIG } from '../../config.js';
import { TargetingStrategy } from '../../ai/TargetingStrategy.js';
import { statusSystem } from '../../engine/StatusEffectSystem.js';

export class Tower {
    constructor(col, row, type, cellSize) {
        this.id = `tower_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.col = col;
        this.row = row;
        this.type = type;
        this.cellSize = cellSize;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;

        const spec = CONFIG.TOWERS[type];
        this.name = spec.name;
        this.icon = spec.icon;
        this.cost = spec.cost;
        this.totalInvestedCost = spec.cost;
        this.range = spec.range;
        this.damage = spec.damage;
        this.attackSpeed = spec.attackSpeed;
        this.heatIncrease = spec.heatIncrease || 10;

        this.level = 1; // Lv 1, Lv 2, Lv 3 (Branch)
        this.branch = null; // 'minigun', 'railgun', 'siege', 'cluster', 'blizzard', 'cryo'
        this.targetStrategy = 'First'; // 'First', 'Last', 'Strongest', 'Weakest', 'Fastest'

        this.cooldownTimer = 0;
        this.target = null;
        this.active = true;

        // Heat & Overclock Mechanics
        this.heat = 0; // 0 ~ 100%
        this.isOverclocked = false;

        this.rotation = 0;
    }

    getDPS() {
        return this.damage * this.attackSpeed * (this.isOverclocked ? 1.6 : 1.0);
    }

    setTargetStrategy(strategy) {
        this.targetStrategy = strategy;
    }

    toggleOverclock() {
        if (statusSystem.hasEffect(this, 'Overheat') || statusSystem.hasEffect(this, 'EMP')) return false;
        this.isOverclocked = !this.isOverclocked;
        return this.isOverclocked;
    }

    upgradeNormal() {
        if (this.level !== 1) return false;

        const spec = CONFIG.TOWERS[this.type];
        const cost = spec.upgrades.level2Cost;

        this.level = 2;
        this.damage = Math.floor(this.damage * 1.35);
        this.range = Math.floor(this.range * 1.15);
        this.totalInvestedCost += cost;

        return true;
    }

    upgradeBranch(branchKey) {
        if (this.level !== 2) return false;

        const spec = CONFIG.TOWERS[this.type];
        const branchSpec = spec.upgrades.branches[branchKey];
        if (!branchSpec) return false;

        this.level = 3;
        this.branch = branchKey;
        this.totalInvestedCost += branchSpec.cost;

        if (branchSpec.damageMult) this.damage = Math.floor(this.damage * branchSpec.damageMult);
        if (branchSpec.speedMult) this.attackSpeed *= branchSpec.speedMult;
        if (branchSpec.rangeMult) this.range = Math.floor(this.range * branchSpec.rangeMult);

        return true;
    }

    updateHeat(dt) {
        // EMP 또는 Overheat 디버프 체크
        if (statusSystem.hasEffect(this, 'EMP')) {
            this.isOverclocked = false;
            return;
        }

        if (statusSystem.hasEffect(this, 'Overheat')) {
            this.isOverclocked = false;
            this.heat = Math.max(0, this.heat - dt * 30); // 쿨다운 쿨링
            return;
        }

        if (this.isOverclocked) {
            this.heat += dt * this.heatIncrease * 3.5;
            if (this.heat >= 100) {
                this.heat = 100;
                this.isOverclocked = false;
                statusSystem.applyEffect(this, 'Overheat', 5.0); // 5초 과열 공격 마비
            }
        } else {
            this.heat = Math.max(0, this.heat - dt * 25);
        }
    }

    update(dt, enemyList, projectileList, particleSystem, soundManager) {
        this.updateHeat(dt);

        if (statusSystem.hasEffect(this, 'Overheat') || statusSystem.hasEffect(this, 'EMP')) {
            return; // Overheat/EMP 상태 시 공격 불가
        }

        this.cooldownTimer -= dt;

        // Target Acquisition
        this.target = TargetingStrategy.selectTarget(
            this.targetStrategy,
            { x: this.x, y: this.y },
            this.range,
            enemyList
        );

        if (this.target) {
            this.rotation = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        }

        if (this.cooldownTimer <= 0 && this.target) {
            const currentSpeed = this.isOverclocked ? this.attackSpeed * 1.6 : this.attackSpeed;
            this.cooldownTimer = 1 / currentSpeed;
            this.fire(enemyList, projectileList, particleSystem, soundManager);
        }
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        // Abstract method implemented by subclasses
    }

    render(ctx, isSelected = false) {
        const off = CONFIG.MOUND.HEIGHT_OFFSET / 2;

        ctx.save();
        ctx.translate(this.x, this.y - off);

        // Selection Range Indicator
        if (isSelected) {
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 210, 255, 0.05)';
            ctx.fill();
        }

        // Subclass Specific Turret Graphics rendering
        this.renderTurret(ctx);

        // Overheat / EMP Icon
        if (statusSystem.hasEffect(this, 'Overheat')) {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔥', 0, -22);
        } else if (statusSystem.hasEffect(this, 'EMP')) {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', 0, -22);
        }

        ctx.restore();
    }

    renderTurret(ctx) {
        // Base Turret Plate
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
    }
}

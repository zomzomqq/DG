// 기본 디펜스 타워 (Tower) 공통 추상 클래스
import { CONFIG } from '../../config.js';
import { TargetingStrategy } from '../../ai/TargetingStrategy.js';
import { statusSystem } from '../../engine/StatusEffectSystem.js';
import { drawBolts, drawCornerBrackets, drawSegmentedRing, polygonPath } from '../../engine/CanvasArt.js';

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
        this.targetStrategy = 'First';

        this.cooldownTimer = 0;
        this.target = null;
        this.active = true;

        // Heat & Overclock Mechanics
        this.heat = 0; // 0 ~ 100%
        this.isOverclocked = false;

        this.rotation = 0;
    }

    getSellValue() {
        return Math.floor((this.totalInvestedCost || this.cost) * 0.7);
    }

    getDPS() {
        // [P2 수정] Overclock 시 공속 +60% (1.6배) 일관 적용
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
        if (statusSystem.hasEffect(this, 'EMP')) {
            this.isOverclocked = false;
            return;
        }

        if (statusSystem.hasEffect(this, 'Overheat')) {
            this.isOverclocked = false;
            this.heat = Math.max(0, this.heat - dt * 30);
            return;
        }

        if (this.isOverclocked) {
            this.heat += dt * this.heatIncrease * 3.5;
            if (this.heat >= 100) {
                this.heat = 100;
                this.isOverclocked = false;
                statusSystem.applyEffect(this, 'Overheat', 5.0); // 5초 과열
            }
        } else {
            this.heat = Math.max(0, this.heat - dt * 25);
        }
    }

    update(dt, enemyList, projectileList, particleSystem, soundManager) {
        this.updateHeat(dt);

        if (statusSystem.hasEffect(this, 'Overheat') || statusSystem.hasEffect(this, 'EMP')) {
            return;
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
            // [P2 수정] Overclock 시 공속 1.6배 적용 (+60% DPS)
            const currentSpeed = this.isOverclocked ? this.attackSpeed * 1.6 : this.attackSpeed;
            this.cooldownTimer = 1 / currentSpeed;
            this.fire(enemyList, projectileList, particleSystem, soundManager);
        }
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        // Abstract method
    }

    render(ctx, isSelected = false) {
        const off = CONFIG.MOUND.HEIGHT_OFFSET / 2;

        ctx.save();
        ctx.translate(this.x, this.y - off);

        if (isSelected) {
            ctx.fillStyle = 'rgba(114, 231, 255, 0.025)';
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(114, 231, 255, 0.42)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 7]);
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            drawSegmentedRing(ctx, 0, 0, 22, 8, '#d7ff66', 1.4, -Math.PI / 8);
            drawCornerBrackets(ctx, -19, -19, 38, 38, 6, '#72e7ff', 1.2);
        }

        this.renderTurret(ctx);

        if (statusSystem.hasEffect(this, 'Overheat') || statusSystem.hasEffect(this, 'EMP')) {
            const isEmp = statusSystem.hasEffect(this, 'EMP');
            ctx.fillStyle = isEmp ? 'rgba(170, 100, 255, 0.16)' : 'rgba(255, 107, 95, 0.16)';
            ctx.strokeStyle = isEmp ? '#b47cff' : '#ff6b5f';
            ctx.lineWidth = 1;
            ctx.fillRect(-13, -29, 26, 9);
            ctx.strokeRect(-13, -29, 26, 9);
            ctx.fillStyle = isEmp ? '#d8b9ff' : '#ff9d91';
            ctx.font = '700 6px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isEmp ? 'EMP LOCK' : 'OVERHEAT', 0, -22.5);
        }

        ctx.restore();
    }

    renderTurret(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.beginPath();
        ctx.ellipse(0, 7, 17, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        polygonPath(ctx, 0, 1, 15, 8, Math.PI / 8, 0.82);
        const chassis = ctx.createLinearGradient(0, -14, 0, 14);
        chassis.addColorStop(0, '#455e66');
        chassis.addColorStop(0.55, '#233a42');
        chassis.addColorStop(1, '#11262c');
        ctx.fillStyle = chassis;
        ctx.fill();
        ctx.strokeStyle = 'rgba(199, 229, 218, 0.36)';
        ctx.lineWidth = 1;
        ctx.stroke();

        polygonPath(ctx, 0, -2, 10, 8, Math.PI / 8, 0.88);
        ctx.fillStyle = '#0b181d';
        ctx.fill();
        ctx.strokeStyle = 'rgba(114, 231, 255, 0.22)';
        ctx.stroke();
        drawBolts(ctx, 11, 4, '#81959b', 1, Math.PI / 4);

        const levelColor = this.level === 3 ? '#d7ff66' : (this.level === 2 ? '#72e7ff' : 'rgba(190, 216, 208, 0.48)');
        ctx.strokeStyle = levelColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < this.level; i++) {
            ctx.moveTo(-5 + i * 5, 10);
            ctx.lineTo(-2 + i * 5, 10);
        }
        ctx.stroke();
    }
}

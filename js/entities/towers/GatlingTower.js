// 가틀링 타워 (Gatling Tower) & Minigun/Railgun 분기
import { Tower } from './Tower.js';
import { Projectile } from '../Projectile.js';
import { drawGlowOrb, polygonPath } from '../../engine/CanvasArt.js';

export class GatlingTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'gatling', cellSize);
        this.lastTargetId = null;
        this.targetStack = 0; // Minigun 지속 사격 예열 스택 (최대 10스택)
    }

    upgradeBranch(branchKey) {
        const ok = super.upgradeBranch(branchKey);
        if (ok) {
            this.targetStack = 0;
            this.lastTargetId = null;
        }
        return ok;
    }

    update(dt, enemyList, projectileList, particleSystem, soundManager) {
        super.update(dt, enemyList, projectileList, particleSystem, soundManager);

        if (this.branch === 'minigun') {
            if (this.target) {
                if (this.lastTargetId === this.target.id) {
                    this.targetStack = Math.min(10, this.targetStack + dt * 4);
                } else {
                    this.lastTargetId = this.target.id;
                    this.targetStack = 0;
                }
            } else {
                this.targetStack = Math.max(0, this.targetStack - dt * 5);
            }
        } else {
            this.targetStack = 0;
            this.lastTargetId = null;
        }
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('gatling');

        const isRailgun = this.branch === 'railgun';
        const isMinigun = this.branch === 'minigun';

        // [P3 5차 수정] fire() 직전에도 이번 사격 타겟이 변경되었는지 2중 방어 검사
        if (isMinigun && this.target && this.lastTargetId !== this.target.id) {
            this.targetStack = 0;
            this.lastTargetId = this.target.id;
        }

        const stackSpeedBonus = isMinigun ? (1 + (this.targetStack / 10) * 0.8) : 1.0;
        const currentSpeed = (this.isOverclocked ? this.attackSpeed * 1.6 : this.attackSpeed) * stackSpeedBonus;
        
        this.cooldownTimer = 1 / currentSpeed;

        if (isRailgun) {
            projectileList.push(new Projectile({
                x: this.x,
                y: this.y,
                target: this.target,
                damage: this.damage,
                type: 'railgun',
                color: '#00ffaa'
            }));
        } else {
            const speed = isMinigun ? 1000 : 800;

            projectileList.push(new Projectile({
                x: this.x,
                y: this.y,
                target: this.target,
                damage: this.damage,
                speed: speed,
                type: 'bullet',
                color: isMinigun ? '#ffd166' : '#00d2ff',
                towerRef: this
            }));
        }
    }

    renderTurret(ctx) {
        super.renderTurret(ctx);

        const accent = this.branch === 'minigun' ? '#ffd166' : (this.branch === 'railgun' ? '#d7ff66' : '#72e7ff');

        ctx.save();
        ctx.rotate(this.rotation);

        // Servo collar.
        polygonPath(ctx, 0, -2, 8, 8, Math.PI / 8, 0.86);
        ctx.fillStyle = '#253d45';
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (this.branch === 'railgun') {
            ctx.fillStyle = '#162f2d';
            ctx.fillRect(4, -6, 23, 4);
            ctx.fillRect(4, 2, 23, 4);
            ctx.strokeStyle = accent;
            ctx.strokeRect(4, -6, 23, 4);
            ctx.strokeRect(4, 2, 23, 4);
            ctx.fillStyle = accent;
            ctx.fillRect(8, -1, 21, 2);
            ctx.fillRect(28, -4, 3, 8);
        } else if (this.branch === 'minigun') {
            ctx.fillStyle = '#2a2d27';
            ctx.fillRect(4, -7, 17, 14);
            ctx.strokeStyle = accent;
            ctx.strokeRect(4, -7, 17, 14);
            ctx.fillStyle = '#8e9a91';
            for (const y of [-4, 0, 4]) ctx.fillRect(13, y - 1, 13, 2);
            ctx.fillStyle = accent;
            ctx.fillRect(24, -5, 3, 10);
        } else {
            ctx.fillStyle = '#314a52';
            ctx.fillRect(4, -4, 16, 8);
            ctx.strokeStyle = accent;
            ctx.strokeRect(4, -4, 16, 8);
            ctx.fillStyle = '#8aa1a6';
            ctx.fillRect(16, -2, 10, 4);
            ctx.fillStyle = accent;
            ctx.fillRect(24, -3, 3, 6);
        }

        ctx.restore();

        drawGlowOrb(ctx, 0, -2, this.isOverclocked ? 3.7 : 3, this.isOverclocked ? '#ff7f50' : accent);
    }
}

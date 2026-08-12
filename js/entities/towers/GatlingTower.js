// 가틀링 타워 (Gatling Tower) & Minigun/Railgun 분기
import { Tower } from './Tower.js';
import { Projectile } from '../Projectile.js';

export class GatlingTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'gatling', cellSize);
        this.lastTargetId = null;
        this.targetStack = 0; // Minigun 지속 사격 예열 스택 (최대 10스택)
    }

    upgradeBranch(branchKey) {
        const ok = super.upgradeBranch(branchKey);
        if (ok) {
            // [P3 3차 수정] 분기 변경 시 예열 스택 초기화
            this.targetStack = 0;
            this.lastTargetId = null;
        }
        return ok;
    }

    update(dt, enemyList, projectileList, particleSystem, soundManager) {
        // [P2 3차 수정] 중복 this.updateHeat(dt) 호출 제거! (부모 super.update에서 1회만 수행)
        
        // [P3 3차 수정] Minigun 분기일 때만 targetStack 예열 스택 동작
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

        super.update(dt, enemyList, projectileList, particleSystem, soundManager);
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('gatling');

        const isRailgun = this.branch === 'railgun';
        const isMinigun = this.branch === 'minigun';

        // Minigun 분기 시 스택에 의한 공속 가속 연사
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

        ctx.rotate(this.rotation);

        ctx.fillStyle = '#64748b';

        if (this.branch === 'railgun') {
            ctx.fillStyle = '#00ffaa';
            ctx.fillRect(4, -4, 22, 3);
            ctx.fillRect(4, 1, 22, 3);
        } else if (this.branch === 'minigun') {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(4, -6, 18, 12);
        } else {
            ctx.fillRect(4, -3, 16, 6);
        }

        ctx.fillStyle = this.isOverclocked ? '#ff7f50' : '#00d2ff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

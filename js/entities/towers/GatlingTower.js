// 가틀링 타워 (Gatling Tower) & Minigun/Railgun 분기
import { Tower } from './Tower.js';
import { Projectile } from '../Projectile.js';

export class GatlingTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'gatling', cellSize);
        this.lastTargetId = null;
        this.targetStack = 0; // Minigun 지속 공격 예열 스택 (최대 10스택)
    }

    update(dt, enemyList, projectileList, particleSystem, soundManager) {
        this.updateHeat(dt);

        if (this.target) {
            if (this.lastTargetId === this.target.id) {
                // 지속 사격 시 스택 상승
                this.targetStack = Math.min(10, this.targetStack + dt * 4);
            } else {
                this.lastTargetId = this.target.id;
                this.targetStack = 0;
            }
        } else {
            this.targetStack = Math.max(0, this.targetStack - dt * 5);
        }

        super.update(dt, enemyList, projectileList, particleSystem, soundManager);
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('gatling');

        const isRailgun = this.branch === 'railgun';
        const isMinigun = this.branch === 'minigun';

        // [P3 2차 수정] Minigun: 예열 스택 시 발사 쿨타임 단축 (공속 가속 연사)
        const stackSpeedBonus = isMinigun ? (1 + (this.targetStack / 10) * 0.8) : 1.0; // 최대 +80% 공속 가속
        const currentSpeed = (this.isOverclocked ? this.attackSpeed * 1.6 : this.attackSpeed) * stackSpeedBonus;
        
        // 다음 사격 쿨타임 재설정
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

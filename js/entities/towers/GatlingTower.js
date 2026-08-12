// 가틀링 타워 (Gatling Tower) & Minigun/Railgun 분기
import { Tower } from './Tower.js';
import { Projectile } from '../Projectile.js';

export class GatlingTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'gatling', cellSize);
        this.lastTargetId = null;
        this.targetStack = 0; // Minigun 지속 공격 예열 스택
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('gatling');

        const isRailgun = this.branch === 'railgun';
        const isMinigun = this.branch === 'minigun';

        // [P3 수정] Minigun: 동일 타겟 지속 공격 시 예열 스택 (스택당 공속 5% 증가, 최대 10스택)
        if (isMinigun && this.target) {
            if (this.lastTargetId === this.target.id) {
                this.targetStack = Math.min(10, this.targetStack + 1);
            } else {
                this.lastTargetId = this.target.id;
                this.targetStack = 0;
            }
        }

        const stackBonus = isMinigun ? (1 + this.targetStack * 0.05) : 1.0;

        if (isRailgun) {
            // Railgun: 관통 빔 사격 (Overclock 중복 곱셈 제거)
            projectileList.push(new Projectile({
                x: this.x,
                y: this.y,
                target: this.target,
                damage: this.damage,
                type: 'railgun',
                color: '#00ffaa'
            }));
        } else {
            // Gatling / Minigun
            const speed = isMinigun ? 1000 : 800;
            const dmg = isMinigun ? this.damage * stackBonus : this.damage;

            projectileList.push(new Projectile({
                x: this.x,
                y: this.y,
                target: this.target,
                damage: dmg,
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

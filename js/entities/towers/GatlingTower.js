// 가틀링 타워 (Gatling Tower) & Minigun/Railgun 분기
import { Tower } from './Tower.js';
import { Projectile } from '../Projectile.js';

export class GatlingTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'gatling', cellSize);
        this.spinAngle = 0;
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('gatling');

        const isRailgun = this.branch === 'railgun';
        const isMinigun = this.branch === 'minigun';

        if (isRailgun) {
            // Railgun: 관통 빔 사격
            projectileList.push(new Projectile({
                x: this.x,
                y: this.y,
                target: this.target,
                damage: this.damage * (this.isOverclocked ? 1.5 : 1.0),
                type: 'railgun',
                color: '#00ffaa'
            }));
        } else {
            // Gatling / Minigun: 고속 연속 탄환 발사
            const speed = isMinigun ? 1000 : 800;
            const dmg = isMinigun ? this.damage * 1.2 : this.damage;

            projectileList.push(new Projectile({
                x: this.x,
                y: this.y,
                target: this.target,
                damage: dmg * (this.isOverclocked ? 1.5 : 1.0),
                speed: speed,
                type: 'bullet',
                color: '#00d2ff',
                towerRef: this
            }));
        }
    }

    renderTurret(ctx) {
        super.renderTurret(ctx);

        ctx.rotate(this.rotation);

        // Barrel Design
        ctx.fillStyle = '#64748b';

        if (this.branch === 'railgun') {
            // Railgun Long Twin Barrel Design
            ctx.fillStyle = '#00ffaa';
            ctx.fillRect(4, -4, 22, 3);
            ctx.fillRect(4, 1, 22, 3);
        } else if (this.branch === 'minigun') {
            // Minigun Multi-barrel Heavy Turret
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(4, -6, 18, 12);
        } else {
            // Normal Gatling Barrel
            ctx.fillRect(4, -3, 16, 6);
        }

        // Turret Center Dome
        ctx.fillStyle = this.isOverclocked ? '#ff7f50' : '#00d2ff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

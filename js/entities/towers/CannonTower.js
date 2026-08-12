// 캐논 타워 (Cannon Tower) & Siege/Cluster 분기
import { Tower } from './Tower.js';
import { Projectile } from '../Projectile.js';
import { CONFIG } from '../../config.js';

export class CannonTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'cannon', cellSize);
        this.splashRadius = CONFIG.TOWERS.cannon.splashRadius;
    }

    upgradeBranch(branchKey) {
        const ok = super.upgradeBranch(branchKey);
        if (ok) {
            const spec = CONFIG.TOWERS.cannon.upgrades.branches[branchKey];
            if (spec.splashMult) this.splashRadius = Math.floor(this.splashRadius * spec.splashMult);
            this.clusterCount = spec.clusterCount || 0;
        }
        return ok;
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('cannon');

        const isSiege = this.branch === 'siege';
        const isCluster = this.branch === 'cluster';

        const splash = isSiege ? this.splashRadius * 1.5 : this.splashRadius;
        const dmg = this.damage * (this.isOverclocked ? 1.5 : 1.0);

        projectileList.push(new Projectile({
            x: this.x,
            y: this.y,
            target: this.target,
            damage: dmg,
            speed: 420,
            type: 'cannon',
            splashRadius: splash,
            clusterCount: isCluster ? 4 : 0,
            color: isSiege ? '#ff4757' : '#ff7f50',
            towerRef: this
        }));
    }

    renderTurret(ctx) {
        super.renderTurret(ctx);

        ctx.rotate(this.rotation);

        ctx.fillStyle = '#475569';
        if (this.branch === 'siege') {
            // Large Heavy Siege Cannon
            ctx.fillRect(2, -7, 24, 14);
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(22, -8, 5, 16);
        } else if (this.branch === 'cluster') {
            // Quad Cluster Cannon Barrel
            ctx.fillRect(2, -6, 20, 12);
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(18, -7, 4, 14);
        } else {
            // Standard Cannon Barrel
            ctx.fillRect(2, -5, 18, 10);
        }

        // Center Cannon Body
        ctx.fillStyle = this.isOverclocked ? '#ff4757' : '#ff7f50';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
    }
}

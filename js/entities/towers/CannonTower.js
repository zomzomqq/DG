// 캐논 타워 (Cannon Tower) & Siege/Cluster 분기
import { Tower } from './Tower.js';
import { Projectile } from '../Projectile.js';
import { CONFIG } from '../../config.js';
import { drawGlowOrb, polygonPath } from '../../engine/CanvasArt.js';

export class CannonTower extends Tower {
    constructor(col, row, cellSize) {
        super(col, row, 'cannon', cellSize);
        this.splashRadius = CONFIG.TOWERS.cannon.splashRadius;
        this.clusterCount = 0;
    }

    upgradeBranch(branchKey) {
        const ok = super.upgradeBranch(branchKey);
        if (ok) {
            const spec = CONFIG.TOWERS.cannon.upgrades.branches[branchKey];
            if (spec.splashMult) {
                // [P2 수정] Branch 수치는 여기서 single source of truth로 적용
                this.splashRadius = Math.floor(CONFIG.TOWERS.cannon.splashRadius * spec.splashMult);
            }
            this.clusterCount = spec.clusterCount || 0;
        }
        return ok;
    }

    fire(enemyList, projectileList, particleSystem, soundManager) {
        soundManager.playShoot('cannon');

        const isSiege = this.branch === 'siege';
        const isCluster = this.branch === 'cluster';

        // [P2 수정] 중복 곱셈 제거
        projectileList.push(new Projectile({
            x: this.x,
            y: this.y,
            target: this.target,
            damage: this.damage,
            speed: 420,
            type: 'cannon',
            splashRadius: this.splashRadius,
            clusterCount: isCluster ? 4 : 0,
            color: isSiege ? '#ff4757' : '#ff7f50',
            towerRef: this
        }));
    }

    renderTurret(ctx) {
        super.renderTurret(ctx);

        const accent = this.branch === 'siege' ? '#ff6b5f' : (this.branch === 'cluster' ? '#ffd166' : '#ff9d66');

        ctx.save();
        ctx.rotate(this.rotation);

        polygonPath(ctx, 0, -1, 9.5, 8, Math.PI / 8, 0.88);
        ctx.fillStyle = '#303b3e';
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (this.branch === 'siege') {
            ctx.fillStyle = '#313538';
            ctx.fillRect(2, -7, 23, 14);
            ctx.strokeStyle = accent;
            ctx.strokeRect(2, -7, 23, 14);
            ctx.fillStyle = '#9aa4a3';
            ctx.fillRect(14, -4, 16, 8);
            ctx.fillStyle = accent;
            ctx.fillRect(26, -7, 5, 14);
        } else if (this.branch === 'cluster') {
            ctx.fillStyle = '#333c3e';
            ctx.fillRect(2, -7, 20, 14);
            ctx.strokeStyle = accent;
            ctx.strokeRect(2, -7, 20, 14);
            ctx.fillStyle = accent;
            for (const y of [-4, 0, 4]) {
                ctx.beginPath();
                ctx.arc(21, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = '#34474d';
            ctx.fillRect(2, -6, 18, 12);
            ctx.strokeStyle = accent;
            ctx.strokeRect(2, -6, 18, 12);
            ctx.fillStyle = '#82959a';
            ctx.fillRect(14, -3, 12, 6);
            ctx.fillStyle = accent;
            ctx.fillRect(24, -4, 4, 8);
        }

        ctx.restore();

        drawGlowOrb(ctx, 0, -1, this.isOverclocked ? 4 : 3.2, this.isOverclocked ? '#ff4757' : accent);
    }
}

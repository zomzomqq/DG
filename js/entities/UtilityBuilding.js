// 둔덕 위 경제 시설 (골드 발전기 Generator) 클래스
import { CONFIG } from '../config.js';
import { drawGlowOrb, drawSegmentedRing, polygonPath } from '../engine/CanvasArt.js';

export class Generator {
    constructor(col, row, cellSize) {
        this.id = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.col = col;
        this.row = row;
        this.cellSize = cellSize;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;

        this.isUtility = true;
        this.name = "골드 발전기";
        this.type = "generator";
        this.icon = "⚡";
        this.cost = CONFIG.TOWERS.generator.cost;
        
        // [P1/P2 수정] Generator에도 totalInvestedCost 속성 명시 (판매 시 NaN 골드 오염 방지)
        this.totalInvestedCost = this.cost;

        this.incomePerSec = CONFIG.TOWERS.generator.incomePerSec;

        this.level = 1;
        this.branch = null;
        this.active = true;
        this.animAngle = 0;
    }

    getSellValue() {
        return Math.floor(this.totalInvestedCost * 0.7);
    }

    update(dt) {
        this.animAngle += dt * 3;
    }

    render(ctx) {
        const off = CONFIG.MOUND.HEIGHT_OFFSET / 2;
        ctx.save();
        ctx.translate(this.x, this.y - off);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 7, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        polygonPath(ctx, 0, 1, 14, 8, Math.PI / 8, 0.84);
        const chassis = ctx.createLinearGradient(0, -13, 0, 13);
        chassis.addColorStop(0, '#4a4734');
        chassis.addColorStop(1, '#24291f');
        ctx.fillStyle = chassis;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.62)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.rotate(this.animAngle);
        drawSegmentedRing(ctx, 0, -1, 16, 6, '#ffd166', 1.6, 0, 4);
        ctx.restore();

        ctx.save();
        ctx.rotate(-this.animAngle * 0.7);
        drawSegmentedRing(ctx, 0, -1, 11, 4, 'rgba(215, 255, 102, 0.75)', 1.1, Math.PI / 4);
        ctx.restore();

        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(2, -9);
        ctx.lineTo(-3, -1);
        ctx.lineTo(2, -1);
        ctx.lineTo(-2, 8);
        ctx.lineTo(5, -2);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.stroke();
        drawGlowOrb(ctx, 0, -1, 2.5, '#ffd166');

        ctx.restore();
    }
}

// 솟아오른 둔덕 (Mound) 오브젝트 클래스
import { CONFIG } from '../config.js';
import { drawBolts, drawSegmentedRing, polygonPath } from '../engine/CanvasArt.js';

export class Mound {
    constructor(col, row, cellSize) {
        this.col = col;
        this.row = row;
        this.cellSize = cellSize;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;

        this.towerInstalled = null; // 둔덕 위 설치된 타워/발전기 인스턴스
    }

    render(ctx, isSelected = false) {
        const x = this.col * this.cellSize;
        const y = this.row * this.cellSize;
        const cs = this.cellSize;
        const off = CONFIG.MOUND.HEIGHT_OFFSET;
        const cx = x + cs / 2;
        const cy = y + cs / 2 - off / 2;

        ctx.save();

        // Ground contact shadow and armored elevation.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(cx, y + cs - 3, cs * 0.43, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        polygonPath(ctx, cx, cy + 5, cs * 0.47, 8, Math.PI / 8, 0.82);
        ctx.fillStyle = '#071419';
        ctx.fill();
        ctx.strokeStyle = 'rgba(114, 231, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const topGradient = ctx.createLinearGradient(cx, cy - cs / 2, cx, cy + cs / 2);
        topGradient.addColorStop(0, '#25414a');
        topGradient.addColorStop(0.55, '#152d35');
        topGradient.addColorStop(1, '#0d2027');
        polygonPath(ctx, cx, cy, cs * 0.47, 8, Math.PI / 8, 0.82);
        ctx.fillStyle = topGradient;
        ctx.fill();
        ctx.shadowColor = '#72e7ff';
        ctx.shadowBlur = this.towerInstalled ? 2 : 6;
        ctx.strokeStyle = this.towerInstalled ? 'rgba(114, 231, 255, 0.34)' : 'rgba(114, 231, 255, 0.58)';
        ctx.lineWidth = 1.15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        polygonPath(ctx, cx, cy, cs * 0.32, 8, Math.PI / 8, 0.82);
        ctx.fillStyle = 'rgba(3, 10, 12, 0.34)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(181, 217, 207, 0.14)';
        ctx.stroke();

        ctx.translate(cx, cy);
        drawBolts(ctx, 14, 4, '#78939a', 1.1, Math.PI / 4);

        if (isSelected) {
            ctx.shadowColor = '#d7ff66';
            ctx.shadowBlur = 10;
            drawSegmentedRing(ctx, 0, 0, 18, 8, 'rgba(215, 255, 102, 0.9)', 1.6, Math.PI / 8);
            ctx.shadowBlur = 0;
        }

        if (!this.towerInstalled) {
            drawSegmentedRing(ctx, 0, 0, 8, 4, 'rgba(114, 231, 255, 0.52)', 1.1, Math.PI / 4);
            ctx.strokeStyle = 'rgba(215, 255, 102, 0.72)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-3, 0);
            ctx.lineTo(3, 0);
            ctx.moveTo(0, -3);
            ctx.lineTo(0, 3);
            ctx.stroke();
        }

        ctx.restore();
    }
}

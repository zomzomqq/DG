// 솟아오른 둔덕 (Mound) 오브젝트 클래스
import { CONFIG } from '../config.js';

export class Mound {
    constructor(col, row, cellSize) {
        this.col = col;
        this.row = row;
        this.cellSize = cellSize;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;

        this.towerInstalled = null; // 둔덕 위 설치된 타워/발전기 인스턴스
    }

    render(ctx) {
        const x = this.col * this.cellSize;
        const y = this.row * this.cellSize;
        const cs = this.cellSize;
        const off = CONFIG.MOUND.HEIGHT_OFFSET;

        ctx.save();

        // 둔덕 입체 측면 (Shadow / Side Elevation)
        ctx.fillStyle = CONFIG.MOUND.COLOR_SIDE;
        ctx.beginPath();
        ctx.moveTo(x, y + cs);
        ctx.lineTo(x + cs, y + cs);
        ctx.lineTo(x + cs, y + cs - off);
        ctx.lineTo(x, y + cs - off);
        ctx.closePath();
        ctx.fill();

        // 둔덕 솟아오른 상단 면 (Top Mound Surface)
        ctx.fillStyle = CONFIG.MOUND.COLOR_TOP;
        ctx.fillRect(x + 2, y + 2 - off, cs - 4, cs - 4);

        // 상단 테두리 글로우
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2 - off, cs - 4, cs - 4);

        // 둔덕 중앙 표시 마크 (타워 미설치 시)
        if (!this.towerInstalled) {
            ctx.fillStyle = 'rgba(0, 210, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y - off / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

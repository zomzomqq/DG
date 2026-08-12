// 둔덕 위 경제 시설 (골드 발전기 Generator) 클래스
import { CONFIG } from '../config.js';

export class Generator {
    constructor(col, row, cellSize) {
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
        this.incomePerSec = CONFIG.TOWERS.generator.incomePerSec;

        this.level = 1;
        this.active = true;
        this.animAngle = 0;
    }

    update(dt) {
        this.animAngle += dt * 3;
    }

    render(ctx) {
        const off = CONFIG.MOUND.HEIGHT_OFFSET / 2;
        ctx.save();
        ctx.translate(this.x, this.y - off);

        // 발전기 베이스
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // 회전하는 에너지 링
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16, this.animAngle, this.animAngle + Math.PI * 1.2);
        ctx.stroke();

        // 아이콘
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);

        ctx.restore();
    }
}

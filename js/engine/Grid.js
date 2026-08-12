// Grid Map 지형 및 셀 관리

import { CONFIG } from '../config.js';

export class Grid {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;

        // Cell Types: 0 = Flat Ground, 1 = Mound, 2 = Spawn, 3 = Base
        this.cells = Array(rows).fill(0).map(() => Array(cols).fill(0));

        // Spawn Point & Base Point
        this.spawnCell = { col: 1, row: 6 };
        this.baseCell = { col: 22, row: 6 };

        this.initDefaultLayout();
    }

    initDefaultLayout() {
        // Spawn and Base Setup
        this.cells[this.spawnCell.row][this.spawnCell.col] = 2;
        this.cells[this.baseCell.row][this.baseCell.col] = 3;

        // 초기 배치 둔덕(Mounds)
        const initialMounds = [
            { col: 6, row: 3 }, { col: 6, row: 4 }, { col: 6, row: 5 },
            { col: 11, row: 8 }, { col: 11, row: 9 }, { col: 11, row: 10 },
            { col: 17, row: 3 }, { col: 17, row: 4 }, { col: 17, row: 5 },
            { col: 14, row: 1 }, { col: 14, row: 2 },
            { col: 9, row: 11 }, { col: 10, row: 11 }
        ];

        for (const m of initialMounds) {
            this.cells[m.row][m.col] = 1;
        }
    }

    isBlocked(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
        // [P1 수정] 솟아오른 둔덕(1)만 적 우회 장애물. Base(3)와 Spawn(2)은 blocked가 아님!
        return this.cells[row][col] === 1;
    }

    isMound(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.cells[row][col] === 1;
    }

    canPlaceMound(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        // 평지(0)에만 둔덕 추가 건설 가능
        return this.cells[row][col] === 0;
    }

    setMound(col, row) {
        if (this.canPlaceMound(col, row)) {
            this.cells[row][col] = 1;
            return true;
        }
        return false;
    }

    getSpawnWorldPos() {
        return {
            x: this.spawnCell.col * this.cellSize + this.cellSize / 2,
            y: this.spawnCell.row * this.cellSize + this.cellSize / 2
        };
    }

    getBaseWorldPos() {
        return {
            x: this.baseCell.col * this.cellSize + this.cellSize / 2,
            y: this.baseCell.row * this.cellSize + this.cellSize / 2
        };
    }

    render(ctx, hoverCell = null, selectedBuildingCell = null, threatMap = null) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.cellSize;
                const y = r * this.cellSize;
                const cellType = this.cells[r][c];

                // 1. Base Grid Tiles
                ctx.fillStyle = (r + c) % 2 === 0 ? '#111827' : '#0f172a';
                ctx.fillRect(x, y, this.cellSize, this.cellSize);

                // Grid Border Line
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, this.cellSize, this.cellSize);

                // Threat Map Heat Overlay
                if (threatMap) {
                    const threat = threatMap.getThreatAt(c, r);
                    if (threat > 0) {
                        const alpha = Math.min(0.2, threat / 250);
                        ctx.fillStyle = `rgba(255, 71, 87, ${alpha})`;
                        ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    }
                }

                // 2. Spawn Point Visual
                if (cellType === 2) {
                    ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    ctx.strokeStyle = '#e74c3c';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

                    ctx.fillStyle = '#e74c3c';
                    ctx.font = '10px Orbitron';
                    ctx.textAlign = 'center';
                    ctx.fillText('SPAWN', x + this.cellSize / 2, y + this.cellSize / 2 + 3);
                }

                // 3. Main Base Cell Visual
                if (cellType === 3) {
                    ctx.fillStyle = 'rgba(0, 210, 255, 0.2)';
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                }
            }
        }

        // Hover Effect
        if (hoverCell) {
            const hx = hoverCell.col * this.cellSize;
            const hy = hoverCell.row * this.cellSize;
            ctx.fillStyle = 'rgba(0, 255, 170, 0.15)';
            ctx.fillRect(hx, hy, this.cellSize, this.cellSize);
            ctx.strokeStyle = '#00ffaa';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(hx, hy, this.cellSize, this.cellSize);
        }
    }
}

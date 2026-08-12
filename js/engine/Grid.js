// Grid Map 지형 및 셀 관리

import { CONFIG } from '../config.js';
import { drawCornerBrackets, drawSegmentedRing } from './CanvasArt.js';

export class Grid {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;

        // Cell Types: 0 = Flat Ground, 1 = Mound, 2 = Spawn, 3 = Base
        this.cells = Array(rows).fill(0).map(() => Array(cols).fill(0));

        // Spawn Points & Base Point. The second entry stays hidden until Stage 2.
        this.spawnCells = [
            { col: 1, row: 6 },
            { col: 1, row: 10 }
        ];
        this.spawnCell = this.spawnCells[0];
        this.activeSpawnCount = 1;
        this.baseCell = { col: 22, row: 6 };

        this.initDefaultLayout();
    }

    initDefaultLayout() {
        // Spawn and Base Setup
        this.setActiveSpawnCount(1);
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
        if (this.isReservedSpawnCell(col, row)) return false;
        // 평지(0)에만 둔덕 추가 건설 가능
        return this.cells[row][col] === 0;
    }

    isReservedSpawnCell(col, row) {
        return this.spawnCells.some(cell => cell.col === col && cell.row === row);
    }

    setMound(col, row) {
        if (this.canPlaceMound(col, row)) {
            this.cells[row][col] = 1;
            return true;
        }
        return false;
    }

    removeMound(col, row) {
        if (!this.isMound(col, row)) return false;
        this.cells[row][col] = 0;
        return true;
    }

    setActiveSpawnCount(count) {
        const nextCount = Math.max(1, Math.min(this.spawnCells.length, Math.floor(count)));

        for (let i = 0; i < this.spawnCells.length; i++) {
            const cell = this.spawnCells[i];
            if (i < nextCount) {
                this.cells[cell.row][cell.col] = 2;
            } else if (this.cells[cell.row][cell.col] === 2) {
                this.cells[cell.row][cell.col] = 0;
            }
        }

        this.activeSpawnCount = nextCount;
    }

    getSpawnWorldPositions(activeOnly = true) {
        const cells = activeOnly
            ? this.spawnCells.slice(0, this.activeSpawnCount)
            : this.spawnCells;

        return cells.map(cell => ({
            x: cell.col * this.cellSize + this.cellSize / 2,
            y: cell.row * this.cellSize + this.cellSize / 2
        }));
    }

    getSpawnWorldPos(spawnIndex = 0) {
        const activeCells = this.spawnCells.slice(0, this.activeSpawnCount);
        const safeIndex = Math.max(0, Math.min(activeCells.length - 1, Math.floor(spawnIndex)));
        const spawnCell = activeCells[safeIndex];

        return {
            x: spawnCell.col * this.cellSize + this.cellSize / 2,
            y: spawnCell.row * this.cellSize + this.cellSize / 2
        };
    }

    getBaseWorldPos() {
        return {
            x: this.baseCell.col * this.cellSize + this.cellSize / 2,
            y: this.baseCell.row * this.cellSize + this.cellSize / 2
        };
    }

    render(ctx, hoverCell = null, selectedBuildingCell = null, threatMap = null) {
        const width = this.cols * this.cellSize;
        const height = this.rows * this.cellSize;

        ctx.save();
        ctx.fillStyle = '#081116';
        ctx.fillRect(0, 0, width, height);

        // Matte terrain tiles and subtle sector blocks.
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.cellSize;
                const y = r * this.cellSize;
                const cellType = this.cells[r][c];

                const sectorShade = ((Math.floor(c / 4) + Math.floor(r / 4)) % 2) * 2;
                ctx.fillStyle = (r + c) % 2 === 0
                    ? `rgb(${10 + sectorShade}, ${21 + sectorShade}, ${27 + sectorShade})`
                    : `rgb(${9 + sectorShade}, ${18 + sectorShade}, ${24 + sectorShade})`;
                ctx.fillRect(x, y, this.cellSize, this.cellSize);

                if (threatMap) {
                    const threat = threatMap.getThreatAt(c, r);
                    if (threat > 0) {
                        const alpha = Math.min(0.16, threat / 340);
                        ctx.fillStyle = `rgba(255, 92, 77, ${alpha})`;
                        ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    }
                }

                if (cellType === 2) {
                    const spawnIndex = this.spawnCells.findIndex(cell => cell.col === c && cell.row === r);
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 88, 72, 0.1)';
                    ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
                    ctx.beginPath();
                    ctx.rect(x + 3, y + 3, this.cellSize - 6, this.cellSize - 6);
                    ctx.clip();
                    ctx.strokeStyle = 'rgba(255, 88, 72, 0.22)';
                    ctx.lineWidth = 3;
                    for (let stripe = -this.cellSize; stripe < this.cellSize * 2; stripe += 9) {
                        ctx.beginPath();
                        ctx.moveTo(x + stripe, y + this.cellSize);
                        ctx.lineTo(x + stripe + this.cellSize, y);
                        ctx.stroke();
                    }
                    ctx.restore();
                    drawCornerBrackets(ctx, x + 3, y + 3, this.cellSize - 6, this.cellSize - 6, 9, '#ff6b5f', 1.5);
                    ctx.fillStyle = '#ff7f73';
                    ctx.font = '700 7px Rajdhani, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`ENTRY ${String.fromCharCode(65 + Math.max(0, spawnIndex))}`, x + this.cellSize / 2, y + this.cellSize / 2 + 2);
                }

                if (cellType === 3) {
                    ctx.fillStyle = 'rgba(114, 231, 255, 0.08)';
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    drawSegmentedRing(ctx, x + this.cellSize / 2, y + this.cellSize / 2, 17, 8, 'rgba(114, 231, 255, 0.5)', 1.2, Math.PI / 8);
                    drawCornerBrackets(ctx, x + 4, y + 4, this.cellSize - 8, this.cellSize - 8, 6, 'rgba(114, 231, 255, 0.65)', 1);
                }
            }
        }

        // Grid lines are rendered in two passes to avoid hundreds of state changes.
        ctx.strokeStyle = 'rgba(164, 202, 187, 0.055)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let c = 0; c <= this.cols; c++) {
            const x = c * this.cellSize + 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let r = 0; r <= this.rows; r++) {
            const y = r * this.cellSize + 0.5;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Major sector guides.
        ctx.strokeStyle = 'rgba(114, 231, 255, 0.075)';
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        for (let c = 4; c < this.cols; c += 4) {
            ctx.moveTo(c * this.cellSize, 0);
            ctx.lineTo(c * this.cellSize, height);
        }
        for (let r = 4; r < this.rows; r += 4) {
            ctx.moveTo(0, r * this.cellSize);
            ctx.lineTo(width, r * this.cellSize);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        if (hoverCell) {
            const hx = hoverCell.col * this.cellSize;
            const hy = hoverCell.row * this.cellSize;
            ctx.fillStyle = 'rgba(215, 255, 102, 0.1)';
            ctx.fillRect(hx + 1, hy + 1, this.cellSize - 2, this.cellSize - 2);
            drawCornerBrackets(ctx, hx + 2, hy + 2, this.cellSize - 4, this.cellSize - 4, 10, '#d7ff66', 1.6);
            ctx.fillStyle = 'rgba(215, 255, 102, 0.75)';
            ctx.font = '700 6px Rajdhani, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${String(hoverCell.col).padStart(2, '0')}.${String(hoverCell.row).padStart(2, '0')}`, hx + this.cellSize - 4, hy + this.cellSize - 4);
        }

        ctx.restore();
    }
}

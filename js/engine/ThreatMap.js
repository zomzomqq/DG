// Grid Cell별 타워 위협도 (Threat Map) 계산기

export class ThreatMap {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;
        this.grid = Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    recalculate(towers) {
        // Reset grid to 0
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = 0;
            }
        }

        if (!towers || towers.length === 0) return;

        // Calculate threat index based on active tower ranges & DPS
        for (const tower of towers) {
            if (!tower.active || tower.isUtility) continue;

            const tCol = Math.floor(tower.x / this.cellSize);
            const tRow = Math.floor(tower.y / this.cellSize);
            const cellRange = Math.ceil(tower.range / this.cellSize);

            const dps = tower.getDPS ? tower.getDPS() : 20;

            for (let r = Math.max(0, tRow - cellRange); r <= Math.min(this.rows - 1, tRow + cellRange); r++) {
                for (let c = Math.max(0, tCol - cellRange); c <= Math.min(this.cols - 1, tCol + cellRange); c++) {
                    const cellCenterX = c * this.cellSize + this.cellSize / 2;
                    const cellCenterY = r * this.cellSize + this.cellSize / 2;
                    const dist = Math.hypot(cellCenterX - tower.x, cellCenterY - tower.y);

                    if (dist <= tower.range) {
                        // 거리 비례 위험도 가중치 (중심부일수록 위험)
                        const factor = 1 - (dist / tower.range);
                        this.grid[r][c] += dps * factor;
                    }
                }
            }
        }
    }

    getThreatAt(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return 0;
        return this.grid[row][col];
    }
}

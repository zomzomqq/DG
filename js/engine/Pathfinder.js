// A* (A-Star) 및 ThreatMap 기반 최적 경로 탐색기

export class Pathfinder {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;
    }

    // A* Pathfinding (AI Level: 'normal', 'smart', 'elite')
    findPath(startPos, endPos, isCellBlockedFunc, threatMap = null, aiLevel = 'normal') {
        const startNode = { col: Math.floor(startPos.x / this.cellSize), row: Math.floor(startPos.y / this.cellSize) };
        const endNode = { col: Math.floor(endPos.x / this.cellSize), row: Math.floor(endPos.y / this.cellSize) };

        if (startNode.col === endNode.col && startNode.row === endNode.row) {
            return [{ x: endPos.x, y: endPos.y }];
        }

        const openList = [];
        const closedSet = new Set();
        const nodeMap = new Map();

        const getKey = (c, r) => `${c},${r}`;

        const heuristic = (c, r) => Math.abs(c - endNode.col) + Math.abs(r - endNode.row);

        // AI Level에 따른 위험도(ThreatMap) 가중치 수치
        let threatWeight = 0;
        if (aiLevel === 'smart') threatWeight = 0.3;
        else if (aiLevel === 'elite') threatWeight = 0.7;

        const startKey = getKey(startNode.col, startNode.row);
        const startRecord = {
            col: startNode.col,
            row: startNode.row,
            g: 0,
            h: heuristic(startNode.col, startNode.row),
            f: heuristic(startNode.col, startNode.row),
            parent: null
        };

        openList.push(startRecord);
        nodeMap.set(startKey, startRecord);

        // 4방향 이동 (상, 하, 좌, 우)
        const directions = [
            { dc: 0, dr: -1 },
            { dc: 0, dr: 1 },
            { dc: -1, dr: 0 },
            { dc: 1, dr: 0 }
        ];

        while (openList.length > 0) {
            // f값 최소 노드 pop
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();

            if (current.col === endNode.col && current.row === endNode.row) {
                // 경로 역추적
                const path = [];
                let curr = current;
                while (curr) {
                    path.unshift({
                        x: curr.col * this.cellSize + this.cellSize / 2,
                        y: curr.row * this.cellSize + this.cellSize / 2
                    });
                    curr = curr.parent;
                }
                return path;
            }

            const currentKey = getKey(current.col, current.row);
            closedSet.add(currentKey);

            for (const dir of directions) {
                const nc = current.col + dir.dc;
                const nr = current.row + dir.dr;

                if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;
                if (isCellBlockedFunc(nc, nr)) continue; // 둔덕/장애물 셀인 경우 이동 불가

                const neighborKey = getKey(nc, nr);
                if (closedSet.has(neighborKey)) continue;

                // Threat Risk 계산
                let threatRisk = 0;
                if (threatMap && threatWeight > 0) {
                    threatRisk = threatMap.getThreatAt(nc, nr) * threatWeight;
                }

                const tentativeG = current.g + 1 + threatRisk;
                let neighborRecord = nodeMap.get(neighborKey);

                if (!neighborRecord) {
                    const h = heuristic(nc, nr);
                    neighborRecord = {
                        col: nc,
                        row: nr,
                        g: tentativeG,
                        h: h,
                        f: tentativeG + h,
                        parent: current
                    };
                    nodeMap.set(neighborKey, neighborRecord);
                    openList.push(neighborRecord);
                } else if (tentativeG < neighborRecord.g) {
                    neighborRecord.g = tentativeG;
                    neighborRecord.f = tentativeG + neighborRecord.h;
                    neighborRecord.parent = current;
                }
            }
        }

        // 경로를 찾지 못함
        return null;
    }

    // 신규 둔덕 설치 시 Spawn -> Base 경로 완막 방지 검증 함수
    hasValidPath(startPos, endPos, isCellBlockedFuncWithTempObstacle) {
        const path = this.findPath(startPos, endPos, isCellBlockedFuncWithTempObstacle, null, 'normal');
        return path !== null && path.length > 0;
    }
}

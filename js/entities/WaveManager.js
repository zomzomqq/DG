// 웨이브 데이터 관리자 & 사전 정보 (Wave Preview) 생성기
import { Enemy } from './enemies/Enemy.js';
import { BossEnemy } from './enemies/BossEnemy.js';

export class WaveManager {
    constructor() {
        this.currentWave = 1;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.isWaveActive = false;
    }

    getWaveRecipe(waveNum) {
        // 데이터 기반 스테이지 웨이브 레시피
        if (waveNum === 1) {
            return {
                wave: 1,
                groups: [
                    { type: 'basic', count: 8, interval: 1.0 }
                ],
                tip: "기본적인 보병 적들입니다. 가틀링 타워나 캐논 타워를 배치해보세요!"
            };
        } else if (waveNum === 2) {
            return {
                wave: 2,
                groups: [
                    { type: 'basic', count: 8, interval: 0.8 },
                    { type: 'runner', count: 5, interval: 0.6 }
                ],
                tip: "빠른 스카우트 유닛이 등장합니다! 프로스트 타워로 이동속도를 늦추세요."
            };
        } else if (waveNum === 3) {
            return {
                wave: 3,
                groups: [
                    { type: 'basic', count: 10, interval: 0.8 },
                    { type: 'tank', count: 3, interval: 2.0 }
                ],
                tip: "체력이 높은 탱커 유닛이 출현합니다! 가틀링 오버클럭이나 둔덕 우회 경로를 만드세요."
            };
        } else if (waveNum === 4) {
            return {
                wave: 4,
                groups: [
                    { type: 'swarm', count: 18, interval: 0.3 },
                    { type: 'shield', count: 4, interval: 1.2 }
                ],
                tip: "대량의 Swarm 적들이 떼지어 몰려옵니다! 캐논 타워의 광역 스플래시 폭발이 필수입니다."
            };
        } else if (waveNum === 5) {
            return {
                wave: 5,
                groups: [
                    { type: 'basic', count: 12, interval: 0.7 },
                    { type: 'engineer', count: 2, interval: 2.5 },
                    { type: 'shield', count: 6, interval: 1.0 }
                ],
                tip: "엔지니어 유닛이 주변 적들에게 보호막을 부여합니다! 타겟팅을 Strongest로 변경해 원조 차단하세요."
            };
        } else if (waveNum === 6) {
            return {
                wave: 6,
                groups: [
                    { type: 'runner', count: 12, interval: 0.4 },
                    { type: 'regenerator', count: 4, interval: 1.5 },
                    { type: 'unstoppable', count: 3, interval: 2.0 }
                ],
                tip: "체력을 회복하는 리제네레이터와 둔화 저항 유닛입니다! 가틀ling+캐논 Marked 시너지를 활용하세요."
            };
        } else if (waveNum === 10) {
            return {
                wave: 10,
                groups: [
                    { type: 'tank', count: 6, interval: 1.5 },
                    { type: 'engineer', count: 3, interval: 2.0 },
                    { type: 'boss', count: 1, interval: 5.0 }
                ],
                tip: "⚠️ BOSS WARNING: Siege Walker 보스가 등장합니다! 4단계 페이즈(Shield, EMP, Rage)에 대비하세요!"
            };
        } else {
            // 무한 절차적 난이도 생성 웨이브 (Wave 7, 8, 9, 11+)
            const mult = Math.min(3, 1 + (waveNum - 6) * 0.25);
            return {
                wave: waveNum,
                groups: [
                    { type: 'basic', count: Math.floor(12 * mult), interval: 0.5 },
                    { type: 'runner', count: Math.floor(8 * mult), interval: 0.4 },
                    { type: 'tank', count: Math.floor(4 * mult), interval: 1.5 },
                    { type: 'shield', count: Math.floor(5 * mult), interval: 1.0 },
                    { type: 'swarm', count: Math.floor(15 * mult), interval: 0.25 }
                ],
                tip: "적군들의 진형이 압도적으로 강화되었습니다. 모든 타워 시너지와 오버클럭을 결합하세요!"
            };
        }
    }

    startWave(waveNum, grid, pathfinder, threatMap, enemyList) {
        this.currentWave = waveNum;
        this.spawnQueue = [];
        this.isWaveActive = true;

        const recipe = this.getWaveRecipe(waveNum);

        for (const group of recipe.groups) {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    interval: group.interval
                });
            }
        }

        this.spawnTimer = 0;
    }

    update(dt, grid, pathfinder, threatMap, enemyList) {
        if (!this.isWaveActive || this.spawnQueue.length === 0) return;

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            const nextItem = this.spawnQueue.shift();
            this.spawnTimer = nextItem.interval;

            const spawnPos = grid.getSpawnWorldPos();
            const basePos = grid.getBaseWorldPos();

            // 적 AI Level에 따른 경로 생성
            const enemySpec = Enemy;
            let aiLevel = 'normal';
            if (nextItem.type === 'runner' || nextItem.type === 'shield' || nextItem.type === 'engineer') aiLevel = 'smart';
            if (nextItem.type === 'boss') aiLevel = 'elite';

            const path = pathfinder.findPath(spawnPos, basePos, (c, r) => grid.isBlocked(c, r), threatMap, aiLevel);

            let enemyObj = null;
            if (nextItem.type === 'boss') {
                enemyObj = new BossEnemy(path, spawnPos);
            } else {
                enemyObj = new Enemy(nextItem.type, path, spawnPos);
            }

            enemyList.push(enemyObj);
        }
    }
}

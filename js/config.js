// 타워 디펜스 게임 환경 설정 및 데이터 스펙

export const CONFIG = {
    // Canvas & Grid Configuration
    GRID_COLS: 24,
    GRID_ROWS: 14,
    CELL_SIZE: 40, // 24 * 40 = 960px, 14 * 40 = 560px
    
    // Initial Resources
    INITIAL_GOLD: 500,
    PASSIVE_GOLD_RATE: 5, // 1초당 5 골드 기본 자연 수급
    MOUND_BUILD_COST: 150, // 둔덕 1개 신규 설치 비용
    
    // Main Base Tower Stats
    BASE_TOWER: {
        MAX_HP: 100,
        RANGE: 120,
        DAMAGE: 15,
        ATTACK_SPEED: 1.2, //초당 사격
        ORBITAL_STRIKE_COOLDOWN: 25, // 25초 쿨타임
        ORBITAL_STRIKE_DAMAGE: 450,
        ORBITAL_STRIKE_RADIUS: 100
    },

    // 둔덕 (Mound)
    MOUND: {
        HEIGHT_OFFSET: 6, // Visual Elevation 3D 둔덕 느낌
        COLOR_TOP: '#3a506b',
        COLOR_SIDE: '#1c2541'
    },

    // Towers Specification
    TOWERS: {
        gatling: {
            name: "가틀링 타워",
            icon: "🔫",
            cost: 100,
            range: 150,
            damage: 14,
            attackSpeed: 5.5, // 초당 5.5발
            projectileSpeed: 800,
            heatIncrease: 8, // 오버클럭 시 초당 Heat 상승%
            upgrades: {
                level2Cost: 80,
                branches: {
                    minigun: {
                        name: "Minigun",
                        desc: "초고속 지속사격 예열, 단일/보스 특화",
                        cost: 200,
                        damageMult: 1.4,
                        speedMult: 2.2
                    },
                    railgun: {
                        name: "Railgun",
                        desc: "관통 레이저 빔, 일직선 상 모든 적 타격",
                        cost: 200,
                        damageMult: 3.5,
                        speedMult: 0.4,
                        isBeam: true
                    }
                }
            }
        },
        cannon: {
            name: "캐논 타워",
            icon: "💣",
            cost: 175,
            range: 180,
            damage: 65,
            attackSpeed: 0.9, // 초당 0.9발
            splashRadius: 60,
            projectileSpeed: 400,
            heatIncrease: 12,
            upgrades: {
                level2Cost: 120,
                branches: {
                    siege: {
                        name: "Siege Cannon",
                        desc: "초고화력 대형 스플래시 폭발",
                        cost: 250,
                        damageMult: 2.4,
                        splashMult: 1.6,
                        speedMult: 0.7
                    },
                    cluster: {
                        name: "Cluster Cannon",
                        desc: "탄환 명중 시 4개의 자탄 분사",
                        cost: 250,
                        damageMult: 1.5,
                        clusterCount: 4,
                        speedMult: 1.0
                    }
                }
            }
        },
        frost: {
            name: "프로스트 타워",
            icon: "❄️",
            cost: 150,
            range: 140,
            damage: 8,
            attackSpeed: 1.5,
            slowAmount: 0.4, // 40% 이동속도 감손
            slowDuration: 2.5,
            heatIncrease: 10,
            upgrades: {
                level2Cost: 100,
                branches: {
                    blizzard: {
                        name: "Blizzard",
                        desc: "광범위 넓은 영역 지속 서리 오라",
                        cost: 220,
                        rangeMult: 1.6,
                        slowMult: 1.25
                    },
                    cryo: {
                        name: "Cryo Freeze",
                        desc: "단일/엘리트 적 완전 동결(Freeze) 디버프",
                        cost: 220,
                        slowMult: 1.8,
                        canFreeze: true
                    }
                }
            }
        },
        generator: {
            name: "골드 발전기",
            icon: "⚡",
            cost: 200,
            incomePerSec: 3,
            isUtility: true
        }
    },

    // Enemies Specification
    ENEMIES: {
        basic: { name: "Grunt", color: "#e74c3c", hp: 100, speed: 70, reward: 12, size: 10, aiLevel: "normal" },
        runner: { name: "Scout Runner", color: "#f1c40f", hp: 60, speed: 120, reward: 15, size: 8, aiLevel: "smart" },
        tank: { name: "Heavy Tank", color: "#8e44ad", hp: 320, speed: 45, reward: 30, size: 15, aiLevel: "normal" },
        shield: { name: "Shield Enforcer", color: "#3498db", hp: 140, shieldHp: 150, speed: 65, reward: 25, size: 12, aiLevel: "smart" },
        swarm: { name: "Swarm Bug", color: "#e67e22", hp: 35, speed: 90, reward: 5, size: 6, aiLevel: "normal" },
        unstoppable: { name: "Ironclad Juggernaut", color: "#95a5a6", hp: 250, speed: 55, reward: 35, size: 14, slowResist: 0.8, aiLevel: "smart" },
        regenerator: { name: "Bio Mutator", color: "#2ecc71", hp: 180, speed: 60, reward: 28, regenRate: 15, size: 11, aiLevel: "smart" },
        splitter: { name: "Cellular Splitter", color: "#1abc9c", hp: 200, speed: 65, reward: 25, size: 13, aiLevel: "smart" },
        engineer: { name: "Shield Engineer", color: "#d35400", hp: 150, speed: 60, reward: 35, auraRange: 100, auraSpeedBuff: 1.3, size: 11, aiLevel: "smart" },
        boss: { name: "Siege Walker Boss", color: "#c0392b", hp: 2500, speed: 35, reward: 250, size: 22, isBoss: true, aiLevel: "elite" }
    }
};

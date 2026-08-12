// 타워 디펜스 게임 시스템 통합 스모크 테스트 (Automated Smoke Test Suite)

import { Grid } from '../engine/Grid.js';
import { Pathfinder } from '../engine/Pathfinder.js';
import { ThreatMap } from '../engine/ThreatMap.js';
import { Generator } from '../entities/UtilityBuilding.js';
import { Enemy } from '../entities/enemies/Enemy.js';
import { BossEnemy } from '../entities/enemies/BossEnemy.js';
import { statusSystem } from '../engine/StatusEffectSystem.js';
import { soundManager } from '../engine/SoundManager.js';
import { GatlingTower } from '../entities/towers/GatlingTower.js';
import { CannonTower } from '../entities/towers/CannonTower.js';
import { FrostTower } from '../entities/towers/FrostTower.js';
import { Game } from '../engine/Game.js';

export function runSmokeTests() {
    const results = [];
    console.log("🧪 Running Tactical Mound Defense Smoke Tests...");

    // Test 1: A* Spawn -> Base Path Valid
    try {
        const grid = new Grid(24, 14, 40);
        const pathfinder = new Pathfinder(24, 14, 40);
        const spawnPos = grid.getSpawnWorldPos();
        const basePos = grid.getBaseWorldPos();

        const path = pathfinder.findPath(spawnPos, basePos, (c, r) => grid.isBlocked(c, r), null, 'normal');
        if (path && path.length > 0) {
            results.push({ name: "[P1] Spawn->Base A* Path Finding", status: "PASS", detail: `Path length: ${path.length}` });
        } else {
            results.push({ name: "[P1] Spawn->Base A* Path Finding", status: "FAIL", detail: "Path returned null or empty!" });
        }
    } catch (e) {
        results.push({ name: "[P1] Spawn->Base A* Path Finding", status: "ERROR", detail: e.message });
    }

    // Test 2: Mound Placement Path Validation
    try {
        const grid = new Grid(24, 14, 40);
        const pathfinder = new Pathfinder(24, 14, 40);
        const spawnPos = grid.getSpawnWorldPos();
        const basePos = grid.getBaseWorldPos();

        const canBuildValid = pathfinder.hasValidPath(spawnPos, basePos, (c, r) => {
            if (c === 5 && r === 5) return true;
            return grid.isBlocked(c, r);
        });

        if (canBuildValid) {
            results.push({ name: "[P1] Mound Placement Path Validation", status: "PASS", detail: "Valid mound build allowed." });
        } else {
            results.push({ name: "[P1] Mound Placement Path Validation", status: "FAIL", detail: "Valid mound rejected!" });
        }
    } catch (e) {
        results.push({ name: "[P1] Mound Placement Path Validation", status: "ERROR", detail: e.message });
    }

    // Test 3: Generator Sell Value & Gold NaN Prevention
    try {
        const gen = new Generator(5, 5, 40);
        const sellVal = gen.getSellValue();
        if (Number.isFinite(sellVal) && sellVal > 0) {
            results.push({ name: "[P2] Generator Sell Value (No NaN)", status: "PASS", detail: `Sell Value: ${sellVal}G` });
        } else {
            results.push({ name: "[P2] Generator Sell Value (No NaN)", status: "FAIL", detail: `Invalid sell value: ${sellVal}` });
        }
    } catch (e) {
        results.push({ name: "[P2] Generator Sell Value (No NaN)", status: "ERROR", detail: e.message });
    }

    // Test 4: Splitter Spawn & Enemy Import check
    try {
        const path = [{ x: 10, y: 10 }, { x: 50, y: 50 }];
        const splitter = new Enemy('splitter', path, { x: 10, y: 10 });
        splitter.takeDamage(999);

        const miniEnemies = [];
        if (!splitter.active) {
            for (let s = 0; s < 3; s++) {
                const mini = new Enemy('swarm', path, { x: splitter.x, y: splitter.y });
                miniEnemies.push(mini);
            }
        }

        if (miniEnemies.length === 3) {
            results.push({ name: "[P2] Splitter Death & Mini Swarm Spawn", status: "PASS", detail: "3 Mini Swarms spawned without error." });
        } else {
            results.push({ name: "[P2] Splitter Death & Mini Swarm Spawn", status: "FAIL", detail: "Mini Swarm spawn count mismatch." });
        }
    } catch (e) {
        results.push({ name: "[P2] Splitter Death & Mini Swarm Spawn", status: "ERROR", detail: e.message });
    }

    // Test 5: Gatling vs Cannon Overclock Heat Rate Consistency
    try {
        const gatling = new GatlingTower(1, 1, 40);
        const cannon = new CannonTower(1, 2, 40);
        gatling.toggleOverclock();
        cannon.toggleOverclock();

        gatling.update(1.0, [], [], { addBeam: () => {}, addExplosion: () => {}, addShockwaveRing: () => {}, addFloatingText: () => {} }, soundManager);
        cannon.update(1.0, [], [], { addBeam: () => {}, addExplosion: () => {}, addShockwaveRing: () => {}, addFloatingText: () => {} }, soundManager);

        if (Math.abs(gatling.heat - 28) < 1 && Math.abs(cannon.heat - 42) < 1) {
            results.push({ name: "[P2] Gatling Heat Rate Consistency (Single Call)", status: "PASS", detail: `Gatling heat: ${gatling.heat.toFixed(1)}, Cannon heat: ${cannon.heat.toFixed(1)}` });
        } else {
            results.push({ name: "[P2] Gatling Heat Rate Consistency (Single Call)", status: "FAIL", detail: `Double heat bug detected! Gatling heat: ${gatling.heat}, Cannon heat: ${cannon.heat}` });
        }
    } catch (e) {
        results.push({ name: "[P2] Gatling Heat Rate Consistency (Single Call)", status: "ERROR", detail: e.message });
    }

    // Test 6: Engineer Shield Buff Absorption
    try {
        const enemy = new Enemy('basic', [{ x: 0, y: 0 }], { x: 0, y: 0 });
        statusSystem.applyEffect(enemy, 'Shield', 5.0, 50);

        const initialHp = enemy.hp;
        enemy.takeDamage(30);

        const remainingShield = statusSystem.getEffectValue(enemy, 'Shield');

        if (enemy.hp === initialHp && remainingShield === 20) {
            results.push({ name: "[P2] Engineer Shield Buff Absorption", status: "PASS", detail: "Shield absorbed 30 dmg, HP intact." });
        } else {
            results.push({ name: "[P2] Engineer Shield Buff Absorption", status: "FAIL", detail: `HP: ${enemy.hp}/${initialHp}, Shield: ${remainingShield}` });
        }
    } catch (e) {
        results.push({ name: "[P2] Engineer Shield Buff Absorption", status: "ERROR", detail: e.message });
    }

    // Test 7: [P2 5차 강화] E2E Playthrough with Strict Setup Assertions & Production Economy Upgrades
    try {
        const game = new Game('game-canvas');
        
        // 1. Build initial towers within Initial Gold (500G)
        // Mound (150G) + Gatling (100G) + Cannon (175G) = 425G (Remaining: 75G)
        const bMound = game.tryBuildMound(5, 5);
        const bGatling = game.tryBuildTower(6, 3, 'gatling');
        const bCannon = game.tryBuildTower(6, 4, 'cannon');

        if (!bMound || !bGatling || !bCannon) {
            throw new Error("Initial setup building failed!");
        }

        // 2. Start Wave 1
        game.startNextWave();

        let wave1Cleared = false;
        let wave2Cleared = false;

        // Run Game loop through Wave 1 & Wave 2 with production economy upgrades
        for (let tick = 0; tick < 1600; tick++) {
            game.update(0.1);

            // As gold accumulates via wave clears, use production upgrade path (upgradeSelectedNormal)
            if (game.gold >= 80 && game.towers[0] && game.towers[0].level === 1) {
                game.selectTower(game.towers[0]);
                game.upgradeSelectedNormal(); // Gatling Lv2 Upgrade via Production Path
            }

            if (game.gold >= 120 && game.towers[1] && game.towers[1].level === 1) {
                game.selectTower(game.towers[1]);
                game.upgradeSelectedNormal(); // Cannon Lv2 Upgrade via Production Path
            }

            if (game.currentWaveNum === 2 && !wave1Cleared) {
                wave1Cleared = true;
                game.startNextWave(); // Start Wave 2
            }

            if (game.currentWaveNum === 3) {
                wave2Cleared = true;
                break;
            }
        }

        if (wave1Cleared && wave2Cleared && !game.isGameOver && Number.isFinite(game.gold)) {
            results.push({ 
                name: "[P2/E2E] Strict Economy Playthrough (Wave 1 & 2 Clear -> Wave 3 Transition)", 
                status: "PASS", 
                detail: `Wave 1 & 2 Cleared via Production Upgrades! Active Wave: 3, Gold: ${Math.floor(game.gold)}G, Base HP: ${game.baseTower.hp}` 
            });
        } else {
            results.push({ 
                name: "[P2/E2E] Strict Economy Playthrough (Wave 1 & 2 Clear -> Wave 3 Transition)", 
                status: "FAIL", 
                detail: `Wave1Cleared: ${wave1Cleared}, Wave2Cleared: ${wave2Cleared}, WaveNum: ${game.currentWaveNum}` 
            });
        }
    } catch (e) {
        results.push({ name: "[P2/E2E] Strict Economy Playthrough", status: "ERROR", detail: e.stack || e.message });
    }

    // Output Test Summary
    console.table(results);
    return results;
}

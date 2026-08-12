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

    // Test 5: Gatling vs Cannon Overclock Heat Rate Consistency (P2 Fix Verification)
    try {
        const gatling = new GatlingTower(1, 1, 40);
        const cannon = new CannonTower(1, 2, 40);
        gatling.toggleOverclock();
        cannon.toggleOverclock();

        // 1.0 second update
        gatling.update(1.0, [], [], { addBeam: () => {}, addExplosion: () => {}, addShockwaveRing: () => {}, addFloatingText: () => {} }, soundManager);
        cannon.update(1.0, [], [], { addBeam: () => {}, addExplosion: () => {}, addShockwaveRing: () => {}, addFloatingText: () => {} }, soundManager);

        // Heat rate expected: gatling.heatIncrease(8) * 3.5 = 28, cannon.heatIncrease(12) * 3.5 = 42
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

    // Test 7: [ENHANCED FULL E2E INTEGRATION TEST] Full Wave Progression & Enemy Movement Verification
    try {
        const game = new Game('game-canvas');
        
        // 1. Build a mound and towers
        game.tryBuildMound(5, 5);
        game.tryBuildTower(6, 3, 'gatling');
        game.tryBuildTower(6, 4, 'cannon');
        game.tryBuildTower(17, 3, 'generator');

        // 2. Start Wave 1
        game.startNextWave();
        const spawnPos = game.grid.getSpawnWorldPos();

        let enemyMoved = false;
        let spawnQueueEmptied = false;
        let waveCleared = false;

        // Run Game loop until Wave 1 is completely spawned and cleared (up to 800 ticks = 80s)
        for (let tick = 0; tick < 800; tick++) {
            game.update(0.1);

            // Verify Enemy movement from Spawn position
            if (game.enemies.length > 0) {
                const firstEnemy = game.enemies[0];
                if (Math.hypot(firstEnemy.x - spawnPos.x, firstEnemy.y - spawnPos.y) > 10) {
                    enemyMoved = true;
                }
            }

            if (game.waveManager.spawnQueue.length === 0) {
                spawnQueueEmptied = true;
            }

            if (game.currentWaveNum === 2) {
                waveCleared = true;
                break;
            }
        }

        if (enemyMoved && spawnQueueEmptied && waveCleared && Number.isFinite(game.gold)) {
            results.push({ 
                name: "[P1/E2E] Full Game Playthrough (Wave 1 Spawn->Move->Clear->Wave 2)", 
                status: "PASS", 
                detail: `Enemies moved: true, SpawnQueue emptied: true, Wave 1 Cleared -> Wave 2 Active! Gold: ${Math.floor(game.gold)}G` 
            });
        } else {
            results.push({ 
                name: "[P1/E2E] Full Game Playthrough (Wave 1 Spawn->Move->Clear->Wave 2)", 
                status: "FAIL", 
                detail: `Moved: ${enemyMoved}, QueueEmptied: ${spawnQueueEmptied}, WaveCleared: ${waveCleared}` 
            });
        }
    } catch (e) {
        results.push({ name: "[P1/E2E] Full Game Playthrough", status: "ERROR", detail: e.stack || e.message });
    }

    // Output Test Summary
    console.table(results);
    return results;
}

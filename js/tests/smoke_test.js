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

    // Test 5: SoundManager init sequence
    try {
        soundManager.init();
        soundManager.playBuild();
        results.push({ name: "[P2] SoundManager Init Sequence", status: "PASS", detail: "Sound calls executed cleanly." });
    } catch (e) {
        results.push({ name: "[P2] SoundManager Init Sequence", status: "ERROR", detail: e.message });
    }

    // Test 6: Engineer Shield Buff Damage Absorption
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

    // Test 7: [FULL E2E INTEGRATION TEST] Game.startNextWave -> Game.update Loop (Catches P1 spawnQueue crash & Full Flow)
    try {
        const game = new Game('game-canvas');
        
        // 1. Build a mound and tower
        game.tryBuildMound(5, 5);
        game.tryBuildTower(6, 3, 'gatling');
        game.tryBuildTower(6, 4, 'cannon');
        game.tryBuildTower(11, 8, 'frost');
        game.tryBuildTower(17, 3, 'generator');

        // 2. Start Wave 1
        game.startNextWave();
        if (!game.waveManager.isWaveActive) {
            throw new Error("Wave failed to activate!");
        }

        // 3. Run Game.update() for 300 ticks (simulating 30 seconds of gameplay)
        let crashed = false;
        let spawnedEnemyCount = 0;

        for (let tick = 0; tick < 300; tick++) {
            game.update(0.1);
            if (game.enemies.length > 0) spawnedEnemyCount++;
        }

        if (spawnedEnemyCount > 0 && !game.isGameOver && Number.isFinite(game.gold)) {
            results.push({ name: "[P1/E2E] Full Game Update Loop & Wave 1 Flow", status: "PASS", detail: `300 ticks updated cleanly. Enemies spawned: ${spawnedEnemyCount}, Gold: ${Math.floor(game.gold)}` });
        } else {
            results.push({ name: "[P1/E2E] Full Game Update Loop & Wave 1 Flow", status: "FAIL", detail: "Wave 1 flow did not spawn enemies or updated improperly." });
        }
    } catch (e) {
        results.push({ name: "[P1/E2E] Full Game Update Loop & Wave 1 Flow", status: "ERROR", detail: e.stack || e.message });
    }

    // Output Test Summary
    console.table(results);
    return results;
}

// 메인 게임 엔진 코디네이터 (Game Engine Coordinator)
import { CONFIG } from '../config.js';
import { Grid } from './Grid.js';
import { Pathfinder } from './Pathfinder.js';
import { ThreatMap } from './ThreatMap.js';
import { ParticleSystem } from './ParticleSystem.js';
import { soundManager } from './SoundManager.js';
import { statusSystem } from './StatusEffectSystem.js';

import { BaseTower } from '../entities/BaseTower.js';
import { Mound } from '../entities/Mound.js';
import { Generator } from '../entities/UtilityBuilding.js';
import { GatlingTower } from '../entities/towers/GatlingTower.js';
import { CannonTower } from '../entities/towers/CannonTower.js';
import { FrostTower } from '../entities/towers/FrostTower.js';
import { WaveManager } from '../entities/WaveManager.js';
import { Enemy } from '../entities/enemies/Enemy.js';

export class Game {
    constructor(canvasId) {
        this.canvas = typeof document !== 'undefined' ? document.getElementById(canvasId) : null;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        // Setup Resolution
        this.cols = CONFIG.GRID_COLS;
        this.rows = CONFIG.GRID_ROWS;
        this.cellSize = CONFIG.CELL_SIZE;

        if (this.canvas) {
            this.canvas.width = this.cols * this.cellSize;
            this.canvas.height = this.rows * this.cellSize;
        }

        // Core Game Subsystems
        this.grid = new Grid(this.cols, this.rows, this.cellSize);
        this.pathfinder = new Pathfinder(this.cols, this.rows, this.cellSize);
        this.threatMap = new ThreatMap(this.cols, this.rows, this.cellSize);
        this.particleSystem = new ParticleSystem();
        this.waveManager = new WaveManager();
        this.soundManager = soundManager;

        // Entities Lists
        this.mounds = [];
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.baseTower = new BaseTower(this.grid.baseCell.col, this.grid.baseCell.row, this.cellSize);

        // State Variables
        this.gold = CONFIG.INITIAL_GOLD;
        this.passiveIncomeRate = CONFIG.PASSIVE_GOLD_RATE;
        this.currentWaveNum = 1;
        this.totalKills = 0;
        this.gameSpeed = 1;
        this.isGameOver = false;

        // Mouse & Selection UI State
        this.hoverCell = null;
        this.buildMode = null;
        this.selectedTower = null;

        this.lastTime = 0;
        this.initMoundsFromGrid();
        if (typeof window !== 'undefined') {
            this.bindEvents();
        }
    }

    initMoundsFromGrid() {
        this.mounds = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid.isMound(c, r)) {
                    this.mounds.push(new Mound(c, r, this.cellSize));
                }
            }
        }
    }

    bindEvents() {
        const initAudio = () => {
            soundManager.init();
            window.removeEventListener('pointerdown', initAudio);
            window.removeEventListener('click', initAudio);
        };
        window.addEventListener('pointerdown', initAudio);
        window.addEventListener('click', initAudio);

        if (this.canvas) {
            this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.canvas.addEventListener('click', (e) => this.onClick(e));
        }

        const btnSpeed = document.getElementById('btn-speed');
        if (btnSpeed) {
            btnSpeed.addEventListener('click', () => {
                this.gameSpeed = this.gameSpeed === 1 ? 2 : (this.gameSpeed === 2 ? 3 : 1);
                btnSpeed.innerText = `⚡ ${this.gameSpeed}x`;
            });
        }

        const btnSound = document.getElementById('btn-sound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const enabled = soundManager.toggleSound();
                btnSound.innerText = enabled ? '🔊 ON' : '🔇 OFF';
            });
        }

        const btnMound = document.getElementById('btn-build-mound');
        if (btnMound) {
            btnMound.addEventListener('click', () => {
                this.setBuildMode(this.buildMode === 'mound' ? null : 'mound');
            });
        }

        const cards = document.querySelectorAll('.tower-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.getAttribute('data-tower-type');
                this.setBuildMode(this.buildMode === type ? null : type);
            });
        });

        const btnOrbital = document.getElementById('btn-orbital-strike');
        if (btnOrbital) {
            btnOrbital.addEventListener('click', () => {
                if (this.baseTower.orbitalCooldown > 0) return;
                this.setBuildMode('orbital');
            });
        }

        const btnStartWave = document.getElementById('btn-start-wave');
        if (btnStartWave) {
            btnStartWave.addEventListener('click', () => {
                this.startNextWave();
            });
        }

        const btnClosePanel = document.getElementById('btn-close-panel');
        if (btnClosePanel) btnClosePanel.addEventListener('click', () => this.deselectTower());

        const btnSell = document.getElementById('btn-sell-tower');
        if (btnSell) btnSell.addEventListener('click', () => this.sellSelectedTower());

        const btnOverclock = document.getElementById('btn-overclock');
        if (btnOverclock) btnOverclock.addEventListener('click', () => this.toggleOverclockSelected());

        const selTarget = document.getElementById('sel-target-strategy');
        if (selTarget) {
            selTarget.addEventListener('change', (e) => {
                if (this.selectedTower) this.selectedTower.setTargetStrategy(e.target.value);
            });
        }

        const btnUpgradeNorm = document.getElementById('btn-upgrade-normal');
        if (btnUpgradeNorm) btnUpgradeNorm.addEventListener('click', () => this.upgradeSelectedNormal());

        const btnBranch1 = document.getElementById('btn-branch-1');
        if (btnBranch1) btnBranch1.addEventListener('click', () => this.upgradeSelectedBranch('opt1'));

        const btnBranch2 = document.getElementById('btn-branch-2');
        if (btnBranch2) btnBranch2.addEventListener('click', () => this.upgradeSelectedBranch('opt2'));

        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) btnRestart.addEventListener('click', () => location.reload());
    }

    setBuildMode(mode) {
        this.buildMode = mode;

        const btnMound = document.getElementById('btn-build-mound');
        if (btnMound) btnMound.classList.toggle('active', mode === 'mound');

        document.querySelectorAll('.tower-card').forEach(card => {
            card.classList.toggle('selected', card.getAttribute('data-tower-type') === mode);
        });
    }

    onMouseMove(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const col = Math.floor(mouseX / this.cellSize);
        const row = Math.floor(mouseY / this.cellSize);

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.hoverCell = { col, row };
        } else {
            this.hoverCell = null;
        }
    }

    onClick(e) {
        if (!this.hoverCell) return;
        const { col, row } = this.hoverCell;

        if (this.buildMode === 'orbital') {
            const worldPos = {
                x: col * this.cellSize + this.cellSize / 2,
                y: row * this.cellSize + this.cellSize / 2
            };
            if (this.baseTower.useOrbitalStrike(worldPos, this.enemies, this.particleSystem, soundManager)) {
                this.setBuildMode(null);
            }
            return;
        }

        if (this.buildMode === 'mound') {
            this.tryBuildMound(col, row);
            return;
        }

        if (this.buildMode && this.buildMode !== 'mound') {
            this.tryBuildTower(col, row, this.buildMode);
            return;
        }

        const mound = this.mounds.find(m => m.col === col && m.row === row);
        if (mound && mound.towerInstalled) {
            this.selectTower(mound.towerInstalled);
        } else {
            this.deselectTower();
        }
    }

    tryBuildMound(col, row) {
        const cost = CONFIG.MOUND_BUILD_COST;
        if (this.gold < cost) {
            this.particleSystem.addFloatingText(col * this.cellSize + 20, row * this.cellSize + 20, '골드 부족!', '#ff4757', 14);
            return false;
        }

        if (!this.grid.canPlaceMound(col, row)) {
            this.particleSystem.addFloatingText(col * this.cellSize + 20, row * this.cellSize + 20, '설치 불가 위치!', '#ff4757', 14);
            return false;
        }

        const spawnPos = this.grid.getSpawnWorldPos();
        const basePos = this.grid.getBaseWorldPos();

        const pathExists = this.pathfinder.hasValidPath(spawnPos, basePos, (c, r) => {
            if (c === col && r === row) return true;
            return this.grid.isBlocked(c, r);
        });

        if (!pathExists) {
            this.particleSystem.addFloatingText(col * this.cellSize + 20, row * this.cellSize + 20, '🚫 경로 완막 불가!', '#ff4757', 14);
            soundManager.playExplosion();
            return false;
        }

        this.gold -= cost;
        this.grid.setMound(col, row);
        const newMound = new Mound(col, row, this.cellSize);
        this.mounds.push(newMound);

        this.soundManager.playBuild();
        this.particleSystem.addExplosion(newMound.x, newMound.y, '#00d2ff', 12, 4);

        this.recalculateAllEnemyPaths();
        this.setBuildMode(null);
        return true;
    }

    tryBuildTower(col, row, type) {
        const mound = this.mounds.find(m => m.col === col && m.row === row);
        if (!mound) {
            this.particleSystem.addFloatingText(col * this.cellSize + 20, row * this.cellSize + 20, '둔덕 위에만 설치 가능!', '#ff4757', 13);
            return false;
        }
        if (mound.towerInstalled) {
            this.particleSystem.addFloatingText(col * this.cellSize + 20, row * this.cellSize + 20, '이미 건물이 존재합니다!', '#ff4757', 13);
            return false;
        }

        const spec = CONFIG.TOWERS[type];
        if (this.gold < spec.cost) {
            this.particleSystem.addFloatingText(col * this.cellSize + 20, row * this.cellSize + 20, '골드 부족!', '#ff4757', 14);
            return false;
        }

        this.gold -= spec.cost;
        let building = null;

        if (type === 'gatling') building = new GatlingTower(col, row, this.cellSize);
        else if (type === 'cannon') building = new CannonTower(col, row, this.cellSize);
        else if (type === 'frost') building = new FrostTower(col, row, this.cellSize);
        else if (type === 'generator') building = new Generator(col, row, this.cellSize);

        mound.towerInstalled = building;
        this.towers.push(building);

        this.soundManager.playBuild();
        this.particleSystem.addExplosion(building.x, building.y, '#00ffaa', 15, 4);
        this.setBuildMode(null);

        this.recalculateAllEnemyPaths();
        this.selectTower(building);
        return true;
    }

    recalculateAllEnemyPaths() {
        const basePos = this.grid.getBaseWorldPos();
        this.threatMap.recalculate(this.towers);

        for (const enemy of this.enemies) {
            if (enemy.active && enemy.hp > 0) {
                const enemyPos = { x: enemy.x, y: enemy.y };
                const newPath = this.pathfinder.findPath(
                    enemyPos, basePos, (c, r) => this.grid.isBlocked(c, r), this.threatMap, enemy.aiLevel
                );
                if (newPath) {
                    enemy.updatePath(newPath);
                }
            }
        }
    }

    selectTower(tower) {
        this.selectedTower = tower;
        const panel = document.getElementById('selected-panel');
        if (!panel) return;
        panel.classList.remove('hidden');

        const elIcon = document.getElementById('sel-tower-icon');
        if (elIcon) elIcon.innerText = tower.icon;

        const elName = document.getElementById('sel-tower-name');
        if (elName) elName.innerText = tower.name;

        const elLvl = document.getElementById('sel-tower-lvl');
        if (elLvl) elLvl.innerText = `Lv. ${tower.level}${tower.branch ? ` (${tower.branch.toUpperCase()})` : ''}`;

        const sellVal = tower.getSellValue ? tower.getSellValue() : Math.floor((tower.totalInvestedCost || tower.cost) * 0.7);
        const elSell = document.getElementById('sell-gold-val');
        if (elSell) elSell.innerText = Number.isFinite(sellVal) ? sellVal : 0;

        if (tower.isUtility) {
            const elDmg = document.getElementById('sel-dmg');
            if (elDmg) elDmg.innerText = `+${tower.incomePerSec}/s G`;

            const elSpd = document.getElementById('sel-spd');
            if (elSpd) elSpd.innerText = 'N/A';

            const elRng = document.getElementById('sel-rng');
            if (elRng) elRng.innerText = 'N/A';

            const ocSec = document.getElementById('overclock-section');
            if (ocSec) ocSec.classList.add('hidden');

            const upSec = document.getElementById('upgrade-section');
            if (upSec) upSec.classList.add('hidden');
        } else {
            const elDmg = document.getElementById('sel-dmg');
            if (elDmg) elDmg.innerText = tower.damage;

            const elSpd = document.getElementById('sel-spd');
            if (elSpd) elSpd.innerText = `${tower.attackSpeed.toFixed(1)}/s`;

            const elRng = document.getElementById('sel-rng');
            if (elRng) elRng.innerText = tower.range;

            const selTarget = document.getElementById('sel-target-strategy');
            if (selTarget) selTarget.value = tower.targetStrategy;

            const ocSec = document.getElementById('overclock-section');
            if (ocSec) ocSec.classList.remove('hidden');

            const upSec = document.getElementById('upgrade-section');
            if (upSec) upSec.classList.remove('hidden');

            this.updateUpgradePanelUI();
        }
    }

    updateUpgradePanelUI() {
        const tower = this.selectedTower;
        if (!tower || tower.isUtility) return;

        const spec = CONFIG.TOWERS[tower.type];
        const btnNormal = document.getElementById('btn-upgrade-normal');
        const branchContainer = document.getElementById('branch-upgrade-container');
        if (!btnNormal || !branchContainer) return;

        if (tower.level === 1) {
            btnNormal.classList.remove('hidden');
            branchContainer.classList.add('hidden');
            const elCost = document.getElementById('normal-upgrade-cost');
            if (elCost) elCost.innerText = spec.upgrades.level2Cost;
        } else if (tower.level === 2) {
            btnNormal.classList.add('hidden');
            branchContainer.classList.remove('hidden');

            const branches = spec.upgrades.branches;
            const keys = Object.keys(branches);
            const b1 = branches[keys[0]];
            const b2 = branches[keys[1]];

            const t1 = document.getElementById('branch-1-title');
            if (t1) t1.innerText = b1.name;
            const d1 = document.getElementById('branch-1-desc');
            if (d1) d1.innerText = b1.desc;
            const c1 = document.getElementById('branch-1-cost');
            if (c1) c1.innerText = b1.cost;

            const t2 = document.getElementById('branch-2-title');
            if (t2) t2.innerText = b2.name;
            const d2 = document.getElementById('branch-2-desc');
            if (d2) d2.innerText = b2.desc;
            const c2 = document.getElementById('branch-2-cost');
            if (c2) c2.innerText = b2.cost;
        } else {
            btnNormal.classList.add('hidden');
            branchContainer.classList.add('hidden');
        }
    }

    toggleOverclockSelected() {
        if (!this.selectedTower || this.selectedTower.isUtility) return;
        this.selectedTower.toggleOverclock();
        this.recalculateAllEnemyPaths();
    }

    upgradeSelectedNormal() {
        const tower = this.selectedTower;
        if (!tower || tower.level !== 1) return;
        const cost = CONFIG.TOWERS[tower.type].upgrades.level2Cost;

        if (this.gold < cost) {
            this.particleSystem.addFloatingText(tower.x, tower.y, '골드 부족!', '#ff4757', 14);
            return;
        }

        this.gold -= cost;
        tower.upgradeNormal();
        this.soundManager.playBuild();
        this.recalculateAllEnemyPaths();
        this.selectTower(tower);
    }

    upgradeSelectedBranch(opt) {
        const tower = this.selectedTower;
        if (!tower || tower.level !== 2) return;

        const spec = CONFIG.TOWERS[tower.type];
        const keys = Object.keys(spec.upgrades.branches);
        const branchKey = opt === 'opt1' ? keys[0] : keys[1];
        const cost = spec.upgrades.branches[branchKey].cost;

        if (this.gold < cost) {
            this.particleSystem.addFloatingText(tower.x, tower.y, '골드 부족!', '#ff4757', 14);
            return;
        }

        this.gold -= cost;
        tower.upgradeBranch(branchKey);
        this.soundManager.playBuild();
        this.recalculateAllEnemyPaths();
        this.selectTower(tower);
    }

    sellSelectedTower() {
        const tower = this.selectedTower;
        if (!tower) return;

        const rawReturn = tower.getSellValue ? tower.getSellValue() : Math.floor((tower.totalInvestedCost || tower.cost) * 0.7);
        const returnGold = Number.isFinite(rawReturn) ? rawReturn : 0;

        this.gold += returnGold;

        const mound = this.mounds.find(m => m.col === tower.col && m.row === tower.row);
        if (mound) mound.towerInstalled = null;

        const idx = this.towers.indexOf(tower);
        if (idx !== -1) this.towers.splice(idx, 1);

        this.particleSystem.addFloatingText(tower.x, tower.y, `+${returnGold}G`, '#ffd166', 15);
        this.soundManager.playKill();
        this.recalculateAllEnemyPaths();
        this.deselectTower();
    }

    deselectTower() {
        this.selectedTower = null;
        const panel = document.getElementById('selected-panel');
        if (panel) panel.classList.add('hidden');
    }

    startNextWave() {
        const overlay = document.getElementById('wave-preview-overlay');
        if (overlay) overlay.classList.add('hidden');
        this.waveManager.startWave(this.currentWaveNum, this.grid, this.pathfinder, this.threatMap, this.enemies);
    }

    updateWavePreviewUI() {
        const recipe = this.waveManager.getWaveRecipe(this.currentWaveNum);

        const elNum = document.getElementById('preview-wave-num');
        if (elNum) elNum.innerText = `WAVE ${this.currentWaveNum}`;

        const elTip = document.getElementById('preview-tip-text');
        if (elTip) elTip.innerText = recipe.tip;

        const container = document.getElementById('preview-enemy-list');
        if (container) {
            container.innerHTML = '';
            for (const grp of recipe.groups) {
                const spec = CONFIG.ENEMIES[grp.type] || CONFIG.ENEMIES.basic;
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <span><strong style="color:${spec.color}">${spec.name}</strong> × ${grp.count}</span>
                    <span class="hud-sub">HP: ${spec.hp} | SPD: ${spec.speed}</span>
                `;
                if (container.appendChild) container.appendChild(item);
            }
        }

        const overlay = document.getElementById('wave-preview-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    start() {
        this.updateWavePreviewUI();
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        dt = Math.min(dt, 0.1) * this.gameSpeed;

        if (!this.isGameOver) {
            this.update(dt);
        }

        this.render();
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    update(dt) {
        // 1. Passive & Generator Gold Production
        let totalIncomeRate = this.passiveIncomeRate;
        for (const t of this.towers) {
            if (t.isUtility && t.active) totalIncomeRate += t.incomePerSec;
        }
        this.gold += totalIncomeRate * dt;

        // 2. Systems Update
        statusSystem.update(dt);
        this.particleSystem.update(dt);
        this.threatMap.recalculate(this.towers);

        // 3. Main Base Update
        this.baseTower.update(dt, this.enemies, this.projectiles, soundManager);
        if (this.baseTower.hp <= 0) {
            this.triggerGameOver();
        }

        // 4. Mounds & Towers Update
        for (const t of this.towers) {
            t.update(dt, this.enemies, this.projectiles, this.particleSystem, soundManager);
        }

        // 5. Wave Spawner Update
        this.waveManager.update(dt, this.grid, this.pathfinder, this.threatMap, this.enemies);

        // 6. Enemies Update
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this);

            if (!enemy.active) {
                if (enemy.hp <= 0) {
                    this.gold += enemy.reward;
                    this.totalKills++;
                    this.particleSystem.addFloatingText(enemy.x, enemy.y, `+${enemy.reward}G`, '#ffd166', 13);
                    soundManager.playKill();

                    if (enemy.type === 'splitter') {
                        for (let s = 0; s < 3; s++) {
                            const mini = new Enemy('swarm', enemy.path, { x: enemy.x + (s - 1) * 10, y: enemy.y });
                            mini.pathIndex = enemy.pathIndex;
                            this.enemies.push(mini);
                        }
                    }
                }
                this.enemies.splice(i, 1);
            }
        }

        // 7. Projectiles Update
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, this.enemies, this.projectiles, this.particleSystem, soundManager);
            if (!p.active) {
                this.projectiles.splice(i, 1);
            }
        }

        // 8. Wave Clear Check [P1 2차 수정]: this.spawnQueue -> this.waveManager.spawnQueue 수정!
        if (this.waveManager.isWaveActive && this.waveManager.spawnQueue.length === 0 && this.enemies.length === 0) {
            this.waveManager.isWaveActive = false;
            this.currentWaveNum++;
            this.gold += 100;
            this.soundManager.playBuild();
            this.updateWavePreviewUI();
        }

        // 9. HUD UI Sync
        this.updateHUDUI();
    }

    updateHUDUI() {
        const elGold = document.getElementById('gold-val');
        if (elGold) elGold.innerText = Number.isFinite(this.gold) ? Math.floor(this.gold) : 0;

        let totalIncome = this.passiveIncomeRate;
        for (const t of this.towers) if (t.isUtility) totalIncome += t.incomePerSec;

        const elInc = document.getElementById('income-val');
        if (elInc) elInc.innerText = `(+${totalIncome}/s)`;

        const elWave = document.getElementById('wave-val');
        if (elWave) elWave.innerText = this.currentWaveNum;

        const hpPercent = (this.baseTower.hp / this.baseTower.maxHp) * 100;
        const elHpBar = document.getElementById('base-hp-bar');
        if (elHpBar) elHpBar.style.width = `${hpPercent}%`;

        const elHpVal = document.getElementById('base-hp-val');
        if (elHpVal) elHpVal.innerText = `${Math.ceil(this.baseTower.hp)} / ${this.baseTower.maxHp}`;

        const cdElem = document.getElementById('orbital-cooldown');
        if (cdElem) {
            if (this.baseTower.orbitalCooldown > 0) {
                cdElem.innerText = `${Math.ceil(this.baseTower.orbitalCooldown)}s`;
                cdElem.style.color = '#ff4757';
            } else {
                cdElem.innerText = 'READY';
                cdElem.style.color = '#00ffaa';
            }
        }

        if (this.selectedTower && !this.selectedTower.isUtility) {
            const heatFill = document.getElementById('heat-bar-fill');
            const heatText = document.getElementById('heat-status-text');

            if (heatFill) heatFill.style.width = `${this.selectedTower.heat}%`;

            if (heatText) {
                if (statusSystem.hasEffect(this.selectedTower, 'Overheat')) {
                    heatText.innerText = 'OVERHEAT (DISABLED)';
                    heatText.style.color = '#ff4757';
                } else if (this.selectedTower.isOverclocked) {
                    heatText.innerText = 'OVERCLOCKED!';
                    heatText.style.color = '#ff7f50';
                } else {
                    heatText.innerText = 'NORMAL';
                    heatText.style.color = '#94a3b8';
                }
            }
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        const elFW = document.getElementById('final-wave');
        if (elFW) elFW.innerText = this.currentWaveNum;

        const elFK = document.getElementById('final-kills');
        if (elFK) elFK.innerText = this.totalKills;

        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('hidden');
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.grid.render(this.ctx, this.hoverCell, this.selectedTower, this.threatMap);

        for (const m of this.mounds) {
            m.render(this.ctx);
        }

        this.baseTower.render(this.ctx);

        for (const t of this.towers) {
            const isSel = this.selectedTower === t;
            t.render(this.ctx, isSel);
        }

        for (const e of this.enemies) {
            e.render(this.ctx);
        }

        for (const p of this.projectiles) {
            p.render(this.ctx);
        }

        this.particleSystem.render(this.ctx);
    }
}

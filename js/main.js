// 타워 디펜스 메인 모듈 진입점
import { Game } from './engine/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('game-canvas');
    game.start();
});

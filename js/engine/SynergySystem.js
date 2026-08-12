// 타워 3종 간의 조합 및 시너지 연계 판정 모듈
import { statusSystem } from './StatusEffectSystem.js';

export class SynergySystem {
    static onGatlingHit(enemy, tower, particleSystem) {
        if (!enemy || enemy.hp <= 0) return;

        // 1. Frost + Gatling -> Shatter Vulnerability
        if (statusSystem.hasEffect(enemy, 'Chilled') || statusSystem.hasEffect(enemy, 'Frozen')) {
            statusSystem.applyEffect(enemy, 'Shattered', 3.0, 0.5);
            particleSystem.addFloatingText(enemy.x, enemy.y - 10, 'SHATTERED!', '#00ffaa', 11);
        }

        // 2. Gatling + Cannon 준비 -> Marked 표식 누적
        enemy.gatlingHits = (enemy.gatlingHits || 0) + 1;
        if (enemy.gatlingHits >= 4 && !statusSystem.hasEffect(enemy, 'Marked')) {
            statusSystem.applyEffect(enemy, 'Marked', 4.0, 1.6);
            particleSystem.addFloatingText(enemy.x, enemy.y - 12, 'MARKED!', '#ffd166', 11);
        }
    }

    static processCannonHit(enemy, baseDamage, baseSplashRadius, enemyList, particleSystem) {
        let finalDamage = baseDamage;
        let finalSplash = baseSplashRadius;

        if (!enemy) return { finalDamage, finalSplash };

        // 1. Frost + Cannon -> Cryo Explosion (둔화 적에게 포탄 명중 시 폭발 범위 확대 & 주변 적들에게 추가 둔화 적용)
        if (statusSystem.hasEffect(enemy, 'Chilled') || statusSystem.hasEffect(enemy, 'Frozen')) {
            finalSplash *= 1.5;
            particleSystem.addShockwaveRing(enemy.x, enemy.y, finalSplash, 'rgba(0, 210, 255, 0.8)');
            particleSystem.addFloatingText(enemy.x, enemy.y - 15, 'CRYO EXPLOSION!', '#00d2ff', 12);

            // [P3 수정] 폭발 반경 내 주변 적들에게도 둔화(Chilled) 부여!
            if (enemyList) {
                for (const other of enemyList) {
                    if (other.active && other.hp > 0 && Math.hypot(other.x - enemy.x, other.y - enemy.y) <= finalSplash) {
                        statusSystem.applyEffect(other, 'Chilled', 2.0, 0.4);
                    }
                }
            }
        }

        // 2. Gatling + Cannon -> Marked 표식 대상 폭발 피해 +60% 추가
        if (statusSystem.hasEffect(enemy, 'Marked')) {
            finalDamage *= 1.6;
            particleSystem.addFloatingText(enemy.x, enemy.y - 20, 'CRITICAL MARK!', '#ff4757', 13);
            statusSystem.removeEffect(enemy, 'Marked');
            enemy.gatlingHits = 0;
        }

        return { finalDamage, finalSplash };
    }
}

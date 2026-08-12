// 타워 3종 간의 조합 및 시너지 연계 판정 모듈
import { statusSystem } from './StatusEffectSystem.js';

export class SynergySystem {
    // Gatling 사격 시 시너지 판정
    static onGatlingHit(enemy, tower, particleSystem) {
        if (!enemy || enemy.hp <= 0) return;

        // 1. Frost + Gatling -> Shatter Vulnerability
        if (statusSystem.hasEffect(enemy, 'Chilled') || statusSystem.hasEffect(enemy, 'Frozen')) {
            // Shattered 디버프 부여 (3초간 가틀링 추가 데미지)
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

    // Cannon 명중 시 시너지 판정 (스플래시 반경 및 데미지 보정 계산)
    static processCannonHit(enemy, baseDamage, baseSplashRadius, particleSystem) {
        let finalDamage = baseDamage;
        let finalSplash = baseSplashRadius;

        if (!enemy) return { finalDamage, finalSplash };

        // 1. Frost + Cannon -> Cryo Explosion (둔화 적에게 포탄 명중 시 폭발 범위 확대 & 주변 추가 둔화)
        if (statusSystem.hasEffect(enemy, 'Chilled') || statusSystem.hasEffect(enemy, 'Frozen')) {
            finalSplash *= 1.5;
            particleSystem.addShockwaveRing(enemy.x, enemy.y, finalSplash, 'rgba(0, 210, 255, 0.8)');
            particleSystem.addFloatingText(enemy.x, enemy.y - 15, 'CRYO EXPLOSION!', '#00d2ff', 12);
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

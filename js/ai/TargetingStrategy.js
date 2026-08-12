// 타워 타겟팅 전략 패턴 (Strategy Pattern)

export class TargetingStrategy {
    static selectTarget(strategyType, towerPosition, range, candidateEnemies) {
        if (!candidateEnemies || candidateEnemies.length === 0) return null;

        // 1. 사거리 내에 있는 적 필터링
        const inRange = candidateEnemies.filter(enemy => {
            if (!enemy.active || enemy.hp <= 0) return false;
            const dist = Math.hypot(enemy.x - towerPosition.x, enemy.y - towerPosition.y);
            return dist <= range;
        });

        if (inRange.length === 0) return null;

        // 2. 전략에 따른 타겟 선택
        switch (strategyType) {
            case 'Last':
                // Base까지 남은 거리(pathIndex)가 가장 많이 남은 적
                return inRange.reduce((prev, curr) => (curr.getDistanceToBase() > prev.getDistanceToBase() ? curr : prev));

            case 'Strongest':
                // 현재 HP가 가장 높은 적
                return inRange.reduce((prev, curr) => (curr.hp > prev.hp ? curr : prev));

            case 'Weakest':
                // 현재 HP가 가장 낮지만 살아있는 적
                return inRange.reduce((prev, curr) => (curr.hp < prev.hp ? curr : prev));

            case 'Fastest':
                // 이동 속도가 가장 빠른 적
                return inRange.reduce((prev, curr) => (curr.currentSpeed > prev.currentSpeed ? curr : prev));

            case 'First':
            default:
                // Base까지 남은 거리(pathIndex)가 가장 적게 남은 적 (기본값)
                return inRange.reduce((prev, curr) => (curr.getDistanceToBase() < prev.getDistanceToBase() ? curr : prev));
        }
    }
}

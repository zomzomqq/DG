// 상태 효과 및 디버프 관리 시스템

export class StatusEffectSystem {
    constructor() {
        this.activeEffects = new Map(); // targetId -> Array of effects
    }

    applyEffect(target, effectType, duration, value = 0) {
        if (!target || !target.id) return;

        let targetEffects = this.activeEffects.get(target.id);
        if (!targetEffects) {
            targetEffects = [];
            this.activeEffects.set(target.id, targetEffects);
        }

        const existing = targetEffects.find(e => e.type === effectType);
        if (existing) {
            existing.duration = Math.max(existing.duration, duration);
            // [P2 2차 수정] 강한 효과 유지 정책으로 복원 (Cannon Cryo Explosion 등이 상위 디버프를 덮어쓰지 않음)
            existing.value = Math.max(existing.value, value);
        } else {
            targetEffects.push({
                type: effectType,
                duration,
                value,
                maxDuration: duration
            });
        }
    }

    // 잔량을 직접 명시적으로 갱신해야 하는 경우 (예: 쉴드 데미지 흡수 차감)
    setEffectValue(target, effectType, value) {
        if (!target || !target.id) return;
        const targetEffects = this.activeEffects.get(target.id);
        if (targetEffects) {
            const existing = targetEffects.find(e => e.type === effectType);
            if (existing) {
                existing.value = value;
            }
        }
    }

    removeEffect(target, effectType) {
        if (!target || !target.id) return;
        const targetEffects = this.activeEffects.get(target.id);
        if (targetEffects) {
            const index = targetEffects.findIndex(e => e.type === effectType);
            if (index !== -1) {
                targetEffects.splice(index, 1);
            }
        }
    }

    hasEffect(target, effectType) {
        if (!target || !target.id) return false;
        const targetEffects = this.activeEffects.get(target.id);
        return targetEffects ? targetEffects.some(e => e.type === effectType) : false;
    }

    getEffectValue(target, effectType) {
        if (!target || !target.id) return 0;
        const targetEffects = this.activeEffects.get(target.id);
        if (!targetEffects) return 0;
        const found = targetEffects.find(e => e.type === effectType);
        return found ? found.value : 0;
    }

    update(dt) {
        for (const [targetId, effects] of this.activeEffects.entries()) {
            for (let i = effects.length - 1; i >= 0; i--) {
                const eff = effects[i];
                eff.duration -= dt;
                if (eff.duration <= 0) {
                    effects.splice(i, 1);
                }
            }
            if (effects.length === 0) {
                this.activeEffects.delete(targetId);
            }
        }
    }

    renderTargetBadges(ctx, target) {
        if (!target || !target.id) return;
        const effects = this.activeEffects.get(target.id);
        if (!effects || effects.length === 0) return;

        ctx.save();
        ctx.font = '10px sans-serif';
        let offsetX = -12;
        const offsetY = -target.size - 18;

        for (const eff of effects) {
            let icon = '';
            switch (eff.type) {
                case 'Chilled': icon = '❄️'; break;
                case 'Frozen': icon = '🧊'; break;
                case 'Marked': icon = '🎯'; break;
                case 'Shattered': icon = '💔'; break;
                case 'Shield': icon = '🛡️'; break;
                case 'EMP': icon = '⚡'; break;
                case 'Overheat': icon = '🔥'; break;
            }
            if (icon) {
                ctx.fillText(icon, target.x + offsetX, target.y + offsetY);
                offsetX += 12;
            }
        }
        ctx.restore();
    }
}

export const statusSystem = new StatusEffectSystem();

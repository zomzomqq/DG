// Shared tactical canvas drawing primitives.

export function polygonPath(ctx, cx, cy, radius, sides = 6, rotation = -Math.PI / 2, scaleY = 1) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = rotation + (Math.PI * 2 * i) / sides;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

export function drawCornerBrackets(ctx, x, y, width, height, length = 7, color = '#72e7ff', lineWidth = 1.5) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, y + length);
    ctx.lineTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.moveTo(x + width - length, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + length);
    ctx.moveTo(x + width, y + height - length);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width - length, y + height);
    ctx.moveTo(x + length, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + height - length);
    ctx.stroke();
    ctx.restore();
}

export function drawBolts(ctx, radius, count = 4, color = '#73838a', boltRadius = 1.2, rotation = Math.PI / 4) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const angle = rotation + (Math.PI * 2 * i) / count;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, boltRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

export function drawGlowOrb(ctx, x, y, radius, color, coreColor = '#f5fff8') {
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
    glow.addColorStop(0, coreColor);
    glow.addColorStop(0.28, color);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function drawSegmentedRing(ctx, cx, cy, radius, segments, color, lineWidth = 2, rotation = 0, fillCount = segments) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    const step = (Math.PI * 2) / segments;
    const gap = Math.min(0.13, step * 0.24);
    for (let i = 0; i < Math.min(fillCount, segments); i++) {
        const start = rotation + i * step + gap;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, start + step - gap * 2);
        ctx.stroke();
    }
    ctx.restore();
}

export function drawTacticalBar(ctx, x, y, width, height, ratio, color, track = 'rgba(3, 7, 8, 0.8)') {
    const clamped = Math.max(0, Math.min(1, ratio));
    ctx.save();
    ctx.fillStyle = track;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * clamped), Math.max(1, height - 2));
    ctx.strokeStyle = 'rgba(220, 238, 228, 0.22)';
    ctx.lineWidth = 0.75;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.restore();
}

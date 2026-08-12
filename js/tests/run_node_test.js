import { runSmokeTests } from './smoke_test.js';
import { runHttpSmokeCheck } from './http_smoke_test.js';

if (typeof window === 'undefined') {
    class MockElement {
        constructor() {
            this.style = {};
            this.classList = { add: () => {}, remove: () => {}, toggle: () => {} };
            this.innerHTML = '';
            this.innerText = '';
        }
        appendChild() {}
        addEventListener() {}
        removeEventListener() {}
        querySelectorAll() { return []; }
        getAttribute() { return null; }
        getContext() {
            return {
                clearRect: () => {},
                fillRect: () => {},
                strokeRect: () => {},
                beginPath: () => {},
                arc: () => {},
                fill: () => {},
                stroke: () => {},
                save: () => {},
                restore: () => {},
                translate: () => {},
                rotate: () => {},
                fillText: () => {},
                moveTo: () => {},
                lineTo: () => {},
                closePath: () => {}
            };
        }
    }

    global.window = {
        AudioContext: class {
            constructor() { this.state = 'running'; }
            createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
            createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
            createBufferSource() { return { connect: () => {}, start: () => {}, buffer: null }; }
            createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
            createBiquadFilter() { return { connect: () => {}, type: '', frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
            resume() {}
        },
        addEventListener: () => {},
        removeEventListener: () => {}
    };

    global.document = {
        getElementById: () => new MockElement(),
        querySelectorAll: () => [],
        createElement: () => new MockElement()
    };
}

async function main() {
    const httpOk = await runHttpSmokeCheck();
    const results = runSmokeTests();
    const hasFailures = results.some(r => r.status !== 'PASS') || !httpOk;

    if (hasFailures) {
        console.error("❌ Smoke Tests Failed!");
        process.exit(1);
    } else {
        console.log("✅ ALL SMOKE TESTS & HTTP ESM CHECKS PASSED SUCCESSFULLY!");
        process.exit(0);
    }
}

main();

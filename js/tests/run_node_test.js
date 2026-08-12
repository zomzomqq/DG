import { runSmokeTests } from './smoke_test.js';

// Mock DOM if running under Node.js
if (typeof window === 'undefined') {
    global.window = {
        AudioContext: class {
            constructor() { this.state = 'running'; }
            createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
            createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
            createBufferSource() { return { connect: () => {}, start: () => {}, buffer: null }; }
            createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
            createBiquadFilter() { return { connect: () => {}, type: '', frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
            resume() {}
        }
    };
}

const results = runSmokeTests();
const hasFailures = results.some(r => r.status !== 'PASS');

if (hasFailures) {
    console.error("❌ Smoke Tests Failed!");
    process.exit(1);
} else {
    console.log("✅ ALL SMOKE TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
}

// HTTP 로컬 서버 기반 정적 자산 및 ESM 모듈 제공 스모크 검증기
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export function runHttpSmokeCheck() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let reqPath = req.url === '/' ? '/index.html' : req.url;
            const filePath = path.join(rootDir, reqPath);

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                const ext = path.extname(filePath);
                let mime = 'text/html';
                if (ext === '.js') mime = 'application/javascript';
                else if (ext === '.css') mime = 'text/css';

                res.writeHead(200, { 'Content-Type': mime });
                res.end(data);
            });
        });

        server.listen(8088, async () => {
            console.log("🌐 Testing HTTP Static Asset & ESM Server Smoke Check on port 8088...");
            try {
                // Check index.html
                const indexRes = await fetch('http://localhost:8088/index.html');
                const htmlText = await indexRes.text();
                const indexOk = indexRes.status === 200 && htmlText.includes('<canvas id="game-canvas">') && htmlText.includes('type="module"');

                // Check js/main.js
                const mainRes = await fetch('http://localhost:8088/js/main.js');
                const mainText = await mainRes.text();
                const mainOk = mainRes.status === 200 && mainText.includes('import { Game }');

                // Check js/config.js
                const configRes = await fetch('http://localhost:8088/js/config.js');
                const configOk = configRes.status === 200;

                server.close();

                if (indexOk && mainOk && configOk) {
                    console.log("✅ HTTP Static Asset & ESM Server Smoke Check PASSED!");
                    resolve(true);
                } else {
                    console.error("❌ HTTP Static Asset & ESM Server Smoke Check FAILED!");
                    resolve(false);
                }
            } catch (err) {
                server.close();
                console.error("❌ HTTP Test Error:", err);
                resolve(false);
            }
        });
    });
}

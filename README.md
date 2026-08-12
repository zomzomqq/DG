# 🏰 Tactical Mound Defense (전술 둔덕 타워 디펜스)

객체지향(OOP) 및 모듈형 ES6 Architecture로 제작된 웹 기반 타워 디펜스 게임입니다.

---

## 🚀 실행 방법 (Quick Start)

### 1. Windows 원클릭 실행 (추천)
- `run_game.bat` 파일을 더블 클릭하여 실행합니다.
- 자동으로 로컬 웹서버(`http://localhost:8000`)가 구동되며 웹 브라우저가 열립니다.

### 2. VS Code Live Server 또는 터미널 실행
- VS Code의 **Live Server** 확장 프로그램을 사용하여 `index.html`을 실행합니다.
- 또는 터미널에서 아래 명령어로 로컬 서버를 실행합니다:
  ```bash
  python -m http.server 8000
  # 또는
  npx http-server -p 8000
  ```

> ⚠️ **주의 (ES Module 보안 정책)**  
> 브라우저의 모듈 보안 정책(CORS)으로 인해 `file:///` 경로로 `index.html`을 직접 더블 클릭하면 스크립트 로딩이 차단됩니다. 반드시 위와 같이 로컬 웹서버를 통해 접속해주시기 바랍니다.

---

## 🎮 주요 게임 특징

1. **둔덕(Mound) 타워 설치 & A* 최적 우회 경로 설계**:
   - 디펜스 타워는 솟아오른 둔덕 위에만 건설할 수 있습니다.
   - 둔덕을 추가 건설하면 적의 이동 경로가 실시간으로 변경되며 우회합니다 (완막 차단 자동 검증).
2. **지능형 적 AI (ThreatMap)**:
   - Scout, Shield, Boss 등 고급 적 유닛은 타워 위협도(`ThreatMap`)를 계산하여 위험 지역을 회피합니다.
3. **타워 3종 및 시너지 조합**:
   - **Gatling**: 고속 연사사격 (Frost 연계: `Shatter Vulnerability` 방어감소, Cannon 연계: `Marked` 표식)
   - **Cannon**: 광역 폭발 (Frost 연계: `Cryo Explosion` 범위 확대 & 주변 추가 둔화)
   - **Frost**: 광역 이동속도 둔화 (Blizzard 지속 오라 / Cryo 완전 동결)
4. **Lv3 특성 분기 업그레이드**:
   - Minigun(연사 예열), Railgun(관통 빔), Siege Cannon(대형 폭발), Cluster Cannon(자탄 분사), Blizzard, Cryo Freeze
5. **능동 전투 요소**:
   - **Overclock**: 한시적 공속 +60% 버스트 (Heat 100% 시 Overheat 리스크)
   - **Orbital Strike**: 지정 영역 초고화력 궤도 폭격
   - **Generator**: 지속 골드 생산 경제 건물

---

## 🧪 스모크 테스트 (Smoke Test)
Node.js 환경에서 아래 명령어로 automated smoke test suite를 구동할 수 있습니다:
```bash
node js/tests/run_node_test.js
```

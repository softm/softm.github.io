# gagyebu-api (dedicated Cloudflare Worker)

- Dedicated service API: `POST /api/apps/gagyebu/ledger`
- Own D1 binding: `gagyebu-db`
- Identity-only verification: `softm-hannun-account` service binding via `GET /api/apps/gagyebu/session`
- The account Worker never needs access to the dedicated D1 after cutover.
- Required secret: `GAGYEBU_LEDGER_KEY_V1` (must be the **same existing 32-byte base64 secret** as the old account Worker, or previously encrypted ledgers cannot be decrypted).
- Do **not** deploy/cut over until the secret is set and both PC/Android clients are switched and verified.
- CORS permits `https://softm.github.io` and Android local asset origin.
- No SMS/receipt raw content is sent to this Worker.


## 배포 및 데이터 이전 게이트 (2026-11-13)

- `.github/workflows/deploy-gagyebu-api.yml`은 **수동 workflow_dispatch 전용**이며 확인 문자열 `DEPLOY_GAGYEBU_API`를 요구한다. 소스 push만으로는 운영 Worker를 배포하지 않는다.
- `wrangler.jsonc`에 전용 D1 `gagyebu-db`의 ID가 설정되어 있지만, 이것만으로 실제 원격 스키마·데이터 이관·암호화 키 설정·운영 배포 성공을 증명하지 않는다.
- 운영 전환 전 기존 공통 D1의 세 장부 테이블과 revision/암호문 블록을 백업하고 신규 D1로 복제·검증한다. 마지막 동기화 중에는 기존 장부 쓰기를 일시 중단하여 데이터 유실을 막는다.
- 기존 장부를 읽으려면 `GAGYEBU_LEDGER_KEY_V1`의 **기존 값**이 필요하다. 새로 발급한 키로 교체해서는 안 된다.
- 배포 후 `GET https://gagyebu-api.softm.workers.dev/health`의 `ok` 및 `configured`를 확인하고, 기존 계정 Worker의 인증 검증과 실제 저장/조회/충돌 처리 테스트를 실시한다.
- 그다음 PC와 Android 클라이언트의 장부 요청 주소만 전용 API로 전환한다. 로그인/세션 발급은 계속 공통 계정 Worker에서 처리한다.
- 신규 API에 문제가 생기면 기존 공통 D1의 원본 테이블을 지우지 않고, 이전 주소로 복구할 수 있는지 확인한다. 양방향으로 쓰기가 발생했다면 revision 재조정 없이 단순 URL 복귀하지 않는다.
- 작업 완료 판정: **실제 D1 복사 검증 + 정상 배포 + 웹·Android 동일 계정 동기화 실증**. 이 절차가 완료되기 전까지는 '운영 전환 완료'로 표시하지 않는다.

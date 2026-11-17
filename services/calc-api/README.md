# calc-api

계산기 로그인 사용자의 계산 이력을 전용 D1 `calc-db`에 보관하는 Worker입니다.

- 인증: `softm-hannun-account` 서비스 바인딩의 `/api/apps/calc/session`
- 데이터: 사용자별 AES-GCM 암호화 스냅샷
- API: `GET`, `POST`, `DELETE /api/apps/calc/history`
- 허용 Origin: `https://softm.github.io`, `https://appassets.androidplatform.net`
- 필수 secret: 32바이트 base64url 값인 `CALC_HISTORY_KEY_V1`

로그인 자체로 기기 기록을 업로드하지 않습니다. 클라이언트가 사용자의 명시적 동기화 동의를 받은 뒤에만 `POST`를 호출해야 합니다.

## 최초 구성

1. `npx wrangler d1 create calc-db`
2. 반환된 database ID를 `wrangler.jsonc`에 반영
3. `npx wrangler d1 execute calc-db --remote --file schema.sql`
4. `npx wrangler secret put CALC_HISTORY_KEY_V1`
5. 공통 계정 Worker의 calc 세션 검증 경로 배포
6. `npx wrangler deploy`

운영 완료 판정에는 실제 로그인 계정으로 웹 저장, 다른 기기 복원, 충돌 재시도, 보관소 삭제 검증이 필요합니다.

# Softm Hannun Account (Cloudflare Workers + D1)

기존 Firebase `suiteAuth`·`suiteSocialAuth`를 대체하기 위한 **독립적인 신규 코드**. 기존 운영 시스템은 손대지 않음.

- [설계서](DESIGN.md)
- [API 스펙](SPEC.md)
- [DB 스키마](schema.sql)
- [기존 회원·암호문 이전 계획](MIGRATION.md)
- [수동 Cloudflare 배포 워크플로](../../.github/workflows/deploy-cloudflare-account.yml)

## 개발 절차
```bash
cd services/cloudflare-account
npm install
npm test
npm run check
npx wrangler d1 execute softm-hannun-account --local --file=schema.sql
npx wrangler dev --var PUBLIC_BASE_URL:http://localhost:8787
```

운영 전: wrangler.jsonc의 placeholder PUBLIC_BASE_URL을 배포될 실제 Workers 주소로 수정한다. Google·카카오·네이버 개발자 콘솔에 정확한 `PUBLIC_BASE_URL/auth/callback/{provider}` URL을 등록한다. 클라이언트 ID/secret은 `npx wrangler secret put ...`으로 등록한다. `ALLOW_NEW_REGISTRATIONS`는 기존 사용자 매핑 이관 전까지 false, `ENABLE_ACCOUNT_DELETION`도 마이그레이션 완결 전까지 false로 유지.

> D1 바인딩 자동 프로비저닝은 최근 Wrangler에서 지원하지만, 배포 후 반드시 실제 생성된 database ID·schema.sql 적용 결과를 확인할 것. 페이지는 Cloudflare Worker의 `/account`에서 제공하며 기존 계정 페이지는 그대로 둔다.

## GitHub에서 스테이징 배포하기

1. GitHub Actions `Deploy isolated Cloudflare account Worker`는 **수동 실행 전용**이다. 코드 검사 워크플로는 별도로 main push에서 자동 실행한다.
2. GitHub Environment `cloudflare-account-staging`에 Secret `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`와 Variable `SOFTM_ACCOUNT_PUBLIC_BASE_URL`을 설정한다. 토큰은 Cloudflare에서 Workers/D1 수정 최소 권한만 부여한다. 환경 설정이 완료되면 서비스 소스의 main 푸시에서 별도 스테이징 Worker가 자동 배포된다. 설정이 없으면 배포를 안전하게 건너뛴다. 토큰은 Cloudflare에서 Workers/D1 수정에 필요한 최소 권한만 부여한다.
3. Worker URL을 먼저 확정한다. Worker의 `PUBLIC_BASE_URL`과 실제 접속 Origin이 다르면 OAuth를 거부하도록 설계했다.
4. Actions → `Deploy isolated Cloudflare account Worker` → Run workflow → `DEPLOY_STAGING` 입력. 워크플로는 검사 후 별도 Worker 배포, D1 schema 적용, `/health` 확인을 실행한다.
5. Cloudflare에 OAuth Client ID/Secret 6개를 Worker Secret으로 설정하고 Google·카카오·네이버 콘솔에 각 `/auth/callback/{provider}`를 등록한다. 네이버 공개 검수가 완료되기 전에는 `NAVER_PUBLIC_ENABLED=false`.
6. `ALLOW_NEW_REGISTRATIONS=false`, `ENABLE_ACCOUNT_DELETION=false`로 유지하고 [MIGRATION.md](MIGRATION.md)에 따라 기존 UID·연결 해시를 이전한다. 탈퇴 API는 코드 레벨에서도 잠겨 있으며, `ENABLE_ACCOUNT_DELETION=true`만으로 활성화되지 않는다. 필요한 경우 스테이징 테스트 계정의 **해시값만** `ALLOWED_TEST_IDENTITY_HASHES_JSON`에 등록해 시범 로그인할 수 있다. 이 단계 전에는 실제 회원 로그인/탈퇴를 운영에 공개하지 않는다.
7. 로그인 시도 제한용 `RATE_LIMIT_SALT`를 충분히 긴 무작위 Worker Secret으로 등록한다(원본 IP 기록은 저장하지 않음). D1의 분당 연결·OAuth·교환 요청 제한과 Cloudflare 호출량 알림/WAF를 함께 설정한다.
8. 시범 앱 1개에만 opt-in SDK `src/client.mjs`를 사용한다. 기존 `shared/platform/v1/sdk.mjs`나 Android 인증 브리지는 아직 교체하지 않는다.

**주의:** Cloudflare Worker 페이지에 표시되는 UI는 신규 구현이며, 현재 URL `softm.github.io/account/`는 기존 Firebase 허브다. 두 시스템의 세션·회원 데이터를 검증 없이 섞으면 안 된다.

## 실제 운영 적용 및 검증

- 자동 검사: `cloudflare-account-check.yml`이 Node 단위 검사와 **로컬 Wrangler + D1 실제 통합 검사**를 수행한다. 로그인·PKCE·코드 재사용 방지·앱별 권한·암호화 저장·복호화·수정 충돌·페이지네이션·탈퇴 잠금·요청 횟수 제한을 테스트한다.
- 실 SNS OAuth: 개발자 콘솔 등록 + 실제 제공자 계정으로 성공·취소·동일 UID·공개 승인 범위를 수동 검증해야 한다. 자동화된 가짜 제공자 검사를 운영 실계정 테스트로 보고하지 않는다.
- GitHub Actions 스테이징 배포는 Cloudflare 자격증명과 Worker URL이 갖춰지면 실행된다. 이전 Firebase 배포 구성·기존 가입자·Android는 전혀 건드리지 않는다.

## 2026-11-11 D1 최초 배포 진단

- Cloudflare D1 `softm-hannun-account` 생성 확인. `wrangler.jsonc`에 실제 `database_id`와 `softm.workers.dev` 계정 주소를 반영했다.
- 최초 자동 배포는 인증정보·소스 테스트까지 통과했으나 Worker 생성 시 `binding DB of type d1 failed to generate [10021]`을 반환했다. D1 존재·계정 권한·일시적 플랫폼 오류 여부는 확인이 필요하다.
- 배포 워크플로를 `wrangler d1 info` → `schema.sql --remote` → `wrangler deploy` → `/health` 순서로 수정해 오류 위치를 분리했다.
- 스키마와 Worker가 실제 배포되고 `/health`가 200을 반환하기 전까지 배포 완료라고 보고하지 않는다.

## 상태
코드 구현 단계. Cloudflare 배포/도메인 등록/실제 SNS 로그인/운영 Firebase 데이터 이전은 **미완료**. 현재 Firebase용 공통 SDK와 Android 앱은 이 신규 서버를 자동 사용하지 않는다. 기존 앱을 일괄 전환하면 안 된다.

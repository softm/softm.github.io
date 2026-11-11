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
2. GitHub Environment `cloudflare-account-staging`에 Secret `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`와 Variable `SOFTM_ACCOUNT_PUBLIC_BASE_URL`을 설정한다. 토큰은 Cloudflare에서 Workers/D1 수정에 필요한 최소 권한만 부여한다.
3. Worker URL을 먼저 확정한다. Worker의 `PUBLIC_BASE_URL`과 실제 접속 Origin이 다르면 OAuth를 거부하도록 설계했다.
4. Actions → `Deploy isolated Cloudflare account Worker` → Run workflow → `DEPLOY_STAGING` 입력. 워크플로는 검사 후 별도 Worker 배포, D1 schema 적용, `/health` 확인을 실행한다.
5. Cloudflare에 OAuth Client ID/Secret 6개를 Worker Secret으로 설정하고 Google·카카오·네이버 콘솔에 각 `/auth/callback/{provider}`를 등록한다. 네이버 공개 검수가 완료되기 전에는 `NAVER_PUBLIC_ENABLED=false`.
6. `ALLOW_NEW_REGISTRATIONS=false`, `ENABLE_ACCOUNT_DELETION=false`로 유지하고 [MIGRATION.md](MIGRATION.md)에 따라 기존 UID·연결 해시를 이전한다. 이 단계 전에는 실제 회원 로그인/탈퇴를 운영에 공개하지 않는다.
7. 시범 앱 1개에만 opt-in SDK `src/client.mjs`를 사용한다. 기존 `shared/platform/v1/sdk.mjs`나 Android 인증 브리지는 아직 교체하지 않는다.

**주의:** Cloudflare Worker 페이지에 표시되는 UI는 신규 구현이며, 현재 URL `softm.github.io/account/`는 기존 Firebase 허브다. 두 시스템의 세션·회원 데이터를 검증 없이 섞으면 안 된다.

## 상태
코드 구현 단계. Cloudflare 배포/도메인 등록/실제 SNS 로그인/운영 Firebase 데이터 이전은 **미완료**. 현재 Firebase용 공통 SDK와 Android 앱은 이 신규 서버를 자동 사용하지 않는다. 기존 앱을 일괄 전환하면 안 된다.

# Softm Hannun Account (Cloudflare Workers + D1)

기존 Firebase `suiteAuth`·`suiteSocialAuth`를 대체하기 위한 **독립적인 신규 코드**. 기존 운영 시스템은 손대지 않음.

- [설계서](DESIGN.md)
- [API 스펙](SPEC.md)
- [DB 스키마](schema.sql)

## 개발 절차
```bash
cd services/cloudflare-account
npm install
npm test
npm run check
npx wrangler d1 execute softm-hannun-account --local --file=schema.sql
npx wrangler dev
```

운영 전: wrangler.jsonc의 placeholder PUBLIC_BASE_URL을 배포될 실제 Workers 주소로 수정한다. Google·카카오·네이버 개발자 콘솔에 정확한 `PUBLIC_BASE_URL/auth/callback/{provider}` URL을 등록한다. 클라이언트 ID/secret은 `npx wrangler secret put ...`으로 등록한다. `ALLOW_NEW_REGISTRATIONS`는 기존 사용자 매핑 이관 전까지 false, `ENABLE_ACCOUNT_DELETION`도 마이그레이션 완결 전까지 false로 유지.

> D1 바인딩 자동 프로비저닝은 최근 Wrangler에서 지원하지만, 배포 후 반드시 실제 생성된 database ID·schema.sql 적용 결과를 확인할 것. 페이지는 Cloudflare Worker의 `/account`에서 제공하며 기존 계정 페이지는 그대로 둔다.

## 상태
코드 구현 단계. Cloudflare 배포/도메인 등록/실제 SNS 로그인/운영 Firebase 데이터 이전은 **미완료**. 현재 Firebase용 공통 SDK와 Android 앱은 이 신규 서버를 자동 사용하지 않는다. 기존 앱을 일괄 전환하면 안 된다.

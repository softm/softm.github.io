# Softm Hannun Account v1 — API 명세
2026-11-11 · 경로 기준: Worker URL `https://<worker-host>`

## 환경
`PUBLIC_BASE_URL`: 정확한 Worker origin (https만), `ALLOW_NEW_REGISTRATIONS`: 기본 false, `NAVER_PUBLIC_ENABLED`: 기본 false,
`ALLOWED_TEST_IDENTITY_HASHES_JSON`: 선택적 스테이징 테스트 계정 subject_hash 64자리 배열(JSON, 신규 전체 가입 개방 없이 지정 계정만 허용), `RATE_LIMIT_SALT`: Worker 비밀값으로 D1 요청 빈도 제한 해시 솔트,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: Wrangler secret.
`DB`: D1 binding. `SITE_ORIGINS_JSON`: 사이트별 원본 origin allowlist JSON, git에는 실서비스 목록만 포함 (선택 설정).
`ENABLE_ACCOUNT_DELETION`: 기본 false (기존 Firebase 완전 삭제 검증 전에는 켜지 않음).

## API
| 메서드/경로 | 인증 | 입력 | 반환/작용 |
|---|---|---|---|
| GET /health | 없음 | - | {ok, service, version, registrationLocked, providers:{google,kakao,naver}}, 비밀값 미출력 |
| GET /account | 쿠키 선택 | - | 계정 UI |
| GET /connect | 없음 | site, origin, challenge, request | 연결 요청 등록 + 쿠키/UI |
| GET /auth/:provider | 쿠키 선택 | mode=login/link | OAuth state 생성 및 공급자 이동 |
| GET /auth/callback/:provider | OAuth state 쿠키 | state, code | 제공자 확인 + 세션 생성 |
| GET /api/me | 쿠키 | - | id, name, avatar, consentVersion, providers |
| POST /api/consent | 쿠키 + Origin | {version:'2026-11-11',accepted:true} | 약관 동의 기록 |
| POST /api/logout | 쿠키 + Origin | {} | 현재 웹 세션 만료 |
| POST /api/connect/authorize | 쿠키 + Origin | {} | {code, site, origin, request} |
| POST /api/connect/exchange | 등록된 앱 Origin | {site,origin,code,verifier} | {accessToken,expiresIn} |
| GET /api/apps/:site/items | 앱 Bearer | limit(1~100), cursor | {items:[{id,revision,updatedAt}],cursor}, 암호문 반환하지 않음 |
| GET /api/apps/:site/items/:id | 앱 Bearer | - | {id,revision,payload} 또는 404 |
| PUT /api/apps/:site/items/:id | 앱 Bearer | {payload,expectedRevision} | {revision} |
| DELETE /api/apps/:site/items/:id | 앱 Bearer | {expectedRevision} | {deleted:true} |
| POST /api/apps/gagyebu/ledger | gagyebu 앱 Bearer | {op:'read',uid,known} 또는 {op:'write',uid,ledger,expected,epoch:null} | revision·epoch·ledger / conflict; 사용자별 암호화 D1 장부 |
| POST /api/account/delete | 쿠키 + Origin | {confirmation:'회원탈퇴'} | 기존 Firebase 전체 삭제가 구현되지 않아 서버에서 항상 503 잠금 |

## 계약
- `challenge`/`verifier`/request: base64url 형식 43자, 만료 5분(연결) / 1분(코드)
- 앱 session: 1시간 만료의 랜덤 bearer token; 서버 D1에는 해시만 저장
- 웹 세션: 7일 유효 HttpOnly Secure SameSite=Lax `__Host-sh_session`; 보안상 브라우저 별도 도메인 공유 로그인 쿠키에 의존하지 않음
- 모든 POST/PUT/DELETE 쿠키 API는 Worker origin 과 동일한 Origin 필수
- 앱 Bearer API는 Origin과 site의 등록 allowlist 일치 필수, Authorization 헤더 필요
- item ID: [A-Za-z0-9_-]{1,80}, payload: 암호화된 JSON **문자열** 최대 180000자, 복호화 서버 수행 금지
- optimistic concurrency: 새 항목 expectedRevision=0, 기존 저장 current revision 일치 시에만 revision+1
- 오류: JSON {error,message}, 400 validation, 401 unauthenticated, 403 forbidden, 404 not_found, 409 conflict, 429 rate_limited, 503 unavailable
- 허용되지 않은 제공자, 등록되지 않은 client origin, 다른 UID에 연결된 SNS는 거부
- 네이버 일반 사용자는 공개 승인 이전에 비활성(테스트 별도 환경)
- 데이터 이전 중 계정 생성 허용하지 않으며, 계정 탈퇴는 구형·신형 전체 데이터 삭제 원자성 확인 전까지 잠금


- SNS 하나의 공급자마다 계정별 연결 계정 최대 1개(UNIQUE user_id/provider). 두 번째 SNS 연결이 기존 대표 프로필을 덮어쓰지 않는다.
- D1 요청 제한(일반 인증 API와 별도): 1분/IP당 /connect 20회, /auth/:provider 10회, /api/connect/exchange 40회. 초과 429, 해시 버킷은 주기적 TTL 정리. Cloudflare WAF/rate limiting 추가 설정 권장.
- 로그인 허브 이전 가입 동의 버전(예: 20261029-1)을 그대로 복사해도 신규 동의 버전(2026-11-11)을 명시적으로 수락해야 사이트 인증을 발급한다.
- 로컬 개발의 127.0.0.1/localhost만 HTTP 허용하며 운영 PUBLIC_BASE_URL은 HTTPS와 실제 Worker Origin이 동일해야 한다.

## 가계부 전용 Cloudflare 서버 장부

- **활성화 조건:** Worker Secret `GAGYEBU_LEDGER_KEY_V1` = Base64 32바이트 원본 키. 미설정이면 해당 API 503, `GET /health`의 `features.gagyebuLedger=false`.
- 등록된 `gagyebu` 앱 토큰과 정확한 Origin `https://softm.github.io`가 모두 필요하다. 타 사이트 토큰 사용 금지.
- `read`: `{op:'read',uid,known:null|string}` → `{revision:string|null,epoch:null,ledger?:object}`. 알려진 revision과 같으면 ledger 미반환.
- `write`: `{op:'write',uid,ledger,expected:null|string,epoch:null}` → `{revision,epoch:null}` 또는 `{conflict:true,revision}`.
- `ledger`는 version 1, accounts/categories/transactions/events 배열, settings/budgets 객체. 3MiB 이하. SMS 원문, 영수증 이미지, 첨부경로와 Android 미확정 원문은 거부한다.
- HKDF(SHA-256, salt=UID, info='gagyebu-ledger-v1')로 계정별 AES-256-GCM 키를 생성한다. IV는 매 기록 시 난수, UID를 추가 인증 데이터로 사용한다. D1에는 암호문만 보관하며 최대 40개 불변 조각으로 저장한다.
- revision CAS로 다중 기기 동시 수정 충돌을 감지하며 오래된 조각은 2시간 이상 보관 후 Cron으로 안전 정리한다.
- 기존 Firebase 장부와 자동 UID 병합 또는 데이터를 자동 이동하지 않는다. Android 신규 브리지는 별도 구현 대상.
- **기존 키 교체/삭제 금지:** 구형 암호문을 복호화할 수 없게 된다. Secret을 GitHub 코드/일반 변수/로그에 저장하지 않는다.

## 범위 밖
가계부 엔드투엔드 장부 이동, Android App Link 새 인증 handoff, R2 대용량 백업, 기존 Firestore 전수 덤프, 실제 SNS 제공자 승인/Cloudflare 배포는 별도 작업이며 준비되지 않았는데 완료로 보고하지 않는다.

## 음식한눈 Android (2026-11-13)
`foodhannun` 웹은 `https://softm.github.io` Origin으로 연결한다. Android 네이티브 브리지는 시스템 브라우저에서 OAuth 후 `https://softm.github.io/account/android/foodhannun/#request=...&code=...`의 짧은 승인 코드만 받아 `foodhannun://auth/callback` 딥링크로 전달한다. 앱은 기존 PKCE 검증값으로 서버에서 앱 전용 토큰을 교환하며 계정·레시피 데이터 자동 이관은 하지 않는다. 배포된 Worker의 `/client.js`, Android 새 빌드, 실제 SNS 로그인까지 별도 검증해야 운영 완료이다.

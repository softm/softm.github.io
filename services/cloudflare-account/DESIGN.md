# Softm Hannun Account — Cloudflare 전환 설계서
작성일: 2026-11-11 · 상태: 구현 초기 버전(기존 Firebase 운영 미변경)

## 1. 목적 및 경계
공통 SNS 회원가입·로그인·계정 연동·사이트 인증을 Cloudflare Workers + D1로 통합한다. SNS 사용자가 한눈·해요 앱을 가볍게 이용하는 것이 목표다.
기존 `softm.github.io/account/`와 Firebase Auth/Firestore를 즉시 철거하지 않는다. 신규 Worker의 독립 계정 UI(`/account`)로 검증한 다음 명시적으로 전환한다.
가계부 Android/PC 장부, 과거 보관소 암호문, 기존 Firebase UID/가입동의, 위로해요, 티맵자동실행의 기존 자료는 절대 자동 삭제·초기화·병합하지 않는다.

## 2. 구성
- 웹·Android 앱(각 Origin별 사이트 ID): 사이트 SDK에서 공통 계정 팝업 호출
- Worker: OAuth 시작·콜백·사용자 식별·계정 UI·서버 세션·사이트 일회용 인가코드·저장 API
- D1: users / identities / oauth_attempts / sessions / connect_intents / codes / site_sessions / items
- OAuth: Google OIDC(userinfo), Kakao, Naver 각각 제공자 자체 검증 후 고유 subject로 계정 식별. provider + subject의 SHA-256을 D1 매핑 키로 사용한다.
- R2: 대용량 암호화 백업의 *후속 단계*이며 v1 코드에서 미지원
- 기존 Firebase: 계정·가계부 데이터 전환 검증 전에는 운영 유지. 티맵자동실행 별도 Firestore 유지.

## 3. UX
로그아웃: Google/카카오/네이버 로그인 3버튼(네이버 승인 여부에 따른 비활성). 최초 로그인 후 동의만 간단히 요구.
로그인: 프로필 / 연결된 SNS / 다른 SNS 연결 / 로그아웃 / 회원탈퇴(이전 중 잠금). 서비스 목록·보관소 암호·수동 메모 입력은 계정 화면에서 제거.
각 앱의 데이터 백업/복원/동기화는 앱 안에 남긴다. 로그인 자체로 로컬 자료를 업로드하지 않는다.

## 4. 인증 시퀀스
1. 앱이 난수 verifier, challenge(SHA256), requestId를 생성하고 `/connect?site=...&origin=...&challenge=...&request=...` 팝업을 연다.
2. Worker는 site+origin allowlist 확인 후 connect_intents, HttpOnly `__Host-sh_connect` 세션을 만든다.
3. 공통 계정 UI에서 Google/카카오/네이버 로그인 선택. Worker는 단기 state+OAuth cookie를 저장하고 제공자로 302.
4. callback: state, OAuth cookie 확인 -> 토큰 교환 -> 제공자 프로필/subject 조회 -> identities 매핑 -> 사용자 세션 발급(원본 액세스 토큰 저장 금지).
5. UI에서 이용약관 동의 완료 후 `POST /api/connect/authorize`를 호출. Worker는 단기 일회용 code를 발급한다.
6. 팝업은 정확한 target origin에 `postMessage`하고, 앱은 `POST /api/connect/exchange`에 verifier+code+site+origin을 전송하여 앱 범위의 opaque bearer token을 획득한다.
7. 해당 앱만 `/api/apps/{site}/items/{key}`를 호출한다. 토큰 hash/만료/사이트가 검증된다.
안드로이드는 별도 검증된 App Link handoff 설계/구현 후에만 새 백엔드 연결(현재 신규 Worker에서는 웹 팝업만).

## 5. 보안 원칙
- 임의 redirect_uri 차단: 서버의 OAuth callback 경로와 등록된 app Origin만 허용
- OAuth state와 SameSite=Lax HttpOnly Secure 쿠키·DB 만료 확인, state 1회 소진
- 일회용 code와 PKCE SHA256 확인; 코드 소비는 조건부 UPDATE로 원자화
- 서버 토큰은 저장 시 SHA-256 digest만 기록; 사용자 ID/토큰/코드/제공자 원본 응답을 로그에 남기지 않음
- 기존 사용자 이메일이 같아도 자동 계정 병합 금지; 사용자가 로그인 상태에서만 SNS 연결
- Cloudflare credential·SNS client secret·Worker secrets는 Git에 커밋 금지
- 쿠키 기반 변형 API는 동일 출처 Origin 검증; 다른 앱 Origin은 허용 범위의 bearer API만 접근
- `Content-Type`, 데이터 크기, itemId 형식, 인증 만료, 사이트 범위를 검증하고 기본 거부
- 운영에선 Cloudflare WAF/Rate Limiting 설정을 별도로 추가해야 함(코드 내 제한으로 보장하지 않음).

## 6. 기존 계정·자료 이전 (필수 승인 게이트)
- Firebase Auth 사용자 UID, Google providerData의 subject, _suiteIdentities 문서 ID(hash(provider+':'+subject))와 uid, _suiteMemberships 동의 기록을 **읽기 전용으로 추출**하여 D1로 이관
- 과거 hash를 그대로 D1 identities.subject_hash에 저장해 SNS 식별자를 서버 밖으로 내보내지 않음
- D1 users.id = Firebase UID 유지, nickname/이미지/약관 버전 이관; 같은 이메일을 근거로 합치지 않음
- 기존 users/{uid}/sites 데이터 암호문을 복원 없이 이동 시 UID/siteId/itemId 기반 AES-GCM AAD 일관성 유지(보관소 스키마 변환은 별도)
- 매핑 누락·기존 사용자와 충돌 시 자동 새 계정 생성하지 않도록 ALLOW_NEW_REGISTRATIONS=false로 검증
- 가계부 ledger는 현재 Firebase 서버 암호 방식·단말 동기화 프로토콜이 다르므로 v1 Worker items API에 직접 넣지 않음
- UID 정합성, 계정별 항목 수/체크섬/복호화 검사, 신규 웹/Android 회귀 검증, 롤백 승인 후 기능별 cutover
- 회원탈퇴는 LEGACY_DELETE_READY가 확인되기 전까지 Worker에서 비활성. D1만 지우고 Firebase 자료를 남기는 불완전 탈퇴 방지

## 7. 배포와 롤백
별도 Workers dev 서브도메인에 배포 -> D1 migration -> Google/카카오 개발 계정 테스트 -> 인증 허브 연결(사이트 1개) -> 데이터 이관 -> 가계부 별도 단계 -> 운영 전환.
기존 `shared/platform/v1/config.json`는 절대 자동 교체하지 않는다. 롤백은 클라이언트 호출 base를 기존 suiteAuth로 복구; 삭제/서버 스키마 변경 없이 양 시스템 병행 검증.
비밀키/Cloudflare API 토큰/실제 OAuth 앱 리다이렉트 등록이 없으면 배포 및 실 로그인은 완료로 기록하지 않는다.

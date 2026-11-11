# Firebase → Cloudflare 계정 이전 실행 명세
2026-11-11 · **실제 Firebase 운영 데이터는 아직 이동하지 않음**

## 1. 절대 바꾸지 말 것
기존 `softm-hannun-api` Firebase 프로젝트, `suiteAuth`, `suiteSocialAuth`, Firestore `suite-v1`, Google/Kakao/Naver 개발자 키, 가계부 데이터, 티맵자동실행을 삭제·재설정하지 말 것.
기존 허브 `https://softm.github.io/account/` 및 기존 `shared/platform/v1/config.json`도 신규 서버 검증 전까지 변경하지 않는다.

## 2. 인증 ID 이전
1. Firebase Auth의 사용자 `uid`, `displayName`, `photoURL`, `providerData`를 권한 있는 환경에서 읽기 전용 내보내기
2. Firestore `_suiteMemberships/{uid}`의 동의 버전과 동의시각(초 단위), `_suiteIdentities/{subjectHash}`의 uid/provider를 가져오기
3. Google은 Firebase `providerData` 중 `providerId=google.com`의 `uid`를 subject로 보고 `sha256('google:'+subject)`를 만든다.
4. Kakao/Naver는 기존 `_suiteIdentities` 문서 **ID**가 `sha256('kakao:'+subject)`, `sha256('naver:'+subject)`이므로 그대로 사용한다. 이메일·닉네임 일치만으로 병합하지 않는다.
5. 동일 uid에 여러 provider 연결을 유지한다. 같은 해시가 서로 다른 UID에 중복 귀속되면 이전을 중단하고 조사한다.
6. `ALLOW_NEW_REGISTRATIONS=false` 상태로 D1에 먼저 적재하고 기존 Google/Kakao 사용자로 로그인하여 원래 UID 복귀 확인

## 3. 안전한 입력 파일 형식
실사용 데이터와 키를 Git에 올리지 않는다. 아래 구조로 **별도 비공개 JSON**을 만든다.
```json
{
  "users": [{
    "uid": "EXAMPLE_UID_12345",
    "displayName": "예시",
    "photoURL": "",
    "consentVersion": "20261029-1",
    "consentAt": 1790000000,
    "identities": [
      { "provider": "google", "subject": "EXAMPLE_GOOGLE_SUBJECT" },
      { "provider": "kakao", "subjectHash": "64자리-실제-hash를-별도-입력" }
    ]
  }]
}
```
두 identity 입력 방법은 택일: `subject`로 해시 계산하거나 `subjectHash`로 이미 계산된 64자리 hex를 넣는다. 입력 파일의 제공자 원본 subject·사용자 식별자는 보호 대상이다.
```bash
node scripts/prepare-migration.mjs --input legacy.secret.json --output migration-private.sql
# 검증 통과 후 승인된 작업자만
node scripts/prepare-migration.mjs --input legacy.secret.json --output migration-private.sql --emit
npx wrangler d1 execute softm-hannun-account --remote --file=migration-private.sql
```
데이터베이스 초기 스키마 `schema.sql` 적용 및 백업 이후에만 가져오며, 먼저 별도 staging D1에서 검증한다. 일부 기록만 추출한 상태에서 `ALLOW_NEW_REGISTRATIONS`를 true로 바꾸면 기존 회원 UID가 분리될 수 있으므로 금지한다.

## 4. 개인 암호문 데이터
기존 `users/{uid}/sites/{siteId}/items/{itemId}`의 `payload` 암호문, `revision`을 검증된 형태로 추출하고 `scripts/prepare-items.mjs`로 D1 SQL을 만든다.
복호화·평문 가공·salt/iv/ct 재생성 금지. AES-GCM 추가 인증 데이터가 `uid/siteId/itemId`이므로 이 셋을 절대로 바꾸면 안 된다.
백업 조각 경로 `backups/*/chunks/*`와 가계부 `privateSync`/장부는 이 v1 D1 items API 대상이 아니므로 **별도 이관 설계 전까지 Firebase에 유지**한다.

## 5. 검증표
| 검증 | 합격 조건 |
|---|---|
| 사용자 UID | Firebase 대비 D1 매핑 100%, 불일치 0 |
| SNS 연결 | 모든 공급자 해시 → 동일 UID, 중복 0 |
| 가입동의 | 버전·일시 보존, 이후 신규 동의 시 별도 기록 |
| 아이템 수 | UID/site별 레코드 수 동일 |
| 암호화 페이로드 | 체크섬 일치, 테스트 암호문의 복호화 성공 |
| 앱 세션 | 등록 Origin, site 범위, PKCE 재사용 차단 |
| Android 가계부 | 기존 Firebase/로컬 장부 보존, 신규 연결 별도 개발 |
| 탈퇴 | 신규·기존 원격 데이터 삭제 체계 완성 전 비활성 |

## 6. 전환
사이트 1개 시범 연결 → 사용자 데이터 대조 → 점진적 확대 → 기존 Firebase read-only 관찰 → 완전 전환 승인.
전환을 되돌릴 수 있도록 기존 계정 허브/SDK를 유지하고, 두 저장소 간 동시 쓰기를 허용하지 않는다.

# 한눈·해요 공통 회원가입·로그인과 사이트 데이터

2026-10-28 현재: Firestore `suite-v1`·보안 규칙·코어/SNS 인증 서버를 운영한다. Google·카카오·네이버가 동일 공통 계정에 연결되는 것을 실계정으로 확인했다. 네이버 일반 사용자 공개 검수는 미완료다. 사이트별 실제 기기 데이터의 암호화 저장·복원·현재 창 자동 저장을 추가했으며 [적용 계약과 이용 절차](INTEGRATIONS.md)를 따른다. 소스 구현·CI·운영 배포·실계정 검증은 각각 구분한다. 아래 날짜별 기록은 당시의 상태이며 현재 상태를 대신하지 않는다.

| 구성 | 위치 |
|---|---|
| 공통 계정·보관소 화면 | `/account/` |
| 브라우저 SDK | `/shared/platform/v1/sdk.mjs` |
| 공개 Firebase 설정 | `/shared/platform/v1/config.json` |
| 허용 사이트·Origin | `/shared/platform/v1/registry.json` |
| 인증 서버·보안 규칙 | `/services/suite-platform/` |
| Firebase 프로젝트 | `softm-hannun-api` (기존 Directions와 다른 코드베이스) |
| Firestore | `suite-v1`, Enterprise Native, `asia-northeast3`, 실시간 업데이트 |

## 2026-10-29 인증과 데이터 관리 분리

사이트 상단의 로그인·회원가입은 `site-account.mjs`가 제공한다. 보관소는 별도 링크이며 로그인 완료에 암호화 암호를 요구하지 않는다. 최초 SNS 인증은 인증 자격만 만든다. 허브의 필수 약관 동의 후 `/membership/register`가 공통 회원 프로필과 서버 전용 `_suiteMemberships`의 동의 버전·시각을 멱등 생성한다. `/session/authorize`는 가입 완료 여부를 확인한다. 이전 SNS 계정의 UID는 유지하고 첫 재로그인에서 가입 안내를 완료한다.

사이트 정책 API와 현재 전송 범위는 [INTEGRATIONS.md](INTEGRATIONS.md)를 따른다. 로그인 이벤트는 자료 저장·복원 명령이 아니다. 기존 SDK의 암호화 저장 계약과 위로해요 백업 형식은 유지한다.

## 계정과 데이터 범위

Google은 Firebase Auth, 카카오·네이버는 서버 authorization-code 검증 후 Firebase custom token을 사용한다. 이메일 문자열이 같다는 이유로 계정을 합치지 않는다. 계정 화면에서 로그인한 후 다른 제공자를 **명시적으로 연결**해야 동일 UID가 된다. 다른 UID에 이미 연결된 제공자는 409로 거절한다. 카카오·네이버 제공자 토큰은 프로필 ID 확인에만 사용하고 저장하지 않는다. SNS 로그인만으로 게시글·사진을 수집하지 않는다.

서로 다른 Origin의 localStorage는 공유되지 않는다. 공통 계정 허브가 각 사이트에 PKCE로 묶인 60초 일회용 인가 코드를 보내고, 해당 사이트가 교환하여 `suite_site` claim이 든 Firebase 토큰을 받는다. UID만 확인하는 규칙보다 한 단계 더 사이트 범위를 확인한다. 메시지는 정확한 opener·Origin·요청 ID로 검증하며 Firebase 토큰을 URL에 넣지 않는다. GitHub Pages 여러 경로는 같은 Origin이므로 브라우저 격리 경계가 아니다. 각 사이트 로그인은 허브의 명시적 연결 버튼을 거치며, 강한 브라우저 코드 격리가 필요하면 별도 도메인을 사용한다.

| 데이터 | Firestore 경로 | 접근 |
|---|---|---|
| 사이트 가입·연결 메타데이터 | `users/{uid}/sites/{siteId}` | 본인만 읽기, 사이트 claim으로 쓰기 |
| 즐겨찾기·개인 메모·설정 등 | `users/{uid}/sites/{siteId}/items/{itemId}` | 본인 + 해당 사이트 claim |
| 암호화 백업 | `users/{uid}/sites/{siteId}/backups/{backupId}` | 본인 + 해당 사이트 claim |
| 백업 조각 | 위 경로 아래 `chunks/{index}` | 위와 동일, 생성 후 수정 불가 |
| SNS ID 매핑·일회용 인가 코드 | `_suiteIdentities`, `_suiteOAuth`, `_suiteCodes` | 서버 전용 |

공통 SDK는 저장 전에 PBKDF2(310,000)/AES-GCM으로 암호화한다. 보관소 암호는 서버로 보내지 않으며 Firebase 로그인 암호와 별개다. UID/site/item을 AES-GCM additionalData에 묶는다. 위로해요는 기존 보관함 암호화 형식 그대로 백업한다. 원격 분석·성격 추정·사이트 간 기록 열람은 포함하지 않는다.

## 사이트에서 사용

```js
import {createSiteClient} from 'https://softm.github.io/shared/platform/v1/sdk.mjs';
const account = await createSiteClient({siteId:'weatherhannun'});
// 버튼의 click 핸들러에서 호출 (팝업 허용에 필요)
loginButton.onclick = () => account.login();
// 암호 입력 UI에서 받은 password를 사용. localStorage에 암호를 보관하지 않는다.
const revision = await account.put('favorite-locations', {locations:[]}, {
  password, expectedRevision:0 // 새 항목. 수정 시 get()으로 읽은 revision 사용
});
const saved = await account.get('favorite-locations', {password});
await account.put('favorite-locations', {locations:[]}, {
  password, expectedRevision:saved.revision
});
```

ID는 영문·숫자·`_`·`-` 1~80자. `list()`는 복호화하지 않은 항목 ID·버전·저장시각만 반환하며 커서를 지원한다. 항목당 암호화 문자열 180,000자 제한. 큰 백업은 160,000자 조각으로 분할하고 마지막에 `complete`로 커밋한다. 업로드 미완료 스냅샷은 복원하지 않는다. 다운로드 시 총 길이·SHA-256 검증 뒤 앱 자체 AES-GCM 검증을 통과해야 복원한다. 백업 한도 80MiB. 백업 목록은 최근 20개씩 조회한다. 삭제는 조각부터 처리한다. 계정 삭제에 따른 전체 하위 컬렉션 정리는 별도 서버 작업이 필요하다.

Core 쿼리/트랜잭션을 사용하는 이유: 오프라인 우선 클라이언트의 항목 메타데이터 캐시와 기존 QuerySnapshot 커서 계약을 유지하기 위해서다. 암호문에 서버 검색·집계를 적용하지 않으며 위로해요 분석은 기기 안에서 수행한다.

## 운영 연결

Google 제공자 활성화, Firebase Auth 허용 도메인에 계정 허브 호스트(`softm.github.io`)를 추가한다. SDK 공개 설정은 비밀키가 아니다. Admin 키·OAuth Client Secret은 공개 저장소에 넣지 않는다.

코어만 배포:

```bash
bash services/suite-platform/deploy-core.sh
```

이 명령은 인증된 Firebase CLI가 있는 환경에서 실행한다. 기존 `directions` 코드베이스나 다른 Firebase 프로젝트의 규칙은 덮어쓰지 않는다. Functions 런타임이 커스텀 토큰을 서명할 수 있어야 한다. 기본 자격증명의 signBlob 권한이 없을 때는 **실제 런타임 서비스 계정 자체에 필요한 Token Creator 범위만** 검토하며 프로젝트 전체에 임의로 부여하지 않는다.

카카오·네이버 운영 설정:

| 제공자 | 등록값 | 서버 비밀 |
|---|---|---|
| 카카오 | REST API 앱 키 `SUITE_KAKAO_CLIENT_ID` | `SUITE_KAKAO_CLIENT_SECRET` |
| 네이버 | 로그인 앱 Client ID `SUITE_NAVER_CLIENT_ID` | `SUITE_NAVER_CLIENT_SECRET` |
| 공통 callback | `https://asia-northeast3-softm-hannun-api.cloudfunctions.net/suiteSocialAuth/oauth/callback` | URL에 비밀키를 넣지 않음 |

제공자 Client ID는 `functions/.env.softm-hannun-api`에서, Secret은 Firebase Secret Manager에서 설정한다. 값 등록 후 같은 환경 파일에 `SUITE_ENABLE_SOCIAL=true`를 설정하고 `functions:suite-platform:suiteSocialAuth`만 배포한다. 코어 배포는 이 플래그 없이 수행하므로 미등록 SNS 비밀값을 요구하지 않는다. `/oauth/start`→제공자 인증→callback→허브 PKCE exchange 순서로 실계정 검증한 뒤에만 공개 config의 해당 provider를 true로 바꾼다. 개발자 앱의 서비스 URL·동의항목·공개 심사도 확인해야 한다. 키가 없으면 버튼은 준비 중 상태를 유지한다.

일회용 코드 두 컬렉션은 `expiresAt` TTL 정책을 운영에서 설정해 누적을 방지한다(만료된 코드는 TTL 삭제 전에도 사용할 수 없다). HTTP 요청당 최대 크기, 40req/min/인스턴스별 IP hash 제한, maxInstances=2를 적용했다. IP는 메모리에서만 hash로 사용하며 분산형 전역 요율 제한은 아니다. 공개 운영 확대 전 App Check·정교한 남용 제한·비용 모니터링을 검토한다.

## 검증

`npm test`: PKCE·코드 만료/재사용·정확한 Origin·암호문 무결성 검증.
`npx -y firebase-tools@latest emulators:exec --project demo-softm-suite --only firestore 'npm run test:rules'`: 비로그인·타 사용자·다른 사이트·잘못된 스키마·업데이트 우회·백업 상태·조각 변경·목록 쿼리 검증. Java 21 필요. 에뮬레이터가 Standard로 실행되므로 실제 Enterprise의 쿼리/인덱스와 로그인은 배포 후 별도 검증한다.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for owner-only data, site-scoped tokens, strict field validation, immutable ownership and bounded encrypted payloads. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## 적용 범위와 남은 작업

현재 웹 적용 현황과 각 저장소 PR·배포·실계정 검증 근거는 [INTEGRATIONS.md](INTEGRATIONS.md)에 기록한다. 새 어댑터 13개와 기존 위로해요 웹 어댑터는 운영에 반영했고, 설계해요는 소스와 검사 완료 후 실제 Sites 배포가 남아 있다. 위로해요 웹의 선택적 암호화 백업·복원·이번 세션 중 자동 백업 어댑터는 유지한다. Android 현재 패키지는 인터넷 권한 없는 오프라인 앱이므로 원격 SDK를 임의로 허용하지 않는다. Android 공통 로그인은 외부 브라우저 인증 + 안전한 앱 링크 + 네이티브 Firebase bridge 작업이 별도로 필요하다.

노른·경매한눈·사업자한눈의 기존 계정과 UID는 자동 합치지 않는다. 현재 작업공간을 명시적으로 열어 암호화 백업한 뒤 기기 모드의 새 사본으로 복원한다. 계정 자체를 합치는 마이그레이션은 포함하지 않는다. 사이트별 즐겨찾기·메모·설정의 저장 범위와 선택적 현재 창 자동 저장은 각 어댑터에 연결했다. 위로해요 앱이 종료된 동안의 자동 위로 알림·백그라운드 분석은 이 공통 인증/보관소 모듈과 별개의 남은 앱 작업이다.

공식 참고: [Firebase custom auth](https://firebase.google.com/docs/auth/web/custom-auth), [Google](https://firebase.google.com/docs/auth/web/google-signin), [카카오](https://developers.kakao.com/docs/ko/kakaologin/rest-api), [네이버](https://developers.naver.com/docs/login/api/api.md).

## 2026-10-27 운영 검증

- Google 로그인 성공. 사이트 세션 교환의 `auth/insufficient-permission` 원인은 런타임 자체 서명 권한 누락이었다. 기본 Compute 서비스 계정 자체 리소스에만 Token Creator 역할을 적용했다. 프로젝트 전체 IAM 역할은 추가하지 않았다.
- 카카오·네이버 비밀키는 Secret Manager에만 저장했다. 공개 저장소와 웹 설정에는 포함하지 않는다.
- 네이버 로고·실제 로그인 화면을 첨부하는 공개 검수 절차가 남아 있다. 공개 검수 완료로 표시하지 않는다.

### 실계정 확인 결과와 재개 지점

| 항목 | 확인 결과 |
|---|---|
| Google 로그인 | 운영 계정으로 성공 |
| 사이트 토큰 교환 | 런타임 자체 서명 권한 적용 후 성공 |
| Firestore 보관소 | 위로해요 사이트의 가상 메모 `suite-e2e-20261027` 암호화 저장·목록 조회·복호화 성공. 실제 개인 기록을 사용하지 않음 |
| 카카오 | 회원번호만 요청하는 동의 화면과 공통 허브 복귀 확인. 추가한 연결 수단 목록에서 최종 연결 상태 확인 필요 |
| 네이버 | 이용자 식별자만 요청하는 동의 화면 확인. callback에서 `provider-login-failed` 확인, 공개 버튼 비활성화 |
| 자동 검사 | 인증·암호화 4개와 Firestore 보안 규칙 6개 통과, GitHub Actions 성공 |

네이버는 공개 검수 신청 전 로고 등록과 실제 로그인 화면 첨부가 필요하다. 브라우저 파일 업로드가 반영되지 않았으며, 최종 확인 도중 연결된 브라우저 접근이 끊겼다. 공개 검수 접수·승인 완료로 보고하지 않는다.

네이버 재개 절차:
1. `functions/index.mjs`의 추가 진단 코드를 Cloud Shell에서 배포한다. 현재 GitHub에만 반영된 `suite-provider-failure` 로그는 제공자와 허용한 오류 코드만 남기며, 토큰·UID·개인정보·제공자 원문은 기록하지 않는다.
2. 개발자 콘솔의 실제 Client Secret과 Secret Manager 저장값을 외부에 노출하지 않고 검증한다. 임의 키 재발급·교체는 하지 않는다.
3. 토큰 교환 및 기존 공통 UID 보관소 복원을 확인한 뒤 `providers.naver`를 활성화한다. 검수 전에는 개발회원 범위임을 표시한다.
4. 네이버 로고·실제 동의/로그인 완료 화면을 첨부하고 공개 검수를 신청한다.

가상 검증 메모만 생성했으며 사용자 기존 데이터는 삭제하지 않았다. 위로해요 Android bridge·백그라운드 위로 알림, 각 사이트 고유 데이터의 저장 이벤트 연결은 별도의 남은 작업이다.

### 2026-10-27 재개 작업 — 로그인 실패 복귀와 진단 보강

이 변경은 별도 브랜치에서 준비했으며 아직 운영 반영·실계정 재검증 전이다.

- 네이버·카카오 토큰 교환의 HTTP 오류와 HTTP 200 오류 응답을 함께 진단한다. 로그에는 제공자·단계·허용된 오류 코드·HTTP 상태만 남기며 비밀키·토큰·인가 코드·제공자 원문은 남기지 않는다.
- 서버에서 유효한 state를 선점한 뒤 로그인 취소·제공자 오류가 발생하면 해당 요청을 실패 처리하고 고정된 계정 허브로 돌려보낸다. 실패한 요청은 로그인 토큰으로 교환할 수 없다.
- 허브는 기존 세션의 state와 PKCE verifier가 일치할 때만 복귀를 처리하고, 원래 사이트 연결 요청을 복구한다. 실패 안내 후 기존 로그인 세션과 로그인 버튼을 사용할 수 있다.
- `npm test`: 인증·암호화·오류 복귀 검사 총 9개 통과. 변경한 서버·허브 소스 구문 검사 통과. 이번 변경에서는 Firestore 규칙을 수정하지 않았다.

남은 운영 확인: 기존 작업 중지 및 브라우저 제어권 확보 → 이 변경 병합·SNS 서버 배포 → 새 네이버 로그인으로 안전한 오류 코드 확인 → 등록 설정 일치 여부 확인 → 카카오 최종 연결·위로해요 백업 검증. 네이버 토큰 오류 해결이나 공개 검수 완료로 간주하지 않는다.

## 2026-10-28 사이트별 저장 기능 확장

중앙 SDK에 사이트별 allowlist 스냅샷·개인 메모·암호화 저장/복원 UI·버전 충돌 방지·최근 5개 보존을 구현했다. GitHub 저장소 13개에 실제 저장 계약을 연결했으며, 설계해요 GitHub 소스에는 프로젝트 기록의 새 사본 복원을 추가했다. 설계해요 Sites 배포는 실행 환경 부재로 미완료이며 기존 공개 범위는 유지한다.

실계정: Google 재로그인 후 네이버를 기존 Google·카카오 공통 UID에 연결했고 허브에 세 제공자가 함께 표시되는 것을 확인했다. 오래된 로그인 상태에서 연결할 때 필요한 재로그인 안내를 보강했다. 일반 사용자 네이버 검수는 별도다. 운영 사이트별 화면·배포 확인은 후속 기록으로 남긴다.


## 2026-10-28 로그인 팝업 동선 보완

사이트에서 연 로그인 팝업은 연결 대상과 현재 계정의 연결 버튼을 첫 화면에 표시한다. 기존 계정 연결은 버튼을 눌러 명시적으로 동의하며, Google 로그인 또는 카카오 OAuth를 직접 선택한 경우에는 로그인 완료 후 원래 사이트의 연결까지 이어 간다. 정확한 Origin·opener·요청 ID·PKCE 검증은 유지한다. 새 로그인 시 이전 시도의 닫힘·만료 안내를 지우고 현재 진행 상태를 표시한다.

네이버는 공개 승인 전이므로 일반 화면에서 `네이버 로그인 · 승인 대기`로 표시하고 사용할 수 없게 한다. 등록된 테스트 계정의 점검은 `https://softm.github.io/account/?naver-test=1`에서 수행한다. 이 옵션은 테스트용 화면만 열며 NAVER Developers의 테스트 계정 제한이나 서버의 인증·연결 검증을 해제하지 않는다. 공개 승인 완료 상태로 보고하지 않는다.

`tests/account-handoff-ui.cjs`는 서로 다른 Origin의 실제 허브·SDK·보관소를 열어 연결 버튼의 첫 화면 노출, 취소 후 재시도, Google 로그인 후 자동 연결, 기존 계정의 명시적 동의, 카카오 OAuth 복귀, PKCE 교환, 잘못된 Origin 거부를 검사한다. 인증·DB 응답만 합성하며 실제 사용자 계정은 사용하지 않는다.


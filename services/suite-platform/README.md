# 한눈·해요 공통 계정과 사이트별 보관소

2026-10-27 구현. 중앙 소스: `softm/softm.github.io`.

| 구성 | 위치 |
|---|---|
| 공통 계정·보관소 화면 | `/account/` |
| 브라우저 SDK | `/shared/platform/v1/sdk.mjs` |
| 공개 Firebase 설정 | `/shared/platform/v1/config.json` |
| 허용 사이트·Origin | `/shared/platform/v1/registry.json` |
| 인증 서버·보안 규칙 | `/services/suite-platform/` |
| Firebase 프로젝트 | `softm-hannun-api` (기존 Directions와 다른 코드베이스) |
| Firestore | `suite-v1`, Enterprise Native, `asia-northeast3`, 실시간 업데이트 |

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

제공자 Client ID는 `functions/.env.softm-hannun-api`에서, Secret은 Firebase Secret Manager에서 설정한다. 값 등록 후 `functions:suite-platform:suiteSocialAuth`만 배포한다. `/oauth/start`→제공자 인증→callback→허브 PKCE exchange 순서로 실계정 검증한 뒤에만 공개 config의 해당 provider를 true로 바꾼다. 개발자 앱의 서비스 URL·동의항목·공개 심사도 확인해야 한다. 키가 없으면 버튼은 준비 중 상태를 유지한다.

일회용 코드 두 컬렉션은 `expiresAt` TTL 정책을 운영에서 설정해 누적을 방지한다(만료된 코드는 TTL 삭제 전에도 사용할 수 없다). HTTP 요청당 최대 크기, 40req/min/인스턴스별 IP hash 제한, maxInstances=2를 적용했다. IP는 메모리에서만 hash로 사용하며 분산형 전역 요율 제한은 아니다. 공개 운영 확대 전 App Check·정교한 남용 제한·비용 모니터링을 검토한다.

## 검증

`npm test`: PKCE·코드 만료/재사용·정확한 Origin·암호문 무결성 검증.
`npx -y firebase-tools@latest emulators:exec --project demo-softm-suite --only firestore 'npm run test:rules'`: 비로그인·타 사용자·다른 사이트·잘못된 스키마·업데이트 우회·백업 상태·조각 변경·목록 쿼리 검증. Java 21 필요. 에뮬레이터가 Standard로 실행되므로 실제 Enterprise의 쿼리/인덱스와 로그인은 배포 후 별도 검증한다.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for owner-only data, site-scoped tokens, strict field validation, immutable ownership and bounded encrypted payloads. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## 적용 범위와 남은 작업

사이트 registry는 공통 모듈의 연결 계약이며 전 사이트 기능 적용 완료 목록이 아니다. 위로해요 웹에는 선택적 암호화 백업·복원·이번 세션 중 자동 백업 어댑터를 연결했다. Android 현재 패키지는 인터넷 권한 없는 오프라인 앱이므로 원격 SDK를 임의로 허용하지 않는다. Android 공통 로그인은 외부 브라우저 인증 + 안전한 앱 링크 + 네이티브 Firebase bridge 작업이 별도로 필요하다.

NORN·경매한눈의 기존 Firebase 프로젝트/UID/기록은 자동 이전하지 않는다. 기존 인증 사용자와 새 UID 연결을 증명한 후에만 가져오는 마이그레이션이 필요하다. 사이트별 즐겨찾기·메모 저장 이벤트 연결도 각 사이트 구현에서 수행해야 한다. 위로해요 앱이 종료된 동안의 자동 위로 알림·백그라운드 분석은 이 공통 인증/보관소 모듈과 별개의 남은 앱 작업이다.

공식 참고: [Firebase custom auth](https://firebase.google.com/docs/auth/web/custom-auth), [Google](https://firebase.google.com/docs/auth/web/google-signin), [카카오](https://developers.kakao.com/docs/ko/kakaologin/rest-api), [네이버](https://developers.naver.com/docs/login/api/api.md).

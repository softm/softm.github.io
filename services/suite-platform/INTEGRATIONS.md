# 공통 보관소 실제 사이트 적용

2026-10-28 구현. 각 저장소의 진입 HTML에 `shared/platform/v1/boot.mjs?site=<siteId>`를 연결한다. 소스 구현, CI, 운영 배포, 실계정 검증은 별도 상태로 기록한다.

## 회원가입·로그인과 관리

1. 사이트 상단의 **로그인** 또는 **회원가입**을 누른다. Google·카카오를 선택한다. 네이버 일반 공개 승인은 별도다.
2. SNS 최초 인증 후 공통 회원가입 안내와 필수 동의를 완료한다. 기존 회원은 사이트로 돌아온다.
3. 사이트 로그인은 보관소 암호 없이 끝난다. 로그인 자체는 기기 데이터의 업로드·복원을 실행하지 않는다.
4. **내 보관소** 링크는 별도 백업·복원 관리 기능이다. 필요할 때만 보관소 암호와 저장·복원을 이용한다.
5. 저장 또는 복원 후 현재 관리 창의 자동 백업을 선택할 수 있다. 이는 사이트 기본 동기화 정책과 별개다.

## 사이트 정책 연결

`boot.mjs`는 공통 인증 컨텍스트와 별도 보관소를 구성한다. `window.SoftmAccounts.get(siteId)` 또는 `softm:account-ready` 이벤트의 `detail.account`로 접근한다. `currentUser`, `subscribe`, `ready`, `login`, `logout`, `registerPolicy`를 제공한다. 인증 상태를 기존 앱의 다른 Firebase 로그인 상태와 자동 합치지 않는다.

```js
const account = window.SoftmAccounts.get('goldsignal');
const stop = account.registerPolicy({
  id: 'goldsignal-preferences',
  onLogin(user, {siteId, client}) { /* 사이트가 정한 조회·동기화 시작 */ },
  onLogout() { /* 해당 사이트의 작업 중단·메모리 초기화 */ }
});
```

등록된 기본 정책은 **자동 데이터 전송 없음 / 선택적 암호화 백업**이다. 자동 동기화가 필요한 사이트는 데이터 종류, 저장 방식, 충돌 처리, 보관·삭제 범위를 정하고 자체 어댑터를 연결한다. 공통 모듈은 그 정책을 일괄 결정하지 않는다.

## 보관 방식

사이트별 allowlist의 값만 읽는다. 인증 토큰, 광고 식별자, 예보·공공데이터 캐시는 읽거나 전송하지 않는다. 개인 메모는 별도 사이트 키를 사용한다. 기기 상태를 AES-GCM으로 암호화한 불변 백업으로 업로드한 뒤 암호화된 `site-state-v1` head를 revision 조건부 트랜잭션으로 교체한다. 최근 5개만 유지한다. 불확실한 네트워크 실패에서는 업로드한 백업을 임의 삭제하지 않는다. 실패한 업로드의 미연결 백업 정리는 후속 서버 유지보수 대상으로 남는다.

원격 조회는 서버 확인을 요구한다. 복원 전 암호문·사이트·형식 검증과 사용자의 확인을 거치며, 확인 중 기기 내용이 바뀌면 중단한다. localStorage 쓰기 실패는 이전 값으로 롤백한다. 기존 다른 Firebase/ChatGPT 계정은 이메일로 합치지 않는다. 해당 작업공간을 명시적으로 연 상태에서 백업하고 기기 모드에 복원하거나 새 사본을 만드는 방식으로 이전한다.

## 사이트별 저장 계약

| 사이트 | 저장 범위 |
|---|---|
|날씨한눈 (`weatherhannun`)|저장한 지역·선택 위치·활동 설정·맞춤 설정|
|주유한눈 (`juyuhannun`)|찜한 주유소·유종·직접 저장한 최근 목적지|
|충전한눈 (`evchargingstation`)|관심 충전소|
|수소충전한눈 (`hydrogenstation`)|관심 수소충전소|
|음식한눈 (`foodhannun`)|저장한 레시피·장보기·최근 검색·개인 메모|
|맛집한눈 (`matjiphannun`)|즐겨찾기·방문기록·저장한 동네·검색 설정|
|금시그널 (`goldsignal`)|가격 표시 단위·목표가|
|계산기 (`calc`)|계산 기록·설정·계산노트|
|지원한눈 (`policyfundfinder`)|사업 프로필·관심사업·신청 준비·메모|
|돌봄한눈 (`homecare`)|유형별 담은 기관과 방문 순서|
|경매한눈 (`auctionhannun`)|현재 작업공간의 등록 사건·관심물건·체크·메모·조사 기록|
|사업자한눈 (`bizhannun`)|현재 작업공간의 거래처·사업 프로필·확인 기록|
|노른 (`norn`)|현재 프로젝트의 편집 설정·장면·SNS 문구 (원본 사진·영상 제외)|
|설계해요 (`seolgyehaeyo`)|현재 프로젝트의 의뢰·계약·일정·질문 기록 (원본 첨부파일 제외)|
|위로해요|기존 `cloud-adapter.mjs`의 앱 전용 암호화 백업·복원 유지|

`site-integrations.mjs`가 정확한 저장 키와 진입 대상을 정의한다. 노른은 원본 파일 바이트·경로를 보내지 않으며 편집 JSON만 저장한다. 설계해요는 원본 첨부를 제외한 프로젝트 기록을 저장한다. 경매·사업자·노른의 기존 계정 저장소는 자동 교체하지 않는다.

## 검증

`npm test`의 site-state 검사는 첫 연결 덮어쓰기 방지, 버전 충돌, 잘못된 사이트, 계정 변경, 복원 취소·확인 중 편집·저장 실패 롤백·5개 보존을 다룬다. GitHub Actions의 브라우저 검사는 합성 자료와 실제 Web Crypto를 사용해 UI 흐름과 320/390/1280px 표시를 검사한다. 합성 검사는 실제 SNS 계정 로그인이나 운영 사이트 전체 동작을 대신하지 않는다.

Enterprise `suite-v1`의 Core 트랜잭션과 기존 QuerySnapshot 계약을 유지한다. 기기 캐시를 사용하는 기존 앱 및 암호문 보관의 계약을 그대로 이어가며 서버 평문 검색이나 집계는 도입하지 않는다.

## 2026-10-28 운영 반영 결과

공통 소스는 [PR #22](https://github.com/softm/softm.github.io/pull/22), 실제 도메인·허브 보완은 [PR #23](https://github.com/softm/softm.github.io/pull/23)에 반영했다. Firebase `suiteAuth`·`suiteSocialAuth`의 운영 업데이트를 완료했다. 공통 정적 배포 [40671051469](https://github.com/softm/softm.github.io/actions/runs/40671051469)의 build/deploy가 성공했고 새로 연 계정 허브에서 현재 사이트 상태와 설계해요 실주소를 확인했다.

| 사이트 | 소스 반영 | 운영 반영 / 검증 |
|---|---|---|
|날씨한눈|[PR 1](https://github.com/softm/weatherhannun/pull/1)|배포 완료. 실제 화면의 보관소 열기와 공통 계정 연결 확인|
|주유한눈|[PR 1](https://github.com/softm/juyuhannun/pull/1)|소스 병합 및 Pages 배포 확인|
|충전한눈|[PR 3](https://github.com/softm/evchargingstation/pull/3), [배포 복구 PR 4](https://github.com/softm/evchargingstation/pull/4)|운영 배포 및 게시 버전 검증 성공. 별도의 기존 광고·지도 브라우저 검사는 실패 상태|
|수소충전한눈|[PR 7](https://github.com/softm/hydrogenstation/pull/7)|소스 병합 및 Pages 배포 확인|
|음식한눈|[PR 3](https://github.com/softm/foodhannun/pull/3)|배포 완료. 운영 화면의 내 보관소 버튼 확인|
|맛집한눈|[PR 1](https://github.com/softm/matjiphannun/pull/1)|소스 병합 및 Pages 배포 확인|
|금시그널|[PR 1](https://github.com/softm/goldsignal/pull/1)|소스 병합 및 Pages 배포 확인|
|계산기|[PR 1](https://github.com/softm/calc/pull/1)|소스 병합 및 Pages 배포 확인|
|지원한눈|[PR 1](https://github.com/softm/softm.policyfundfinder/pull/1)|소스 병합 및 Pages 배포 확인|
|돌봄한눈|[PR 1](https://github.com/softm/homecare-nationwide-care-services-map/pull/1)|소스 병합 및 Pages 배포 확인. 전체 메뉴 안의 내 보관소 사용|
|경매한눈|[PR 28](https://github.com/softm/softm.auctionhannun/pull/28)|소스 병합 및 Pages 배포 확인|
|사업자한눈|[PR 3](https://github.com/softm/bizhannun/pull/3)|소스 병합 및 Pages 배포 확인|
|노른|[PR 28](https://github.com/softm/norn/pull/28)|[main 검사·배포 40670136122](https://github.com/softm/norn/actions/runs/40670136122) 성공. 최초 영상 길이 타이밍 실패는 동일 코드 재검사에서 통과|
|설계해요|[PR 1](https://github.com/softm/seolgyehaeyo/pull/1)|소스·타입·등록부 UI 검사 완료. 실제 Sites 소스 동기화와 배포 미완료|
|위로해요|기존 전용 어댑터 유지|기존 운영 백업·복원 유지. 이번 변경의 신규 어댑터 대상 아님|

### 실계정과 저장 검증

- 실제 공통 계정의 연결 목록에서 **Google · 카카오 · 네이버**를 확인했다. 네이버는 등록된 개발회원에 한정된다.
- 날씨한눈 사이트에서 로그인 팝업의 기존 계정을 선택해 사이트 세션이 발급되는 것을 확인했다.
- 운영 계정 허브의 날씨한눈 메모 보관소에 개인정보 없는 `suite-e2e-20261028` 합성 메모를 암호화 저장했다. 목록 조회 후 새로 복호화한 내용이 입력 문구와 일치했다. 기존 사용자 기록은 수정·삭제하지 않았다. 해당 테스트 메모 1건은 남겨 두었다.
- [공통 검사 40669773880](https://github.com/softm/softm.github.io/actions/runs/40669773880): 코어·암호화·사이트 상태 19개, Firestore Rules 6개, 실제 Web Crypto를 사용하는 브라우저 흐름과 320/390/1280px 검사 통과.
- 모든 사이트의 모든 실제 사용자 데이터와 제공자·기기 조합을 운영에서 확인했다는 의미는 아니다. 원본 첨부파일과 네이티브 Android 인증은 적용 범위에 포함하지 않는다.

### 남은 공개·운영 작업

1. **네이버 일반 공개 검수:** 개발회원 로그인과 동일 UID 연결은 성공했다. NAVER Developers는 검수 전에 앱 로고와 단계별 로그인 캡처 등록을 요구하며 아직 접수되지 않았다. 공개 승인 전에는 일반 사용자가 네이버로 로그인할 수 없다.
2. **설계해요 실제 게시:** GitHub 소스는 병합했지만 현재 실행 환경에 Sites 소스 helper를 실행할 수단이 없어 해당 서비스의 원본 소스 저장소에 동기화하거나 새 버전을 배포하지 못했다. GitHub 병합을 Sites 배포 완료로 표시하지 않는다. 기존 URL·공개 범위·D1·R2 연결은 유지했다.
3. **기존 회귀 검사:** 충전한눈 [40671227504](https://github.com/softm/evchargingstation/actions/runs/40671227504)의 게시·버전 확인 단계는 성공했으나 광고 슬롯 수(검사 기대 1개 / 운영 3개), 지도 축척 앵커, 모바일 지도 포커스 검사는 실패했다. 설계해요 Python collector의 중복 이름 테스트는 변경 전 base와 같은 실패를 보였다. 이들을 전체 검사 통과로 계산하지 않는다.
4. 불확실한 업로드 실패에서 남을 수 있는 미연결 암호문 백업의 서버 정리, 계정 탈퇴 시 하위 컬렉션 정리는 별도 유지보수 항목이다.


## 2026-10-29 독립 회원가입·로그인 운영 반영

공통 PR #28 및 인증 서버 suiteAuth를 운영 반영했다. CI 40724856495와 main 40725693503, Pages 40725691076·40725693315 모두 성공했다. 로그인·회원가입과 내 보관소 관리 링크를 분리했고, 최초 가입의 필수 동의를 서버에서 기록한다. 로그인만으로 자료를 업로드하지 않는다.

날씨·주유·충전·수소충전·음식·맛집·금시그널·계산기·지원·경매·사업자에서 공통 계정 UI와 별도 보관소 진입을 운영 DOM으로 확인했다. 돌봄한눈은 처음 안내를 닫고 전체 메뉴 안에서 로그인·별도 보관소 링크를 확인했다.

위로해요 PR #1과 Pages 40730684199 성공. 기기 암호 입력 전 로그인·회원가입·내 보관소 버튼을 확인했다. Android 패키지는 변경하지 않았다.

설계해요는 Sites 원본 커밋 9f91fa52e7cb2c0a97a94873ab96220fae31c056을 타입 검사·빌드하여 버전 2로 기존 owner-only 범위에 배포했다. 배포 appgdep_6ae22906b1d881918147d216e2445676 성공. 운영 헤더와 실제 인증 서버의 최초 가입 동의 화면을 확인했다. 기존 ChatGPT 프로젝트 소유권·D1/R2는 유지한다. 이전의 ‘Sites 배포 미완료’ 기록은 당시 상태이며 이번 게시로 해소됐다.

노른 PR #29는 기존 편집·브라우저·Firestore 검사 40731750229와 공통 어댑터 검사 40731750193을 통과했다. 오프라인 시작을 유지하며 공통 로그인과 회원가입의 독립 버튼을 제공한다. 실제 운영 버튼 확인은 배포 후 기록한다.

가입·로그인·독립 관리 흐름은 합성 브라우저로 검증했다. 실계정의 새 약관 수락은 대신 수행하지 않았다. 최초 이용자는 가입 안내를 직접 확인하고 동의해야 한다. 네이버 일반 공개 승인은 여전히 별도 대기다.

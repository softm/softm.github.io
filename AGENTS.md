# softm 공통 개발 기준

데이터 수집형 프로젝트를 새로 구현하거나 수정할 때는 [데이터 수집 현황 기준](projects/development/DATA-STATUS-STANDARD.md)을 적용한다. 운영 루트의 `data-status.html`과 메인 화면 진입 링크는 필수다. 실제 수집 결과·전체 및 지역별 건수·확인 시각·형식과 용량·오류와 갱신 지연을 표시하고 배포 후 검증한다.

이 기준의 타 저장소 적용 범위는 사용자의 해당 작업 요청을 따른다. 공통 기준을 저장한 것을 모든 기존 프로젝트의 구현·배포 완료로 보고하지 않는다.

아카이브 정리와 배포에는 기존 [통합 실행 기준](projects/archive-deployment/MD-HTML-ZIP-PROMPT.md)을 함께 따른다. 비공개 원문과 인증정보를 공통 기준 저장소에 복사하지 않는다.

카카오 AdFit 웹 광고를 새로 적용하거나 수정할 때는 [카카오 AdFit 공통 광고 기준](ADFIT-COMMON-ADS.md)을 먼저 따른다. 공통으로 재사용하는 것은 배치 유형·규격·동작 원칙뿐이며, `DAN-...` 광고 단위 ID는 사이트와 지면마다 별도로 발급하고 다른 서비스에서 재사용하지 않는다. 변경 시 공통 문서의 사이트별 적용 현황과 해당 프로젝트의 광고 운영 문서를 함께 갱신한다.

Android 앱에 Google AdMob 네이티브 광고를 새로 적용하거나 수정할 때는 [AdMob 네이티브 광고 공통 기준](ADMOB-NATIVE-COMMON-STANDARD.md)을 먼저 따른다. 광고 UI·동의 흐름·수명주기·테스트 방식만 공통으로 재사용하고, AdMob 앱 ID와 광고 단위 ID는 앱·지면별로 별도 발급한다. 시간만으로 자동 노출하는 전면광고는 공통 구현으로 복사하지 않으며, 전면광고는 사용자가 예상할 수 있는 자연스러운 콘텐츠 전환에서만 검토한다.

돌봄한눈·주유한눈의 네이버 자동차 길찾기는 [Firebase 공용 Directions 규칙](rule/FIREBASE-DIRECTIONS.md)을 따른다. 브라우저에는 공용 함수 URL만 두고 `NAVER_MAPS_API_SECRET`은 Google Secret Manager에만 저장하며, API 응답 계약과 허용 Origin을 바꿀 때 두 서비스를 함께 검증한다. <!-- SOFTM-FIREBASE-DIRECTIONS 날짜:20261026 : 공용 런타임의 비밀값·호환성 기준 연결 -->

공통 계정·SNS 로그인·개인 정보 보관소 작업은 [공통 계정·사이트별 보관소 기준](projects/development/standards/COMMON-ACCOUNT-VAULT.md)과 `services/suite-platform/README.md`를 따른다. 공통 모듈·설정 등록과 각 사이트의 실제 적용·실계정 검증을 구분해서 보고한다.

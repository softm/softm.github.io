# 공통 계정·사이트별 정보 보관소

한눈·해요 운영 서비스는 [공통 모듈 원본](../../../services/suite-platform/README.md)과 `/shared/platform/v1/` SDK를 재사용한다. UID는 통합하고 사이트별 데이터 경로·인증 claim·암호문은 분리한다.

- 공통 화면: https://softm.github.io/account/
- 원본: https://github.com/softm/softm.github.io/tree/main/services/suite-platform
- 공통 모듈이 존재한다고 모든 사이트 적용·운영 로그인 검증이 끝난 것으로 보고하지 않는다.
- SNS 로그인은 SNS 자료 수집 동의가 아니다. 개인 기록 평문·복호화 암호·OAuth 비밀값을 저장소에 넣지 않는다.
- 기존 Firebase 프로젝트의 계정·자료를 사용자 확인 없이 교체하거나 이메일만으로 자동 병합하지 않는다.
- 위로해요의 기기 내 분석과 암호화 원칙은 유지한다.

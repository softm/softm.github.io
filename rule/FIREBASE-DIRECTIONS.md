# Firebase 공용 Directions 규칙

## 목적과 운영 주소

돌봄한눈과 주유한눈은 네이버 자동차 길찾기를 같은 Firebase Functions v2 함수로 호출한다.

- Firebase 프로젝트: `softm-hannun-api`
- 함수·코드베이스: `directions` · `shared-api`
- 리전·런타임: `asia-northeast3`(서울) · Node.js 22
- 운영 주소: `https://asia-northeast3-softm-hannun-api.cloudfunctions.net/directions`
- 응답 계약: `{summary, path, section}`

## 보안과 호출 범위

- `NAVER_MAPS_API_SECRET`은 Google Secret Manager에만 저장하고 HTML, JavaScript 번들, 정적 JSON, 문서, 로그에 실제 값을 남기지 않는다.
- 브라우저 호출 Origin은 `https://homecare.designboard.net`, `https://softm.github.io`와 명시된 로컬 개발 주소만 허용한다.
- 주소→좌표와 좌표→주소는 네이버 Maps JavaScript SDK의 `geocoder` 서브모듈이 담당한다. Firebase 함수에는 Client Secret이 필요한 자동차 길찾기만 둔다.
- 위치·경유지 요청 본문과 응답을 애플리케이션 로그에 기록하지 않는다.
- 함수의 요청 크기, 시간 제한, 최대 인스턴스, 동시 요청, 호출 빈도 제한을 제거하거나 확대하기 전에 비용과 악용 영향을 확인한다.

## 변경과 검증

- 기준 소스는 돌봄한눈 저장소의 `services/firebase-api`다.
- API 주소, CORS, 요청 또는 응답 형식을 바꾸면 돌봄한눈과 주유한눈을 같은 작업에서 수정한다.
- 배포 전 함수 단위검사, 배포 후 공식 Origin의 CORS와 실제 네이버 경로 응답을 확인한다.
- 기존 Vercel `daycare-directions-proxy`는 모든 공개 프런트가 Firebase 주소로 배포된 것을 확인한 뒤 제거한다.

<!-- SOFTM-FIREBASE-DIRECTIONS 날짜:20261026 : 두 서비스가 공유하는 길찾기 런타임의 단일 운영 기준 -->

# 분양한눈 (Bunyang Hannun)

청약/분양 모집정보와 아파트 분양권 전매 실거래가를 한 지도에서 유형별로 구분해 보는 독립적인 순수 HTML/CSS/JavaScript 웹앱입니다. 주유한눈의 지도-목록 상호작용을 참고하되 코드와 데이터를 복제하지 않았습니다.

- **웹 주소:** https://softm.github.io/bunyanghannun/
- **현재 소스:** https://github.com/softm/softm.github.io/tree/main/bunyanghannun
- **권장 독립 저장소:** softm/bunyanghannun (현재 연결된 GitHub 기능에 새 저장소 생성 동작이 없어 기존 Pages 저장소의 분리된 폴더로 먼저 배포)
- **청약홈 공공 API:** https://www.data.go.kr/data/15098547/openapi.do
- **분양권 전매 공공 API:** https://www.data.go.kr/data/15126471/openapi.do

## 구현 기능

| 구분 | 청약·분양 | 분양권 전매 |
|---|---|---|
| 조회 | 모집공고·접수일·무순위 | 신고 거래금액·계약일·면적·층 |
| 자료 | 한국부동산원 청약홈 | 국토교통부 아파트 분양권전매 실거래 |
| 화면 | 지도·검색·필터·일정·관심 저장 | 지도·검색·실거래 목록·관심 저장 |
| 알림 | 새 공고/접수 임박(웹이 열려 있는 동안) | 새 거래(웹이 열려 있는 동안) |

실거래는 현재 판매 중인 **분양권 매물**이 아닙니다. 청약 자격, 전매 제한, 투자 적합성은 확인되지 않습니다. 초기 청약 API는 모집공고 상세를 다루며 주택형별 분양가 API는 아직 미연동되어 가격이 미제공일 수 있습니다.

## 시작하기

Python 3에서 bunyanghannun 폴더 안에서 `python3 -m http.server 8080` 실행 후 http://localhost:8080/ 에 접속합니다. 빌드 도구나 npm 패키지는 필요하지 않습니다.

기본 데이터 파일 offerings.json / transfers.json의 status=unconfigured와 빈 items는 **API 연결 대기 상태**이며 실제 공고나 거래가 0건이라는 의미가 아닙니다. 화면의 '예시 데이터 보기'는 실제 데이터와 구분되는 명시적 가상 모드입니다.

## GitHub Actions 정기 수집

- 워크플로: `.github/workflows/bunyanghannun-collect.yml`
- 시간: GitHub 예약 기준 하루 2회 09:15 / 21:15 KST (예약 지연 가능)
- Secrets: `APPLYHOME_API_KEY`, `MOLIT_API_KEY` (공공데이터포털 승인 후 등록)
- 선택적 Geocoding: Variable `BUNYANG_GEOCODE_ENABLED=true`, Secrets `BUNYANG_NAVER_MAP_CLIENT_ID`, `BUNYANG_NAVER_MAP_CLIENT_SECRET`
- Geocoding **기본 비활성**. 허용하면 신규 Maps 상품을 사용하며 1회 최대 20건 주소를 변환합니다. 과금/이용약관 확인 필요.
- 수집기: `node scripts/collect.mjs` (Node.js 22+, 프로젝트 폴더에서 실행)
- 실패 시 해당 정상 데이터 JSON을 보존하고 에러를 워크플로에 기록합니다.

## 범위 및 정확성

- 청약은 공식 분양정보 상세 5종을 최대 최근 180일 범위에서 수집합니다. 분양가·공급면적 등 주택형별 상세 정보는 아직 보강되지 않았습니다.
- 분양권 전매는 `config/law-codes.json`에 명시된 6개 시군구와 최근 6개월을 초기 범위로 사용합니다. **전국 수집 완료가 아닙니다.** 전국 코드 확대 시 공식 법정동코드 표를 사용하여 검증해야 합니다.
- 분양권 API에서는 실제 단지의 상세 좌표가 제공되지 않을 수 있습니다. 주소·좌표가 확인되지 않으면 지도에 가짜 마커를 만들지 않고 목록에만 표시합니다.
- 좌표는 `data/coordinates.json`에 검증값을 입력하거나 명시적으로 활성화된 지도 주소 변환으로 보완합니다. 변환 위치는 '참고 위치'로 구분합니다.
- status / generatedAt / coverage / warnings를 각 JSON에 기록하여 부분 수집을 전체 수집처럼 보이지 않게 합니다.

## 알림 범위

브라우저 알림은 사용자가 권한을 허용하고 사이트를 열어 둔 상태에서만 작동합니다. 탭 복귀 시와 15분 주기로 새 JSON을 확인하며, 알림 조건과 관심 목록은 해당 브라우저의 localStorage에 저장됩니다. **웹 종료 후 푸시, 멀티기기 동기화, 문자, 알림톡은 아직 구현되지 않았습니다.** 이를 구현하려면 공통 로그인·Cloudflare D1 구독 저장소·Web Push 전송·동의/해지 경로가 필요합니다.

## 운영 후속

1. 독립 저장소 `softm/bunyanghannun` 신규 생성 후 기존 Pages 임시 폴더에서 소스를 이전
2. 두 API 사용 신청·승인 및 Secret 등록 후 첫 수집 실행과 원문 대조
3. 전국 5자리 법정동코드 확대, 청약 주택형별 분양가 보강
4. 정확한 지오코딩, 중복 단지 매칭, 실거래 취소/신고 지연 처리 검증
5. 공통 계정 및 서버 측 푸시 알림 적용, 동의 및 비용 모니터링

디자인 참고: https://bunyangi.com/ (구성 아이디어 참고, 원본 코드·이미지·상표 복제 없음)

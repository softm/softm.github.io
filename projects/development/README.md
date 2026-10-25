# Development common work information

`softm/softm.github.io/projects/development/`는 여러 GitHub 저장소에서 공통으로 사용하는 개발·운영 작업 정보를 체계적으로 관리하는 중앙 위치다.

- `standards/`: 전역 표준
- `workflows/`: 공통 작업 절차
- `templates/`: 재사용 가능한 구현/점검 프롬프트
- 기존 루트 표준 문서: 이전 링크 호환용. 신규/개편 문서는 `standards/` 하위가 원본이다.

## 작업 전 필독

- 지도형 앱: `standards/map/MOBILE-MAP-FOCUS-STANDARD.md`
- **아카이브 배포(공개/비공개): `../archive-deployment/README.md`와 `../archive-deployment/OPERATIONS-POLICY.md`를 먼저 읽고 시작한다.**
- **비공개 아카이브는 구현 전에 `OPERATIONS-POLICY.md`의 “8-1. 비공개 배포 강제 사전점검”을 반드시 수행한다.**
- 비공개 아카이브의 정상 구조는 **Private GitHub 원본 + Vercel 인증 + server-side GitHub live-read gateway**다.
- Shared `GITHUB_TOKEN`은 프로젝트 전용 env 조회에 보이지 않을 수 있으므로 빈 env 목록만 보고 “토큰 없음”으로 판정하지 않는다.
- 비공개 아카이브는 GitHub 원본 수정 후 Vercel 재배포 없이 최신 `main`이 반영되는지 실제 검증한 뒤에만 완료로 보고한다.

현재 지도 집중모드 원본:
- `standards/map/MOBILE-MAP-FOCUS-STANDARD.md`

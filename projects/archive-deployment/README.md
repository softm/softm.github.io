# 아카이브 배포 — 기준 소스

최종 갱신: 2026-10-07 · 통합 기준 버전: 2026-10-07.1

## 먼저 읽을 실행 기준

**`정리 md, html to zip` 실행은 [MD · HTML · ZIP 통합 실행 프롬프트](MD-HTML-ZIP-PROMPT.md)를 기준으로 한다.** 현재 채팅 전체, 모든 원본 미디어, 사건일 기반 파일명, 실제 MD/HTML/ZIP 생성, 기존 공개·비공개 배포 연계, 홈·중앙 인덱스·인증·미디어 검증과 완료 보고까지 포함한다.

사용자가 명시한 범위 제한이 우선한다. 프롬프트나 기준 문서 작성 요청을 개인 기록 공개나 전체 프로젝트 재배포 요청으로 확대하지 않는다.

| 문서 | 역할 |
|---|---|
| [MD-HTML-ZIP-PROMPT.md](MD-HTML-ZIP-PROMPT.md) | 명령 실행에 사용하는 통합 프롬프트 |
| [MD-HTML-ZIP-REQUIREMENTS.md](MD-HTML-ZIP-REQUIREMENTS.md) | 50개 요구사항의 반영 위치와 완료 검증 |
| [archive_deployment_prompt.md](archive_deployment_prompt.md) | 기존 파일명에서 접근하는 통합 기준 진입점 |
| [OPERATIONS-POLICY.md](OPERATIONS-POLICY.md) | 이 변경 전 README의 누적 운영 기준 전체 보존본 |
| [BASE-DEPLOYMENT-PROMPT.md](BASE-DEPLOYMENT-PROMPT.md) | 이 변경 전 통합 배포 프롬프트 전체 보존본 |
| [ZIP/폴더 Workflow 처리기준](20261005_아카이브배포_ZIP폴더_Workflow_처리기준.md) | 수집함·원본·manifest·검증 후 cleanup |
| [HTML 우선·MD 변환 기준](20261007_HTML우선_MD본문변환_기준.md) | 정상 HTML 보존과 MD-only 본문 표시 |
| [CHANGELOG.md](CHANGELOG.md) | 이번 통합 및 이전 변경 이력 |

## 충돌 시 우선순위

현재 요청의 명시적 범위 → 최신 사용자 확정 변경사항 → 통합 실행 프롬프트 → 충돌하지 않는 기존 세부 운영 기준 순으로 적용한다. 보존 문서의 오래된 문구로 최신 기준을 되돌리지 않는다.

정상 HTML이 있으면 우선 보존한다. HTML이 없으면 MD/TXT/미디어/문서에서 HTML을 만든다. Markdown 덤프형 HTML은 원본을 보존하면서 정상 렌더링 HTML로 정규화한다. 따라서 과거의 포괄적 MD 변환 금지·HTML 없으면 중단 문구는 그대로 적용하지 않는다.

## 중앙 기준 갱신 의무

어느 프로젝트에서든 새 규칙·사용자 요구·오류 수정 기준이 확정되면 해당 채팅에만 남기지 않고 이 중앙 소스, 변경 이력 및 필요한 공통 구현과 대상 프로젝트에 함께 반영한다. 전역 기억 저장 요청도 함께 처리한다.

소스 수정, 서비스 구현, 운영 검증, 전역 기억 저장, ChatGPT 프로젝트 첨부는 서로 다른 작업이다. 수행하지 않은 단계까지 완료로 보고하지 않는다. 이 디렉터리에는 공통 정책만 기록하고 개인 민감 원문이나 인증정보를 넣지 않는다.

## 운영 소스 연결

상위 [projects/README.md](../README.md), [PROJECT-HOME-POLICY.md](../PROJECT-HOME-POLICY.md) 및 기존 공통 workflow는 위 기준을 구현하는 운영 소스다. 프로젝트 홈·중앙 `/projects/<project>/`·최상위 `/projects/`의 목록 일치, 비공개 인증 gateway, 원본 보존, 최종 검증 후 수집함 삭제 조건은 계속 유효하다.

이번 변경은 기준 문서 통합이다. 모든 개별 프로젝트의 코드 수정·재배포·운영 검증이 완료됐다는 의미가 아니다.

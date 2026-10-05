# 아카이브 배포 — 기준 소스

최종 갱신: 2026-10-05

이 문서는 “아카이브 배포” 프로젝트에서 사용하는 운영 기준 소스다.

## 기준 문서 우선순위

2026-10-05부터 다음 두 문서를 **Source of Truth**로 사용한다.

1. `archive_deployment_prompt.md` — 아카이브 배포 전체 정책, 공개/비공개, 인증, 미디어, 홈/중앙 인덱스, 완료 판정
2. `20261005_아카이브배포_ZIP폴더_Workflow_처리기준.md` — `zip/` 수집함, ZIP/폴더 처리, manifest, live verification, cleanup 구현 기준

`../README.md`, `../PROJECT-HOME-POLICY.md` 및 공통 workflow는 위 두 기준을 구현하는 운영 소스이며 충돌 시 위 기준 문서에 맞춰 수정한다.

## 목적

아카이브 배포는 공개·비공개 기록을 GitHub를 Source of Truth로 보존하고, 원본 미디어를 포함한 상세 기록과 프로젝트 홈/중앙 인덱스를 일관되게 배포·검증하는 작업이다.

## 2026-10-05 수정사항

| 항목 | 기준 |
|---|---|
| 입력 수집함 | 각 프로젝트 저장소의 `zip/` |
| 일반 입력 | `zip/*.zip` ZIP 1개 = 기록 작업 1건 |
| 대용량 입력 | ZIP으로 올리기 어려우면 `zip/<작업폴더>/`를 폴더째 업로드 |
| 원본 보존 | 사진·영상·음성·PDF·문서 등 확보 가능한 원본을 최종 기록 디렉토리에 실제 파일로 보존 |
| 처리 결과 | 공개 예: `public/records/<slug>/`; 비공개는 해당 Private 저장소의 표준 기록 경로 |
| 홈 동기화 | 프로젝트 서비스·기록 홈 + 중앙 `/projects/<project>/` + `projects.json` |
| 상세 링크 | 기록 제목/기록 열기 → 실제 운영 상세페이지 |
| slug 링크 | `20260527-moskill` 같은 slug/디렉토리명 → 실제 GitHub 기록 디렉토리 |
| 입력 삭제 | 반영·배포·운영 검증까지 모두 성공한 ZIP/폴더만 삭제 |
| 실패 처리 | 어느 단계든 실패하면 입력 ZIP/폴더를 수집함에 보존 |
| 중복 방지 | canonical id/manifest/hash를 비교하여 재실행 시 중복/변경 판정 |

## 표준 처리 순서

1. `zip/`의 ZIP 파일과 작업 폴더를 탐지한다.
2. ZIP은 임시 공간에 해제하고 폴더 입력은 구조 그대로 읽는다.
3. 실제 사건 날짜와 사용자 지정 제목을 우선하여 canonical date/title/slug/id를 확정한다.
4. 원본 파일 목록, 크기, SHA-256을 manifest로 만든다.
5. HTML/Markdown을 아카이브 표준 형식으로 구성한다.
6. 모든 사진을 갤러리/본문에 연결하고, 영상·음성은 플레이어와 원본 링크를 제공한다.
7. 최종 기록 디렉토리에 원본과 문서를 함께 반영한다.
8. 공개/비공개 프로젝트 홈과 중앙 프로젝트 인덱스를 갱신한다.
9. 사용자용 상세 링크와 GitHub slug 디렉토리 링크를 각각 생성한다.
10. 운영 URL, 사진 표시, 영상·음성 재생, 원본 다운로드, 404/403/500, 인증을 실제 검증한다.
11. final verification까지 통과한 입력만 별도 cleanup 단계에서 `zip/`에서 삭제한다.

권장 파이프라인은 다음 순서를 고정한다.

```text
archive-inbox-detect
  ↓
archive-build
  ↓
archive-manifest-verify
  ↓
commit-record
  ↓
deploy
  ↓
live-verify
  ↓
sync-project-index
  ↓
final-verify
  ↓
cleanup-inbox
```

`archive-build` 또는 `commit-record` 단계에서 입력을 삭제해서는 안 된다.

## 수집함 삭제 안전장치

`zip/`은 임시 작업 대기열이며 최종 아카이브가 아니다. 따라서 처리 전 또는 중간 성공만으로 삭제하지 않는다.

삭제 가능 조건은 다음을 모두 만족해야 한다.

- 최종 기록 디렉토리에 원본 파일이 존재한다.
- manifest의 개수·크기·해시 검증을 통과한다.
- HTML/MD 참조가 실제 파일을 가리킨다.
- 저장소 커밋이 완료됐다.
- 프로젝트 홈과 중앙 인덱스가 갱신됐다.
- 운영 배포가 완료됐다.
- 운영 상세 URL과 미디어가 실제 동작한다.

하나라도 실패하면 ZIP 또는 작업 폴더는 그대로 둔다.

## 공개/비공개 분리

공개 자료만 Public GitHub 저장소의 수집함에 넣는다. 민감하거나 비공개인 자료는 해당 `<project>-private` 저장소의 수집함에서 처리한다. 수집함 방식은 공개 범위를 바꾸지 않는다.

## 관련 기준

- `projects/README.md` — 전역 아카이브 배포 규칙
- `projects/PROJECT-HOME-POLICY.md` — 프로젝트 홈·상세 링크·GitHub 디렉토리 링크 규칙

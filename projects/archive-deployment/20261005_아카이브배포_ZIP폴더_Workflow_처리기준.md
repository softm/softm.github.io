# ZIP 디렉토리 Workflow 기반 아카이브 자동 배포 전달 문서

- 작성일: 2026-10-05
- 적용 사례: `softm/hwagok-farm`
- 전달 대상: **아카이브 배포 프로젝트**
- 목적: 프로젝트 저장소의 `zip/` 디렉토리를 아카이브 수집함(inbox)으로 사용하여 ZIP 또는 폴더 단위 원본을 자동 정리·배포하고, 성공적으로 처리된 입력만 삭제하는 표준 workflow를 공유한다.

## 1. 핵심 개념

각 프로젝트 GitHub 저장소의 `zip/` 디렉토리를 **아카이브 입력 수집함(inbox)** 으로 사용한다.

입력 기준:
- `zip/*.zip`: ZIP 파일 1개 = 작업 1건
- `zip/<작업폴더>/`: 폴더 1개 = 작업 1건
- 대용량 영상 등은 ZIP을 강제하지 않고 폴더째 업로드 가능
- 사진·영상·음성·PDF·문서는 최종 기록 디렉토리에 실제 원본 파일로 보존

## 2. 표준 처리 흐름

```text
사용자 원본
 ↓
zip/
 ↓
입력 탐지
 ↓
ZIP 해제 / 폴더 복사
 ↓
canonical date / title / slug / id 결정
 ↓
원본 manifest 생성
 ↓
HTML / Markdown 아카이브 구성
 ↓
public/records/<slug>/ 또는 비공개 표준 기록 경로
 ↓
프로젝트 서비스 홈 갱신
 ↓
중앙 /projects/<project>/ 갱신
 ↓
Pages/Vercel 배포
 ↓
실제 운영 URL·미디어 검증
 ↓
성공한 입력만 zip/에서 삭제
```

## 3. Canonical 기록 기준

각 입력은 실제 사건 날짜, 사용자 지정 제목, `date/title/slug/id`, 기록 디렉토리, 운영 상세 URL, GitHub 실제 디렉토리 URL을 하나의 기준으로 사용한다.

기록 제목/기록 열기는 실제 운영 상세페이지로 연결하고 slug는 GitHub 실제 기록 디렉토리로 연결한다.

## 4. 원본 보존 및 Manifest

사진, 영상, 음성, 녹취, PDF, HTML, Markdown, 문서, 기타 관련 첨부를 실제 파일로 보존한다.

각 파일에 최소 `path`, `size`, `sha256`을 기록한다. Manifest는 원본 누락, 동일 입력, 중복 기록, 변경 원본, 최종 저장소 파일 검증에 사용한다.

## 5. HTML / Markdown 처리

ZIP/폴더 배포의 웹 상세 기준은 **기존 HTML 파일**이다.

- 입력에 HTML이 있으면 해당 HTML을 canonical web entry로 선택한다.
- 선택한 HTML은 재작성·요약·Markdown 역변환 없이 **그 파일 자체를 `index.html`로 사용**한다.
- 원본 HTML과 배포된 `index.html`은 동일 내용이어야 하며 가능하면 SHA-256을 비교한다.
- Markdown은 기록 원본으로 보존할 수 있지만, Markdown을 읽어 `index.html`을 생성하지 않는다.
- HTML이 없는 ZIP/폴더는 Markdown을 자동 변환해 웹 상세를 만들지 않고 보류/실패 처리한다.
- 이미지·영상·CSS·JS 등 상대경로가 깨지지 않도록 ZIP/폴더의 원래 디렉토리 구조를 기록 루트에 보존한다.
- 기존 레코드도 HTML 원본이 있으면 동일 기준으로 `index.html`을 다시 맞추고 운영 URL을 검증한다.

## 6. 삭제 안전장치

`zip/`은 임시 작업 대기열이며 작업 시작과 동시에 삭제하지 않는다.

삭제 전 필수 통과:
1. ZIP 해제/폴더 읽기
2. 기록 디렉토리 생성
3. 원본 복사
4. manifest 개수·크기·해시 확인
5. HTML/Markdown 참조 확인
6. Git commit
7. 프로젝트 서비스 홈 갱신
8. 중앙 프로젝트 홈 갱신
9. Pages/Vercel 배포
10. 운영 상세 URL
11. 사진 표시
12. 영상·음성 실제 재생
13. 원본 다운로드
14. 404/403/500 오류 없음

모두 통과한 입력만 삭제한다. 실패한 입력은 `zip/<원본>`에 그대로 유지한다.

## 7. 기존 기록 충돌 처리

동일 slug가 존재하면 자동 덮어쓰지 않는다. 기존 `archive-manifest.json`과 입력 SHA-256을 비교해 동일/변경 입력을 판정하고 기존 canonical 기록을 자동 삭제·파괴하지 않는다.

## 8. 공개 / 비공개 분리

공개 자료는 `<project>/zip/`, 민감 자료는 `<project>-private/zip/`에서 처리한다. 수집함 방식은 공개 범위를 변경하지 않는다.

## 9. 화곡농장 기준 구현

기준 구현 파일:
```text
softm/hwagok-farm
├── zip/
├── scripts/process-archive-inbox.py
└── .github/workflows/process-archive-inbox.yml
```

현재 기준상 build/commit 단계에서 입력을 삭제하면 안 된다. cleanup은 아래 최종 파이프라인의 마지막 단계로 분리한다.

## 10. 배포 후 검증과 cleanup 분리

```text
1차 workflow: 입력 → 기록 생성 → commit
2차 workflow: Pages/Vercel 배포 → 운영 검증
3차 cleanup: 모든 검증 성공 → zip 입력 삭제
```

## 11. 대용량 파일

GitHub 단일 파일 제한 초과 시 Git LFS, 별도 미디어 저장 정책, 영상 최적화본 + 원본 보존 위치 등을 명시적으로 결정한다. 원본을 임의 삭제하거나 변환본으로 대체하지 않는다.

## 12. 권장 공통 Workflow 구조

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

`cleanup-inbox`는 모든 앞 단계가 성공했을 때만 실행한다.

## 13. 완료 판정

- 원본 확보: `zip/` 또는 작업 폴더에 원본 존재
- 변환 완료: 기록 디렉토리 생성
- 저장소 반영: Git commit 완료
- 배포 완료: Pages/Vercel 운영 반영
- 미디어 검증: 사진·영상·음성 실제 동작 확인
- 아카이브 완료: 홈/중앙 인덱스/상세/미디어/원본 검증까지 모두 통과

CI가 성공했다는 이유만으로 아카이브 완료라고 보고하지 않는다.

## 14. 중앙 동기화

중앙 `softm/softm.github.io`의 `projects/projects.json`, `projects/<project>/` 동기화가 필요하다. repository_dispatch, reusable workflow, GitHub App/PAT 또는 중앙 인덱스가 각 프로젝트 manifest를 읽는 구조를 사용할 수 있다.

## 15. 전달 요청

아카이브 배포 프로젝트는 다음을 계속 구현한다.

1. 화곡농장 구현 검토
2. 공통 reusable workflow 설계
3. ZIP/폴더 입력 공통 지원
4. 중앙 프로젝트 인덱스 자동 동기화
5. 배포 후 live verification
6. 검증 성공 후 inbox cleanup
7. 공개/비공개 저장소 동일 원칙 적용
8. canonical 기록 비파괴 업데이트 정책


## 16. 중앙 프로젝트 홈·전체 인덱스 운영 반영 게이트

중앙 동기화는 소스 파일 수정으로 끝나지 않는다. 각 기록 처리마다 아래를 모두 통과해야 한다.

1. `projects/projects.json`에 프로젝트/기록 메타데이터 반영
2. `projects/<project>/` 프로젝트 홈 소스 반영
3. 중앙 GitHub Pages 배포 완료
4. 운영 `https://softm.github.io/projects/<project>/`에서 새 기록이 실제 렌더링되는지 확인
5. 운영 `https://softm.github.io/projects/`에서 해당 프로젝트 카드가 실제 렌더링되는지 확인
6. 프로젝트 카드 → 프로젝트 홈 → 새 상세 기록 링크를 실제로 따라가며 검증

CI success, commit 존재, raw JSON 반영만으로는 4~6단계를 대체하지 못한다. Pages가 pending/cancelled/stale이면 재배포하고 실제 운영 화면이 갱신될 때까지 `final-verify`를 통과시키지 않는다.

```text
sync-project-index-source
 ↓
deploy-project-index
 ↓
verify-project-home-rendered
 ↓
verify-top-projects-rendered
 ↓
verify-record-deep-link
 ↓
final-verify
 ↓
cleanup-inbox
```


## 17. 개별 배포 완료와 아카이브 전체 완료를 분리

아카이브 workflow에서 `deploy` 성공은 전체 작업 완료가 아니다.

특히 Vercel의 `READY`, Pages 배포 성공, Git commit 성공을 `final-verify`와 혼동하지 않는다.

필수 순서는 다음과 같이 고정한다.

```text
commit-record
 ↓
deploy
 ↓
verify-record-live
 ↓
sync-project-local-home
 ↓
sync-projects-json
 ↓
deploy-central-project-pages
 ↓
verify-/projects/<project>/
 ↓
verify-/projects/
 ↓
verify-deep-links-auth-media
 ↓
final-verify
 ↓
cleanup-inbox
```

### 중앙 반영 체크포인트

매 작업마다 다음을 확인한다.

| 체크 | 필수 |
|---|---|
| 프로젝트 자체 홈/목록 | 예 |
| `projects/projects.json` | 예 |
| `/projects/<project>/` | 예 |
| `/projects/` | 예 |
| 기록 상세 deep link | 예 |
| 공개/비공개 인증 | 해당 시 예 |
| 미디어/첨부 | 해당 시 예 |

위 항목 중 하나라도 생략되면 workflow 상태는 `incomplete`로 처리한다.

**Vercel READY ≠ 아카이브 배포 완료**를 공통 규칙으로 사용한다.

# 아카이브 배포 — 기준 소스

최종 갱신: 2026-10-05

이 문서는 “아카이브 배포” 프로젝트에서 사용하는 운영 기준 소스다.

## 모든 프로젝트 공통: 기준정보 변경·보완 반영 의무

**어느 프로젝트나 채팅에서든 아카이브 배포 기준이 변경·보완·확정되면, 해당 채팅이나 구현 코드에만 남기지 않고 반드시 “아카이브 배포” 프로젝트의 중앙 기준 문서에도 같은 작업에서 반영한다.**

- 적용 대상: 공개·비공개 배포, ZIP/폴더 처리, HTML, 날짜·제목, 미디어, 인증, 목록·인덱스 동기화, 검증, 입력 삭제 및 완료 보고 등 모든 아카이브 기준정보.
- 중앙 반영 위치: 이 디렉터리의 기준 문서, 변경 이력과 관련 공통 운영 소스.
- 순서: 변경사항 확인 → 중앙 기준 문서 갱신 → 관련 구현·공통 workflow 반영 → 실제 검증 → 반영 위치와 결과 보고.
- 전역 기억 저장을 요청받으면 메모리 저장도 시도한다. 저장이 실패하거나 비활성화되어 있으면 성공했다고 말하지 않고, 중앙 문서 반영과 메모리 저장 결과를 구분해서 보고한다.
- 다른 ChatGPT 프로젝트의 지침·대화가 직접 갱신되지 않았는데 갱신되었다고 표현하지 않는다. 실제 수정한 기준 소스 경로를 명시한다.

## 기준 문서 우선순위

2026-10-05부터 다음 문서를 **Source of Truth**로 사용한다.

1. [archive_deployment_prompt.md](archive_deployment_prompt.md) — 아카이브 배포 전체 정책, 공개/비공개, 인증, 미디어, 홈/중앙 인덱스, 완료 판정
2. [20261005_아카이브배포_ZIP폴더_Workflow_처리기준.md](20261005_아카이브배포_ZIP폴더_Workflow_처리기준.md) — `zip/` 수집함, ZIP/폴더 처리, manifest, live verification, cleanup 구현 기준
3. [CHANGELOG.md](CHANGELOG.md)와 이 문서의 최신 확정 보완 기준 — 위 문서의 오래된 표현과 충돌하면 최신 사용자 확정 기준을 적용한다.

`../README.md`, `../PROJECT-HOME-POLICY.md` 및 공통 workflow는 위 기준을 구현하는 운영 소스이며 충돌 시 기준 문서에 맞춰 수정한다.

## 목적

아카이브 배포는 공개·비공개 기록을 GitHub를 Source of Truth로 보존하고, 원본 미디어를 포함한 상세 기록과 프로젝트 홈/중앙 인덱스를 일관되게 배포·검증하는 작업이다.

## 2026-10-05 수정사항

| 항목 | 기준 |
|---|---|
| 입력 수집함 | 각 프로젝트 저장소의 `zip/` |
| 일반 입력 | `zip/*.zip` ZIP 1개 = 기록 작업 1건 |
| 대용량 입력 | ZIP으로 올리기 어려우면 `zip/<작업폴더>/`를 폴더째 업로드 |
| HTML 기준 | ZIP/폴더 내부의 기존 HTML을 기준으로 `index.html`을 구성한다. MD로 HTML을 다시 생성하거나 TSX로 재작성하지 않는다. 기존 HTML의 내용·레이아웃·상대경로와 원본 미디어를 보존한다. |
| 원본 보존 | 사진·영상·음성·PDF·문서 등 확보 가능한 원본을 최종 기록 디렉토리에 실제 파일로 보존 |
| 처리 결과 | 공개 예: `public/records/<slug>/`; 비공개는 해당 Private 저장소의 표준 기록 경로 |
| 홈 동기화 | 프로젝트 서비스·기록 홈 + 중앙 `/projects/<project>/` + 최상위 `/projects/`가 같은 canonical 공개 목록을 사용한다. `projects.json`은 해당 원본의 연결정보를 관리한다. |
| 동기화 구현 | 중앙에 별도 수동 목록을 유지하지 않는다. 배포된 공개 홈의 `archive-data` 또는 동일 배포에서 생성된 공식 manifest를 읽는다. 정적 복제가 필요하면 같은 원본에서 자동 생성하고 일치 검증한다. |
| 중앙 운영 반영 | `/projects/<project>/`와 `/projects/` 양쪽에서 새 기록/프로젝트가 실제 렌더링된 것을 확인해야 완료 |
| 동기화 실패 | 오래된 목록을 최신 동기화 결과인 것처럼 표시하지 않는다. 실패 상태와 원본 홈 링크를 안내하고 입력을 보존한다. |
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
5. 기존 HTML을 기준으로 아카이브 진입점 `index.html`을 구성한다. MD는 별도 원본으로 보존하며 HTML 재생성의 기준으로 삼지 않는다. HTML이 없는 입력은 누락 상태를 명시하고 별도 처리한다.
6. 모든 사진을 갤러리/본문에 연결하고, 영상·음성은 플레이어와 원본 링크를 제공한다. 기존 HTML의 내용·레이아웃·미디어 경로는 유지한다.
7. 최종 기록 디렉토리에 원본과 문서를 함께 반영한다.
8. 공개/비공개 프로젝트 홈과 중앙 프로젝트 인덱스를 같은 canonical 목록에 연결한다.
9. 사용자용 상세 링크와 GitHub slug 디렉토리 링크를 각각 생성한다.
10. 운영 URL, 사진 표시, 영상·음성 재생, 원본 다운로드, 404/403/500, 인증을 실제 검증한다. 세 목록의 기록 수·date/title/slug·상세 URL·GitHub 디렉터리 URL도 비교한다.
11. final verification까지 통과한 입력만 별도 cleanup 단계에서 `zip/`에서 삭제한다.

권장 파이프라인은 다음 순서를 고정한다.

```text
archive-inbox-detect
  ↓
archive-build (기존 HTML 기준)
  ↓
archive-manifest-verify
  ↓
commit-record
  ↓
deploy
  ↓
live-verify
  ↓
sync-project-index (동일 canonical 목록 연결)
  ↓
final-verify (상세·프로젝트 홈·중앙 홈·최상위 목록)
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
- 프로젝트 홈과 중앙 인덱스가 갱신됐고 같은 기록 목록이 렌더링된다.
- 운영 배포가 완료됐다.
- 운영 상세 URL과 미디어가 실제 동작한다.

하나라도 실패하면 ZIP 또는 작업 폴더는 그대로 둔다.

## 공개/비공개 분리

공개 자료만 Public GitHub 저장소의 수집함에 넣는다. 민감하거나 비공개인 자료는 해당 `<project>-private` 저장소의 수집함에서 처리한다. 수집함 방식은 공개 범위를 바꾸지 않는다.

공개 목록 동기화를 이유로 비공개 저장소 원문·미디어를 공개 브라우저에서 가져오거나 Public 저장소에 복사하지 않는다.

## 관련 기준

- `projects/README.md` — 전역 아카이브 배포 규칙
- `projects/PROJECT-HOME-POLICY.md` — 프로젝트 홈·상세 링크·GitHub 디렉토리 링크 규칙

## 소스 반영과 운영 반영의 구분

`projects.json`, 프로젝트 홈 HTML, GitHub commit이 존재해도 운영 GitHub Pages에 예전 화면이 보이면 미완료다. 반드시 `https://softm.github.io/projects/<project>/`와 `https://softm.github.io/projects/`를 실제 브라우저에서 열어 새 기록/프로젝트 카드가 렌더링되는지 확인한다.


## 2026-10-06 보완: 중앙 프로젝트 페이지 반영 누락 방지

**개별 저장소 반영이나 GitHub Pages/Vercel 배포 성공은 아카이브 배포의 중간 단계일 뿐 완료 조건이 아니다.**

아카이브 배포를 요청받으면 공개/비공개 여부와 관계없이 다음 완료 게이트를 **한 작업 단위로 끝까지 수행**한다.

1. 원본/ZIP/폴더 확인 및 canonical 기록 확정
2. 기록 상세 디렉토리와 원본·미디어 반영
3. GitHub 원본 저장소 커밋
4. 실제 웹 배포(Pages 또는 Vercel)
5. 프로젝트 자체 홈/목록 갱신
6. 중앙 `projects/projects.json` 갱신
7. 중앙 `/projects/<project>/` 프로젝트 홈 갱신
8. 최상위 `/projects/` 전체 프로젝트 정보 갱신
9. 프로젝트 홈 → 기록 상세 링크, 전체 프로젝트 → 프로젝트 홈 링크 실제 검증
10. 상세·미디어·인증·404/403/500 검증

**금지:** Vercel 상태가 `READY`, GitHub Actions가 성공, 개별 저장소의 `index.html`이 갱신됐다는 이유만으로 “아카이브 배포 완료”라고 보고하지 않는다.

완료 보고 전에 아래를 필수 체크한다.

- [ ] 개별 기록 상세 운영 반영
- [ ] 프로젝트 자체 홈/목록 반영
- [ ] `projects/projects.json` 반영
- [ ] `/projects/<project>/` 실제 렌더링 확인
- [ ] `/projects/` 실제 프로젝트 정보 반영 확인
- [ ] 공개/비공개 링크 및 인증 확인
- [ ] 미디어/첨부파일 확인

하나라도 빠지면 상태는 **미완료**이며 즉시 누락 단계를 수행한다.

## 2026-10-07 필수 보완: 비공개 아카이브 오배포 방지 게이트

비공개 아카이브에서는 아래 규칙을 **작업 시작 전 확인하는 강제 사전점검(preflight)** 으로 사용한다. 이 확인 없이 Vercel 설정, `vercel.json`, 프로젝트 루트, 빌드 대상 또는 중앙 링크를 수정하지 않는다.

### 비공개 아카이브 절대 구조

```text
Private GitHub (<project>-private)
  ├─ archive/ 또는 zip/ 원본 HTML·MD·PDF·이미지·영상·음성
  └─ 유일한 Source of Truth
          ↓ 요청 시
Vercel server-side gateway
  ├─ 인증
  ├─ GitHub API
  ├─ GITHUB_TOKEN (server-side only)
  └─ no-store 스트리밍/렌더링
          ↓
인증된 브라우저
```

### 절대 금지

- Private GitHub의 `zip/`, `archive/`, HTML, PDF, 이미지, 영상, 음성, 문서를 Vercel **정적 배포물에 복제하지 않는다**.
- Vercel 프로젝트가 Private GitHub 저장소에 Git 연결되어 있다는 이유로 저장소 전체를 정적 사이트로 배포하지 않는다.
- `index.html`을 프로젝트 루트에 두고 Vercel이 이를 직접 정적 제공하는 구조를 비공개 live-read 구조로 오인하지 않는다.
- Vercel `READY`만 보고 비공개 아카이브 완료라고 보고하지 않는다.
- Shared `GITHUB_TOKEN`이 이미 프로젝트에 연결되어 있다는 사용자 확인이 있으면 프로젝트 전용 `GITHUB_TOKEN`을 새로 만들거나 다시 요구하지 않는다.
- 프로젝트 env 조회 결과에 Shared Environment Variable이 나타나지 않는다는 이유만으로 Shared token이 없다고 단정하지 않는다.
- 사용자가 이미 완료한 설정을 근거 없이 다시 하도록 요구하지 않는다.

### Vercel 역할 제한

Vercel에는 원칙적으로 **게이트웨이/API/로그인 코드만 빌드 대상으로 포함**한다. 예:

```json
{
  "builds": [
    { "src": "api/render.js", "use": "@vercel/node" }
  ]
}
```

라우터는 요청 경로를 서버 함수로 보내고, 서버 함수가 Private GitHub `main`에서 최신 파일을 읽는다. HTML 내부 상대경로도 같은 게이트웨이를 통하도록 보정한다.

### 작업 전 필수 preflight

비공개 아카이브 작업은 먼저 아래를 확인한다.

- [ ] 대상 저장소가 Private GitHub인지
- [ ] 기존 Vercel 프로젝트가 어느 저장소에 연결되어 있는지
- [ ] 기존 정상 비공개 프로젝트의 구현(`baksok-private`, `ungdo-private` 등)을 비교했는지
- [ ] Shared `GITHUB_TOKEN` 연결 여부가 이미 확인됐는지
- [ ] Vercel의 build 대상이 API/gateway만인지
- [ ] `zip/`, `archive/` 원본이 정적 output에 들어가지 않는지
- [ ] Vercel Authentication 또는 기존 프로젝트 인증이 유지되는지
- [ ] 중앙 `projects.json` 링크가 인증된 live-read 주소를 가리키는지

### 완료 검증

다음 두 종류를 별도로 검증한다.

1. **배포 구조 검증**
   - Vercel 배포 타입에 서버 함수가 존재
   - 운영 배포 커밋 SHA가 최신 게이트웨이 코드와 일치
   - Vercel build 설정이 원본 디렉터리를 static build 대상으로 포함하지 않음

2. **live-read 검증**
   - GitHub `main`의 HTML이 운영 URL에서 조회됨
   - 상세 HTML의 CSS/JS/이미지/PDF/음성 링크가 같은 gateway 경로로 정상 동작
   - `Cache-Control: private, no-store`
   - 인증 전 민감 원본 직접 접근 불가
   - GitHub 원본 변경 후 Vercel 재배포 없이 최신 내용 조회 가능

### 기준 위반 발견 시 처리

오배포를 발견하면 설명만 하지 말고 다음 순서로 즉시 복구한다.

```text
직접 원본 노출 차단
→ static build 대상 제거
→ GitHub live-read gateway 적용
→ 인증 유지 확인
→ 운영 상세/미디어 검증
→ 중앙 projects 링크/상태 교정
→ 중앙 기준 문서와 CHANGELOG 갱신
```

이 게이트는 비공개 아카이브의 다른 일반 규칙보다 우선한다.

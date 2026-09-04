# 웹 배포 프로젝트 인덱스 운영 규칙

`https://softm.github.io/projects/`는 프로젝트별 공개·비공개 웹 배포의 상태, 링크와 간단한 설명을 모으는 중앙 인덱스다.

## 배포 명령

- `웹 배포`: 프로젝트 공개 저장소의 GitHub Pages에 배포한다.
- `비공개 웹 배포`: 같은 프로젝트의 `-private` 접미사 비공개 저장소와 인증된 별도 사이트에 배포한다.
- `지피트 웹 배포`: ChatGPT Sites와 ChatGPT 인증을 사용한다.

## 필수 동기화 규칙

다음 변경은 프로젝트 저장소 작업과 **같은 작업 단위**에서 반드시 `projects/projects.json`에 반영한다.

- 공개 또는 비공개 프로젝트 생성
- 프로젝트 삭제·보관·이름 변경
- 공개 URL 또는 인증 URL 변경
- 공개 → 비공개, 비공개 → 공개 전환
- 공개+비공개 병행 상태 변경
- 실제 배포 전·후의 `pending` ↔ `deployed` 상태 변경
- 프로젝트 홈 URL 생성·변경

변경 후에는 `https://softm.github.io/projects/`에서 카드, 공개 여부, 링크와 상태가 실제로 보이는지 확인한다. 저장소만 만들거나 공개 범위만 바꾸고 중앙 인덱스를 갱신하지 않은 작업은 완료로 보지 않는다.

## 프로젝트 홈 연결 규칙

- 중앙 인덱스에서 프로젝트 카드를 누르면 개별 채팅 페이지가 아니라 **해당 프로젝트 홈**으로 이동해야 한다.
- `homeUrl`은 카드 클릭과 `프로젝트 홈` 버튼의 기준 URL이다.
- 공개 프로젝트는 `homeUrl`과 `publicUrl`을 같은 프로젝트 홈으로 맞춘다.
- 비공개 프로젝트는 `homeUrl`과 `privateUrl`을 인증 게이트가 있는 프로젝트 홈으로 맞춘다.
- 공개+비공개 병행 프로젝트는 안전한 공개 홈을 `homeUrl`로 두고, 인증 홈은 `privateUrl`로 별도 표시한다.
- 전용 프로젝트 홈이 아직 없으면 임시 개별 페이지를 홈처럼 숨기지 말고, `deploymentStatus`와 설명에서 홈 구현 필요 상태를 표시한다.

## 공개 범위

- 공개 프로젝트는 공개 사이트와 공개 GitHub 저장소 링크를 표시한다.
- 비공개 프로젝트도 프로젝트명과 비공개 상태는 중앙 인덱스에 표시한다.
- 비공개 저장소 주소, 비밀번호, 원본 자료와 개인정보는 노출하지 않는다.
- 인증 URL은 공개 인덱스에 표시해도 되는 것으로 확인된 주소만 `privateUrl`에 넣는다.
- 공개 사이트와 비공개 사이트가 모두 있으면 `visibility: "mixed"`로 표시하고, 안전한 경우 상호 이동 링크를 제공한다.

## 구조

- 프로젝트마다 별도 저장소와 별도 사이트를 사용한다.
- 프로젝트 저장소 안에서는 채팅별 페이지를 메뉴로 묶는다.
- 프로젝트 콘텐츠를 `softm.github.io` 메인 저장소에 복사하지 않는다.
- `softm.github.io/projects/`는 링크, 설명, 공개 여부와 배포 상태만 중앙화한다.

## `projects.json` 주요 필드

- `repo`: 중앙 인덱스용 프로젝트 식별자. 비공개 저장소의 실제 이름을 노출할 필요는 없다.
- `title`: 화면에 표시할 프로젝트명
- `category`: 프로젝트 분류
- `description`: 간단한 설명
- `visibility`: `public`, `private`, `mixed`
- `repoVisibility`: GitHub 링크 노출 여부를 결정하는 `public`, `private`, `missing`
- `deploymentStatus`: `pending`, `deployed`, `unverified`, `needsHome`
- `homeUrl`: 중앙 인덱스 카드 클릭 및 `프로젝트 홈` 버튼의 기준 URL
- `publicUrl`: 실제 운영 중인 공개 프로젝트 홈 또는 공개 사이트 주소
- `privateUrl`: 공개 인덱스에 표시해도 되는 인증 프로젝트 홈 주소만 선택적으로 지정
- `pageCount`, `privatePageCount`: 공개·비공개 채팅 페이지 수
- `order`: 표시 순서

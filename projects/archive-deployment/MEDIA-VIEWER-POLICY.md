# 아카이브 미디어·문서 뷰어/플레이어 기준

확정: 2026-10-07 · 사용자 요청: 텍스트·이미지·동영상·PDF 등 가능한 모든 포맷에 플레이어/뷰어 적용. 현재 프로젝트에도 적용.

## 공통 필수 원칙

아카이브는 다운로드 링크만 나열하지 않는다. 사용 가능한 브라우저 뷰어/플레이어 또는 안전한 미리보기를 제공하고 원본 열기·다운로드를 항상 유지한다. 원본 HTML 우선, HTML 없는 MD의 전체 본문 HTML 변환 기준은 유지한다.

| 형식 | 구현 기준 | 제한/대체 |
|---|---|---|
| TXT·LOG·JSON·XML·YAML·녹취·코드·자막 | 읽기 전용 텍스트, 줄바꿈, 인코딩 선택, 복사 | 큰 파일은 한도 안내와 원본 |
| MD·Markdown | 정제한 HTML 본문/원문 전환 | 원본 MD 유지, 외부 자동 로딩 차단 |
| HTML·HTM | 스크립트를 실행하지 않는 격리 미리보기 | 원본 파일과 미리보기를 구분 |
| JPG·PNG·WEBP·GIF·AVIF·SVG·BMP·ICO | 썸네일, 확대/축소·회전·화면맞춤·이전/다음 | 브라우저 지원에 따름 |
| HEIC·HEIF·TIFF·PSD | 가능한 경우 별도 PNG 미리보기 생성 | 원본은 그대로, 실패 이유 표시; PSD는 합성 이미지, TIFF는 첫 페이지임을 명시 |
| MP4·WEBM·MOV·M4V·OGV 등 | controls, metadata preload, 모바일 playsinline, 배속·10초 탐색 | 확장자만으로 재생 보장 금지. 미지원 코덱이면 원본/호환 파생본 |
| MP3·M4A·WAV·OGG·FLAC·AAC·OPUS 등 | 오디오 controls, 배속·10초 탐색 | 브라우저·코덱 제한 및 원본 링크 |
| PDF | PDF.js 페이지 이동·확대·회전; 실패 시 브라우저 PDF 뷰어 | 암호/손상/용량 제한을 안내하고 원본 제공 |
| DOCX | 같은 사이트의 로컬 라이브러리로 문서 미리보기 | 서식·서명 확인은 원본/PDF. 외부 관계·매크로 실행 금지 |
| XLSX·XLS·XLSB·ODS·CSV·TSV | 시트 선택과 표 보기, 행 단위 탐색 | 저장된 값 보기. 수식·매크로 실행 금지; 대형 데이터 제한 표시 |
| PPTX·ODT·ODP·HWPX·EPUB | 텍스트와 내장 이미지 중심 구조 미리보기 | 원본 레이아웃·쪽나눔·애니메이션의 완전 재현으로 표시하지 않음 |
| ZIP | 내부 파일명·크기 목록, 지원 항목 선택 미리보기 | 자동 전체 해제/실행 금지, 개수·용량·경로 안전검사 |
| DOC·PPT·HWP·7Z·RAR·기타 미지원 바이너리 | 이름·크기·형식 및 원본 다운로드 | 가능한 안전한 파생 미리보기가 있을 때 추가, 불가능을 숨기지 않음 |

## 보안·원본·접근성

- 비공개 파일은 인증된 동일 사이트에서만 로드한다. Google Docs Viewer, Office Online 등 외부 뷰어에 private URL이나 원문을 보내지 않는다.
- 뷰어 코드는 형식별로 필요할 때 읽는다. 라이브러리는 버전과 해시·라이선스를 기록하고 같은 사이트에서 제공한다.
- HTML/MD는 정제 및 sandbox/CSP로 스크립트·이벤트·외부 자동 요청을 제한한다. 문서의 외부 참조·매크로·수식을 실행하지 않는다.
- 모든 원본 파일은 바이트와 SHA-256을 유지한다. 썸네일·프리뷰·뷰어 진입 HTML은 generated 산출물로 구분한다.
- 원본 HTML 파일과 내용·레이아웃은 보존한다. 뷰어를 붙이는 generated index에는 최소 진입 코드만 추가하고, 단독 index 원본이면 원본 보존본부터 만든다.
- 로딩, 미지원 형식, 인증 실패, 손상, 용량 제한에 각각 안내를 제공한다. 닫기/ESC, 키보드 탐색, 모바일 스크롤과 포커스를 지원한다.
- 형식 목록은 지원 시도 범위다. 같은 확장자 모든 파일의 완전한 표시·재생을 보장하지 않는다.
- 뷰어 추가 요청을 인증 완화나 새 공개 배포, 다른 프로젝트 전체 재배포 허가로 확대하지 않는다. 비공개 배포 구조 문제는 별도 상태로 보고한다.

## 자동 적용과 완료 판정

기존 canonical 기록 경로를 재사용하고 viewer-manifest.json에 이름·크기·SHA-256·뷰어 URL·파생 미리보기를 기록한다. 원본 MD 갱신/ZIP 처리 후 뷰어 생성 단계를 실행해 이후 변경에서도 유지한다. zip/ 입력은 삭제하지 않는다.

완료는 코드/커밋/READY가 아니라 실제 본문, 이미지 표시·확대, PDF 로딩, 문서 내용, 영상·음성 재생, 원본 링크, 모바일, 비인증 직접 접근 차단을 나누어 확인한다. 실제 원본이 없는 형식은 테스트 샘플 검증으로 명확히 구분한다. 공통 기준·공통 구현 수정과 다른 프로젝트 실제 적용 완료를 혼동하지 않는다.

전역 기억 저장과 중앙 기준 저장은 별도 작업이다. 메모리 도구가 비활성화된 경우 중앙 기준에 지속 보존했음을 알리고 별도의 전역 메모리 저장에 성공했다고 표현하지 않는다.

## 구현

- 공통 소스: `viewer/viewer.js`, `viewer/install.py`, `viewer/test_viewer.py`
- 재사용 Workflow: `.github/workflows/archive-viewers-reusable.yml`
- 기본 출력: `archive/_viewer/`, 각 기록의 `viewer-manifest.json`, `viewer.html`, generated index의 뷰어 연결
- 검증 상태를 중앙 프로젝트 metadata에 별도 기록하며 원본 본문은 공개 저장소로 복사하지 않는다.

## 기술 근거

PDF.js: https://github.com/mozilla/pdf.js
DOCX preview: https://github.com/VolodymyrBaydalka/docxjs
SheetJS 브라우저 배포: https://docs.sheetjs.com/docs/getting-started/installation/standalone/
브라우저 영상/음성 코덱: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats

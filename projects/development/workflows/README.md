# 공통 작업 절차

여러 GitHub 저장소에 반복 적용하는 조사 → 구현 → 테스트 → push → 배포 → 운영검증 절차를 이 디렉터리에서 관리한다.

프로젝트 전용 절차가 아니라 2개 이상의 저장소에 재사용되는 작업 흐름을 우선 기록한다.

## 비공개 아카이브 강제 게이트

비공개 아카이브 작업은 설명이나 기억만으로 완료 판정하지 않는다.

1. 중앙 기준 `projects/archive-deployment/OPERATIONS-POLICY.md`를 먼저 읽는다.
2. 새 기록을 중앙 목록에 반영할 때 `private-archive-sync.mjs`를 사용한다.
3. 완료 전 `private-archive-guard.mjs`를 실행한다.
4. guard 결과가 `PASS`가 아니면 **배포 완료라고 보고하지 않는다.**

예:

```bash
node projects/development/workflows/private-archive-sync.mjs \
  --project car \
  --record 20261025-car-insurance-history \
  --title "20261025 자동차보험 이력" \
  --date 2026-10-25 \
  --url https://car-private.vercel.app/archive/20261025-car-insurance-history/ \
  --repo-url https://github.com/softm/car-private/tree/main/archive/20261025-car-insurance-history

ARCHIVE_GITHUB_TOKEN=... node projects/development/workflows/private-archive-guard.mjs \
  --project car \
  --repo softm/car-private \
  --record 20261025-car-insurance-history
```

검사 항목은 Private GitHub, `main`, gateway, `GITHUB_TOKEN` 사용, `no-store`, Vercel 정적 원본 제외, 중앙 `projects.json`, 상세 deep-link, 익명 접근 보호다.

GitHub Actions의 **Private archive preflight** workflow에서도 같은 guard를 수동 실행할 수 있다. 다른 private 저장소를 읽으려면 저장소 Secret `ARCHIVE_GITHUB_TOKEN`에 읽기 전용 토큰을 연결한다.

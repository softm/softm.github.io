# 서해박속낙지 아카이브 배포 현황

점검·이관일: **2026-09-26**

## 현재 운영 구조

| 공개범위 | 페이지 | Source of Truth | 운영 URL |
|---|---|---|---|
| 공개 | 서해박속낙지 공개 사이트 | `softm/baksok-public:main/index.html` | https://softm.github.io/baksok-public/ |
| 공개 | RIR-4000S 13대 교체 검토 | `softm/baksok-public:main/20260819_rir4000s_13ea/` | https://softm.github.io/baksok-public/20260819_rir4000s_13ea/ |
| 비공개 | 2026-07-21 세무·매출 분석 | `softm/baksok-private:main/reports/20260721-tax/` | https://baksok-private.vercel.app/reports/20260721-tax/ |
| 비공개 | 2026-09-09 이가구 계약·가스설비 | `softm/baksok-private:main/reports/20260909-furniture-gas/` | https://baksok-private.vercel.app/reports/20260909-furniture-gas/ |
| 비공개 | 2026-09-11 RIR-4000S 5대 배송완료 | `softm/baksok-private:main/reports/20260911-rir4000s-delivery/` | https://baksok-private.vercel.app/reports/20260911-rir4000s-delivery/ |

## ChatGPT Site 이관

### 공개 사이트
- 이전: `https://seohae-baksok-nakji.softm.chatgpt.site`
- 현재 Source of Truth: `softm/baksok-public`
- 현재 배포: GitHub Pages
- 현재 URL: https://softm.github.io/baksok-public/
- 상태: **아카이브 방식으로 이관**

### 세무·매출 사이트
- 이전: `https://seohae-baksok-nakji-tax.softm.chatgpt.site`
- 현재 Source of Truth: `softm/baksok-private` (Private)
- 현재 배포: Vercel `baksok-private`
- 현재 URL: https://baksok-private.vercel.app/reports/20260721-tax/
- 보호: 로그인 인증 + noindex/nofollow/noarchive
- 상태: **아카이브 방식으로 이관**

기존 `*.softm.chatgpt.site` 주소는 프로젝트의 주 운영 링크에서 제거하고 이전 배포 이력으로만 남긴다.

## 인덱스
- 프로젝트 홈: https://softm.github.io/baksok/
- 최상위 프로젝트 인덱스: https://softm.github.io/projects/

## 고정 배포 원칙
- 공개: Public GitHub Source of Truth → GitHub Pages
- 비공개: Private GitHub Source of Truth → Vercel → 인증
- 프로젝트 홈 및 최상위 `/projects/` 인덱스를 함께 갱신

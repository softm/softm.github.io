# 가계부 전용 D1 분리 · gagyebu-db

## 확정 아키텍처

| 구성 | 역할 | 데이터 |
| --- | --- | --- |
| softm-hannun-account Worker/D1 | SNS 인증, 공통 UID, 세션 | users, identities, sessions |
| gagyebu-db (신규 D1) | 가계부 암호화 장부 | gagyebu_ledger_heads/chunks/versions |
| PC/Android 가계부 | 같은 공통 UID로 D1 장부 접근 | 수입·지출·계좌·예산 |

**주의:** 2026-11-12 현재 이 문서는 신규 DB 준비 단계다. 현재 운영 Worker는 아직 기존 DB의 가계부 테이블을 사용한다. 실제 Cloudflare DB 생성, 기존 데이터 복사, 운영 Worker 바인딩 변경은 아직 수행되지 않았다.

## 1. 신규 D1 생성 (기존 DB 영향 없음)

GitHub Actions → `Provision isolated gagyebu-db (manual, no cutover)` → Run workflow.
입력값 `CREATE_GAGYEBU_DB`로 실행한다.

워크플로:
- Cloudflare API Token/Account ID 확인
- `gagyebu-db`가 없을 때만 생성
- `gagyebu-db-schema.sql` 적용
- 신규 DB ID 및 테이블 목록 확인

이 단계에서는 `softm-hannun-account` D1, 기존 Worker 바인딩, Firebase 원본 장부에 변경이 없다.

## 2. 운영 전환 전에 필요한 사항

1. 현재 공통 D1의 `gagyebu_ledger_heads`, `gagyebu_ledger_chunks`, `gagyebu_ledger_versions`를 일관된 시점에 백업한다.
2. 신규 `gagyebu-db`에 세 테이블을 사용자별로 복사한다. 신규 DB에는 `users` 테이블이 없으므로 기존의 외래키 관계는 제거하되 `user_id`를 그대로 유지한다.
3. 각 사용자별 head/revision/chunk_count/암호문 블록의 수·길이·체크섬을 비교한다. `GAGYEBU_LEDGER_KEY_V1`은 변경하지 않는다.
4. 운영 중 쓰기 발생을 고려하여 전환 시점의 신규 쓰기를 잠시 막고, 최종 증분을 복사한 후 일치 여부를 검증한다.
5. Worker에 별도 `LEDGER_DB` D1 바인딩을 설정하고 **가계부 장부 라우트만** 신규 DB를 사용하게 한다. 공통 계정 라우트는 기존 `DB` 바인딩 유지.
6. PC·Android 같은 Cloudflare UID로 읽기·쓰기·재접속·충돌 처리 검증 후 가계부 쓰기를 재개한다.
7. 원본 공통 D1 테이블은 일정 기간 보존하고, 충분한 검증과 백업 후 별도 삭제 승인 절차를 진행한다.

**별도 Firebase Firestore `suite-v1` 원격 장부는 Cloudflare 기존 D1의 데이터와 다른 이전 대상**이다. Firestore 서버에만 있는 자료는 별도 인증된 이전 작업이 필요하며 자동 복사하지 않는다.

## 링크

- [수동 DB 생성 Actions](https://github.com/softm/softm.github.io/actions/workflows/provision-gagyebu-db.yml)
- [독립 D1 스키마](../gagyebu-db-schema.sql)
- [기존 Worker 설정](../wrangler.jsonc)

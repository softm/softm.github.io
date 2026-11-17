# juyuhannun-api

주유한눈 로그인 사용자의 찜한 주유소를 전용 D1 `juyuhannun-db`에 보관하는 Worker입니다.

- 인증: `softm-hannun-account` 서비스 바인딩의 `juyuhannun` 세션 검증
- 저장: 사용자별 AES-GCM 암호문 한 행과 optimistic revision
- 병합: 클라이언트의 항목·삭제 tombstone 병합
- 삭제: `DELETE /api/apps/juyuhannun/favorites`

필수 Worker secret은 `JUYU_FAVORITES_KEY_V1`이며 32바이트 base64url 값입니다.

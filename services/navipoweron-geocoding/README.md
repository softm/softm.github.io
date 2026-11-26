# 티맵자동실행 해외 지도 검색 Worker

Geoapify API 키를 브라우저와 Android 앱 자산에 노출하지 않는 전용 프록시입니다.

1. Geoapify 계정을 만들고 API key를 발급합니다.
2. Cloudflare 계정에서 Workers를 활성화하고 이 디렉터리에서 `npm install`을 실행합니다.
3. `npx wrangler secret put GEOAPIFY_API_KEY`로 키를 암호화 secret에 등록합니다.
4. `npm run deploy`로 배포합니다.
5. 배포 주소가 기본값과 다르면 웹 배포 시 `window.SOFTM_GEOAPIFY_WORKER_URL`을 설정합니다.

키는 `wrangler.toml`, GitHub Secrets 이외의 소스, HTML/JS 또는 로그에 기록하지 않습니다. 운영 허용 Origin은 `https://softm.github.io` 하나이며 `file:///android_asset`에서는 Worker를 호출하지 않습니다.

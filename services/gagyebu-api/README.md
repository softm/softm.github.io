# gagyebu-api (dedicated Cloudflare Worker)

- Dedicated service API: `POST /api/apps/gagyebu/ledger`
- Own D1 binding: `gagyebu-db`
- Identity-only verification: `softm-hannun-account` service binding via `GET /api/apps/gagyebu/session`
- The account Worker never needs access to the dedicated D1 after cutover.
- Required secret: `GAGYEBU_LEDGER_KEY_V1` (must be the **same existing 32-byte base64 secret** as the old account Worker, or previously encrypted ledgers cannot be decrypted).
- Do **not** deploy/cut over until the secret is set and both PC/Android clients are switched and verified.
- CORS permits `https://softm.github.io` and Android local asset origin.
- No SMS/receipt raw content is sent to this Worker.

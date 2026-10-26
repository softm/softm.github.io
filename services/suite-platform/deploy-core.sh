#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
cmp ../../shared/platform/v1/registry.json functions/registry.json
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm ci --prefix functions --ignore-scripts --no-audit --no-fund
# Only the newly added codebase/function and named DB. Never deploy/delete directions.
npx -y firebase-tools@latest deploy --project softm-hannun-api --only functions:suite-platform:suiteAuth,firestore --non-interactive

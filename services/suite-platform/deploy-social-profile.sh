#!/usr/bin/env bash
# Run in the EXISTING authenticated Firebase deployment workspace.
# Never creates/replaces credentials, .env files, secrets, IAM or database rules.
set -euo pipefail
set +x
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
MODE="${1:---check}"
case "$MODE" in --check|--deploy|--verify) ;; *) echo 'Usage: bash deploy-social-profile.sh [--check|--deploy|--verify]' >&2; exit 2;; esac
PROJECT='softm-hannun-api'
TARGET='functions:suite-platform:suiteSocialAuth'
HEALTH='https://asia-northeast3-softm-hannun-api.cloudfunctions.net/suiteSocialAuth/health'
EXPECTED='20261030-1'
fail() { printf '%s\n' "$1" >&2; exit 1; }
command -v node >/dev/null || fail 'Node.js 22 이상이 필요합니다.'
verify() {
  command -v curl >/dev/null || return 1
  curl --fail --silent --show-error --max-time 20 "$HEALTH" | node -e '
    let text="";process.stdin.on("data",chunk=>text+=chunk);
    process.stdin.on("end",()=>{try{const value=JSON.parse(text);
      if(value.ok!==true||value.databaseId!=="suite-v1"||value.profileVersion!==process.argv[1])process.exit(1);
      console.log("운영 프로필 코드 버전 확인: "+value.profileVersion);
    }catch{process.exit(1);}});' "$EXPECTED"
}
if [[ "$MODE" == '--verify' ]]; then
  verify || fail '운영 응답에서 목표 프로필 버전을 확인하지 못했습니다. 배포 완료로 판단하지 않습니다.'
  exit 0
fi
node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' || fail 'Node.js 22 이상이 필요합니다.'
for file in firebase.json functions/index.mjs functions/provider-profile.mjs functions/package-lock.json tests/provider-profile.test.mjs; do
  [[ -f "$file" ]] || fail "최신 배포 소스가 없습니다: $file"
done
[[ -f "functions/.env.$PROJECT" ]] || fail '기존 functions/.env.softm-hannun-api가 없습니다. 이전에 배포한 작업 폴더에서 실행하세요. 빈 설정 파일을 만들지 않습니다.'
ENV_ARGS=()
[[ ! -f functions/.env ]] || ENV_ARGS+=(--env-file=functions/.env)
ENV_ARGS+=(--env-file="functions/.env.$PROJECT")
node "${ENV_ARGS[@]}" --input-type=module - <<'JS'
import fs from 'node:fs';
const stop=message=>{console.error(message);process.exit(1);};
for(const key of ['SUITE_KAKAO_CLIENT_ID','SUITE_NAVER_CLIENT_ID']){
  const value=process.env[key];
  if(!value||!value.trim()||/placeholder|your[_-]|replace[_-]|example/i.test(value))stop('기존 SNS 설정을 확인하세요: '+key);
}
if(process.env.SUITE_ENABLE_SOCIAL!=='true')stop('기존 환경의 SUITE_ENABLE_SOCIAL=true 설정이 필요합니다.');
const config=JSON.parse(fs.readFileSync('firebase.json','utf8'));
if(!config.functions?.some(x=>x.source==='functions'&&x.codebase==='suite-platform'&&x.runtime==='nodejs22'))stop('배포 코드베이스 또는 런타임이 예상과 다릅니다.');
const source=fs.readFileSync('functions/index.mjs','utf8');
if(!source.includes("profileVersion:'20261030-1'")||!source.includes('await syncProviderProfile('))stop('SNS 프로필 갱신 코드가 없는 버전입니다.');
console.log('대상 프로젝트·함수·프로필 코드·기존 SNS 설정 검사 통과. 설정값은 출력하지 않았습니다.');
JS
node --check functions/index.mjs
node --check functions/provider-profile.mjs
node --test tests/provider-profile.test.mjs
if [[ "$MODE" == '--check' ]]; then
  echo '사전검사만 완료했습니다. 운영 배포는 수행하지 않았습니다.'
  exit 0
fi
command -v npm >/dev/null || fail 'npm이 필요합니다.'
command -v curl >/dev/null || fail '배포 후 검증에 curl이 필요합니다.'
# Reuse the existing Firebase login/ADC. Never create an account or IAM grant.
if command -v firebase >/dev/null; then FIREBASE_CLI=(firebase); else FIREBASE_CLI=(npx --yes firebase-tools@latest); fi
cmp ../../shared/platform/v1/registry.json functions/registry.json
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm ci --prefix functions --ignore-scripts --no-audit --no-fund
printf '배포 대상: %s / %s\n' "$PROJECT" "$TARGET"
"${FIREBASE_CLI[@]}" deploy --project "$PROJECT" --only "$TARGET" --non-interactive
for attempt in 1 2 3 4 5 6; do
  if verify; then
    echo 'suiteSocialAuth 프로필 코드 배포 및 운영 버전 확인 완료. 실제 SNS 재로그인·사진 제공 동의 검증은 별도입니다.'
    exit 0
  fi
  [[ "$attempt" == 6 ]] || sleep 5
done
fail 'CLI 배포 이후에도 목표 버전이 확인되지 않습니다. 성공으로 처리하지 않습니다.'

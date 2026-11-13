import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.mjs";

const origin = "https://tojiiyonghannun.designboard.net";
const base = "https://softm-hannun-account.softm.workers.dev";
const proof = "a".repeat(43);
const env = {
  RATE_LIMIT_SALT: "local-test-only",
  DB: {
    prepare() {
      return {
        bind() { return this; },
        async run() { return {meta: {changes: 1}}; }
      };
    }
  }
};

async function connect(site, targetOrigin) {
  const url = new URL("/connect", base);
  url.searchParams.set("site", site);
  url.searchParams.set("origin", targetOrigin);
  url.searchParams.set("challenge", proof);
  url.searchParams.set("request", proof);
  return worker.fetch(new Request(url), env);
}

test("토지이용한눈의 정확한 운영 출처는 공통 계정 팝업에 등록된다", async () => {
  const response = await connect("tojiiyonghannun", origin);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/connect");
  assert.match(response.headers.get("set-cookie") || "", /__Host-sh_connect=/);
});

test("토지이용한눈의 유사 도메인과 다른 사이트 ID는 거부한다", async () => {
  for (const [site, candidate] of [
    ["tojiiyonghannun", "https://evil.tojiiyonghannun.designboard.net"],
    ["tojiiyonghannun", "https://tojiiyonghannun.designboard.net.attacker.test"],
    ["tojiiyonghannun", "http://tojiiyonghannun.designboard.net"],
    ["unknown-toji", origin]
  ]) {
    const response = await connect(site, candidate);
    assert.equal(response.status, 403);
  }
});

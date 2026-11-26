import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const env = { ALLOWED_ORIGINS: "https://softm.github.io" };
const ctx = { waitUntil() {} };

test("health endpoint is available without exposing a key", async () => {
  const response = await worker.fetch(new Request("https://example.test/health"), env, ctx);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "navipoweron-geocoding" });
});

test("rejects unapproved origins", async () => {
  const response = await worker.fetch(new Request("https://example.test/v1/search?text=Seoul", { headers: { Origin: "https://evil.example" } }), env, ctx);
  assert.equal(response.status, 403);
});

test("reports missing secret without returning it", async () => {
  const response = await worker.fetch(new Request("https://example.test/v1/search?text=Seoul", { headers: { Origin: "https://softm.github.io" } }), env, ctx);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "service_not_configured" });
});

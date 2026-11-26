const GEOAPIFY_BASE = "https://api.geoapify.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = String(env.ALLOWED_ORIGINS || "https://softm.github.io").split(",").map((v) => v.trim());
    const corsOrigin = allowedOrigins.includes(origin) ? origin : "";

    if (request.method === "OPTIONS") {
      return corsOrigin ? new Response(null, { status: 204, headers: corsHeaders(corsOrigin) }) : json({ error: "origin_not_allowed" }, 403);
    }
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, corsOrigin);
    if (url.pathname === "/health") return json({ ok: true, service: "navipoweron-geocoding" }, 200, corsOrigin);
    if (!corsOrigin) return json({ error: "origin_not_allowed" }, 403);
    if (!env.GEOAPIFY_API_KEY) return json({ error: "service_not_configured" }, 503, corsOrigin);

    const upstream = buildUpstream(url, env.GEOAPIFY_API_KEY);
    if (!upstream) return json({ error: "invalid_request" }, 400, corsOrigin);

    const cache = caches.default;
    const cacheKey = new Request(upstream.toString(), { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) return withCors(cached, corsOrigin);

    const response = await fetch(upstream, { headers: { Accept: "application/json" } });
    if (!response.ok) return json({ error: response.status === 429 ? "quota_exceeded" : "provider_error" }, response.status === 429 ? 429 : 502, corsOrigin);
    const body = await response.text();
    const stored = new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" } });
    ctx.waitUntil(cache.put(cacheKey, stored.clone()));
    return withCors(stored, corsOrigin);
  }
};

function buildUpstream(requestUrl, apiKey) {
  const target = new URL(GEOAPIFY_BASE);
  const lang = clean(requestUrl.searchParams.get("lang"), 8) || "en";
  const limit = Math.min(Math.max(Number(requestUrl.searchParams.get("limit")) || 10, 1), 20);
  if (requestUrl.pathname === "/v1/search") {
    const text = clean(requestUrl.searchParams.get("text"), 160);
    if (!text) return null;
    target.pathname = "/v1/geocode/search";
    target.searchParams.set("text", text);
    target.searchParams.set("lang", lang);
    target.searchParams.set("limit", String(limit));
    const bias = clean(requestUrl.searchParams.get("bias"), 80);
    if (bias && /^proximity:-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(bias)) target.searchParams.set("bias", bias);
  } else if (requestUrl.pathname === "/v1/reverse") {
    const point = coordinates(requestUrl);
    if (!point) return null;
    target.pathname = "/v1/geocode/reverse";
    target.searchParams.set("lat", String(point.lat));
    target.searchParams.set("lon", String(point.lon));
    target.searchParams.set("lang", lang);
    target.searchParams.set("limit", "1");
  } else if (requestUrl.pathname === "/v1/nearby") {
    const point = coordinates(requestUrl);
    if (!point) return null;
    target.pathname = "/v2/places";
    target.searchParams.set("categories", "commercial,catering,accommodation,tourism,leisure,public_transport,service");
    target.searchParams.set("filter", `circle:${point.lon},${point.lat},100`);
    target.searchParams.set("bias", `proximity:${point.lon},${point.lat}`);
    target.searchParams.set("limit", String(limit));
  } else return null;
  target.searchParams.set("apiKey", apiKey);
  return target;
}

function coordinates(url) {
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ? { lat, lon } : null;
}
function clean(value, max) { return String(value || "").trim().slice(0, max); }
function corsHeaders(origin) { return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Accept", "Access-Control-Max-Age": "86400", Vary: "Origin" }; }
function withCors(response, origin) { const headers = new Headers(response.headers); Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v)); return new Response(response.body, { status: response.status, headers }); }
function json(value, status, origin = "") { const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }; if (origin) Object.assign(headers, corsHeaders(origin)); return new Response(JSON.stringify(value), { status, headers }); }

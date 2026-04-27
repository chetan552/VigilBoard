// Vigilboard service worker.
// Strategies:
//   - HTML / API → network-first, fallback to cache (so brief WiFi blips work)
//   - Static assets (JS, CSS, fonts, images) → cache-first
//   - External APIs (open-meteo, allorigins, bible-api) → stale-while-revalidate

const CACHE_VERSION = "v1";
const STATIC_CACHE = `vigilboard-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vigilboard-runtime-${CACHE_VERSION}`;
const EXTERNAL_CACHE = `vigilboard-external-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  // Activate immediately on first install
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/icon-192.svg", "/icon-512.svg", "/manifest.webmanifest"]).catch(() => {})
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, EXTERNAL_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2")
  );
}

function isExternalApi(url) {
  return [
    "api.open-meteo.com",
    "geocoding-api.open-meteo.com",
    "api.allorigins.win",
    "bible-api.com",
  ].includes(url.hostname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip Chrome extension, dev server hot-reload, and OAuth flows
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.pathname.startsWith("/api/auth/")) return;
  if (url.pathname.includes("/_next/webpack-hmr")) return;

  // Static assets — cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // External APIs — stale-while-revalidate
  if (isExternalApi(url)) {
    event.respondWith(
      caches.open(EXTERNAL_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fetchPromise;
      })
    );
    return;
  }

  // Same-origin HTML/API — network-first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || new Response("Offline", { status: 503 })))
    );
  }
});

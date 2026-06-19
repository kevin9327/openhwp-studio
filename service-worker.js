const CACHE_VERSION = "openhwp-studio-v0.1.0-alpha.3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./export-format-utils.js",
  "./site.webmanifest",
  "./favicon.svg",
  "./docs/assets/openhwp-studio.jpg",
  "./samples/openhwp-basic.hwpx",
  "./samples/openhwp-media.hwpx",
  "./samples/openhwp-broken-rel.hwpx",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("openhwp-studio-") && key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(navigationFallback(event.request));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});

async function navigationFallback(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await caches.match("./index.html")) || caches.match("./");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

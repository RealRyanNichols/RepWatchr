const CACHE_NAME = "repwatchr-shell-v1";
const SHELL_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/images/icon.png",
  "/images/repwatchr-logo-america-first.png",
];

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function isPrivateOrSensitive(url) {
  const path = url.pathname;
  return (
    path.startsWith("/api") ||
    path.startsWith("/admin") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/auth") ||
    path.startsWith("/login") ||
    path.startsWith("/create-account") ||
    path.startsWith("/profiles/claim") ||
    path.startsWith("/submit-source") ||
    path.startsWith("/tools/public-records-response") ||
    path.startsWith("/services/checkout") ||
    path.startsWith("/unsubscribe")
  );
}

function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.startsWith("/_next/static/") ||
    path.startsWith("/images/") ||
    path === "/manifest.webmanifest" ||
    path === "/icon.png" ||
    path === "/apple-icon.png"
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!sameOrigin(url) || isPrivateOrSensitive(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((response) => response || Response.error())),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});

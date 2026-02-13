const CACHE_VERSION = "v1";
const PRACTICE_SHELL_CACHE = `tl-practice-shell-${CACHE_VERSION}`;
const STATIC_ASSET_CACHE = `tl-static-assets-${CACHE_VERSION}`;

const SHELL_URLS = [
  "/offline.html",
  "/practice",
  "/student/practice",
  "/student/progress",
];

const STATIC_FILE_PATTERN = /\.(?:css|js|mjs|woff2?|ttf|otf)$/i;

function isPracticePath(pathname) {
  return (
    pathname === "/practice" ||
    pathname.startsWith("/practice/") ||
    pathname === "/student/practice" ||
    pathname.startsWith("/student/practice") ||
    pathname === "/student/progress"
  );
}

function isStaticAsset(pathname, destination) {
  return (
    pathname.startsWith("/_next/static/") ||
    STATIC_FILE_PATTERN.test(pathname) ||
    destination === "script" ||
    destination === "style" ||
    destination === "font"
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRACTICE_SHELL_CACHE);

      for (const url of SHELL_URLS) {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch {
          // Ignore failed warm-up requests; runtime caching will backfill.
        }
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const validCaches = new Set([PRACTICE_SHELL_CACHE, STATIC_ASSET_CACHE]);
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith("tl-") && !validCaches.has(key))
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_ASSET_CACHE);
  const cachedResponse = await cache.match(request);

  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response("You are offline", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function handleNavigation(request) {
  const url = new URL(request.url);
  const cache = await caches.open(PRACTICE_SHELL_CACHE);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok && isPracticePath(url.pathname)) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cachedPage = await cache.match(request);
    if (cachedPage) {
      return cachedPage;
    }

    if (isPracticePath(url.pathname)) {
      const cachedPracticeShell =
        (await cache.match("/practice")) ||
        (await cache.match("/student/practice")) ||
        (await cache.match("/student/progress"));

      if (cachedPracticeShell) {
        return cachedPracticeShell;
      }
    }

    const offlineFallback = await cache.match("/offline.html");
    if (offlineFallback) {
      return offlineFallback;
    }

    return new Response("You are offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(url.pathname, request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

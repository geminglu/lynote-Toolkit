const PAGE_CACHE_NAME = "lynote-pages-cache-v1";
const ASSET_CACHE_NAME = "lynote-assets-cache-v1";
const RUNTIME_CACHE_NAME = "lynote-runtime-cache-v1";

const PRECACHE_PATHS = ["/", "/manifest.webmanifest"];

function getBasePath() {
  const scopeUrl = new URL(self.registration.scope);
  const pathname = scopeUrl.pathname.replace(/\/$/, "");

  return pathname === "/" ? "" : pathname;
}

function withBasePath(pathname) {
  const basePath = getBasePath();

  if (!basePath) {
    return pathname;
  }

  if (pathname === "/") {
    return `${basePath}/`;
  }

  return `${basePath}${pathname}`;
}

function isSuccessfulResponse(response) {
  return response && (response.ok || response.type === "opaque");
}

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(ASSET_CACHE_NAME).then((cache) => {
      return cache.addAll(
        PRECACHE_PATHS.map((pathname) => withBasePath(pathname)),
      );
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys
          .filter(
            (cacheKey) =>
              ![PAGE_CACHE_NAME, ASSET_CACHE_NAME, RUNTIME_CACHE_NAME].includes(
                cacheKey,
              ),
          )
          .map((cacheKey) => caches.delete(cacheKey)),
      );

      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));

    if (isSuccessfulResponse(response)) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (isSuccessfulResponse(response)) {
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE_NAME));
    return;
  }

  if (requestUrl.pathname.includes("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE_NAME));
    return;
  }

  if (
    /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(
      requestUrl.pathname,
    )
  ) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE_NAME));
  }
});

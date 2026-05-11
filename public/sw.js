const PAGE_CACHE_NAME = "lynote-pages-cache-v2";
const ASSET_CACHE_NAME = "lynote-assets-cache-v2";
const RUNTIME_CACHE_NAME = "lynote-runtime-cache-v2";

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

async function openCache(cacheName) {
  try {
    return await caches.open(cacheName);
  } catch (error) {
    console.warn("Service Worker cache is unavailable", error);
    return null;
  }
}

async function matchCachedResponse(cache, request) {
  if (!cache) {
    return undefined;
  }

  try {
    return await cache.match(request);
  } catch (error) {
    console.warn("Service Worker cache read failed", error);
    return undefined;
  }
}

async function putCachedResponse(cache, request, response) {
  if (!cache || !isSuccessfulResponse(response)) {
    return;
  }

  try {
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn("Service Worker cache write failed", error);
  }
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
  const cache = await openCache(cacheName);

  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));

    await putCachedResponse(cache, request, response);

    return response;
  } catch (error) {
    const cachedResponse = await matchCachedResponse(cache, request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await openCache(cacheName);
  const cachedResponse = await matchCachedResponse(cache, request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  await putCachedResponse(cache, request, response);

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
    event.respondWith(networkFirst(request, ASSET_CACHE_NAME));
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

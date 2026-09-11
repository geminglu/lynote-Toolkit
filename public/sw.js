const CACHE_PREFIX = "lynote-tool-";
const PAGE_CACHE_NAME = `${CACHE_PREFIX}pages-cache-v3`;
const ASSET_CACHE_NAME = `${CACHE_PREFIX}assets-cache-v3`;
const RUNTIME_CACHE_NAME = `${CACHE_PREFIX}runtime-cache-v3`;
const CURRENT_CACHE_NAMES = [
  PAGE_CACHE_NAME,
  ASSET_CACHE_NAME,
  RUNTIME_CACHE_NAME,
];
const LEGACY_CACHE_NAMES = [
  "lynote-pages-cache-v2",
  "lynote-assets-cache-v2",
  "lynote-runtime-cache-v2",
];
const RUNTIME_CACHE_MAX_ENTRIES = 80;

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

function isCacheableResponse(response) {
  return isSuccessfulResponse(response) && response.status !== 206;
}

function isPathInScope(pathname) {
  const scopePathname = withBasePath("/");

  return scopePathname === "/" || pathname.startsWith(scopePathname);
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();

  if (keys.length <= maxEntries) {
    return;
  }

  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)),
  );
}

async function openCache(cacheName) {
  try {
    return await caches.open(cacheName);
  } catch {
    return null;
  }
}

async function matchCachedResponse(cache, request) {
  if (!cache) {
    return undefined;
  }

  try {
    return await cache.match(request);
  } catch {
    return undefined;
  }
}

async function cacheResponse(cache, request, response, maxEntries) {
  if (!cache) {
    return;
  }

  try {
    await cache.put(request, response.clone());

    if (maxEntries) {
      await trimCache(cache, maxEntries);
    }
  } catch {
    // 缓存受配额和浏览器策略影响，失败时仍应返回已经取得的网络响应。
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await openCache(ASSET_CACHE_NAME);

      if (!cache) {
        return;
      }

      await Promise.all(
        PRECACHE_PATHS.map((pathname) =>
          cache.add(withBasePath(pathname)).catch(() => undefined),
        ),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheKeys = await caches.keys();

        await Promise.all(
          cacheKeys
            .filter(
              (cacheKey) =>
                LEGACY_CACHE_NAMES.includes(cacheKey) ||
                (cacheKey.startsWith(CACHE_PREFIX) &&
                  !CURRENT_CACHE_NAMES.includes(cacheKey)),
            )
            .map((cacheKey) => caches.delete(cacheKey).catch(() => false)),
        );
      } catch {
        // 清理旧缓存失败不应阻止新版 Service Worker 接管页面。
      }

      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));

    if (isCacheableResponse(response)) {
      const cache = await openCache(cacheName);
      await cacheResponse(cache, request, response);
    }

    return response;
  } catch (error) {
    const cache = await openCache(cacheName);
    const cachedResponse = await matchCachedResponse(cache, request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await openCache(cacheName);
  const cachedResponse = await matchCachedResponse(cache, request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (isCacheableResponse(response)) {
    await cacheResponse(cache, request, response, maxEntries);
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

  if (!isPathInScope(requestUrl.pathname)) {
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
    event.respondWith(
      cacheFirst(request, RUNTIME_CACHE_NAME, RUNTIME_CACHE_MAX_ENTRIES),
    );
  }
});

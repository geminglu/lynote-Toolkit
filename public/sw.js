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

async function openCacheBestEffort(cacheName) {
  try {
    return await caches.open(cacheName);
  } catch {
    return undefined;
  }
}

async function matchCacheBestEffort(cache, request) {
  if (!cache) {
    return undefined;
  }

  try {
    return await cache.match(request);
  } catch {
    return undefined;
  }
}

async function putCacheBestEffort(cache, request, response) {
  if (!cache) {
    return;
  }

  try {
    await cache.put(request, response.clone());
  } catch {
    /**
     * 缓存写入依赖浏览器存储配额和隐私策略；这里不能让缓存失败覆盖
     * 已经成功的网络响应，否则页面和 chunk 会在缓存不可写时直接加载失败。
     */
  }
}

async function trimCacheBestEffort(cache, maxEntries) {
  if (!cache) {
    return;
  }

  try {
    await trimCache(cache, maxEntries);
  } catch {
    // 清理失败只影响缓存占用，不应阻断当前资源响应。
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(ASSET_CACHE_NAME)
      .then((cache) =>
        Promise.all(
          PRECACHE_PATHS.map((pathname) =>
            cache.add(withBasePath(pathname)).catch(() => undefined),
          ),
        ),
      ),
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
              LEGACY_CACHE_NAMES.includes(cacheKey) ||
              (cacheKey.startsWith(CACHE_PREFIX) &&
                !CURRENT_CACHE_NAMES.includes(cacheKey)),
          )
          .map((cacheKey) => caches.delete(cacheKey)),
      );

      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheName) {
  const cachePromise = openCacheBestEffort(cacheName);

  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));

    if (isSuccessfulResponse(response)) {
      await putCacheBestEffort(await cachePromise, request, response);
    }

    return response;
  } catch (error) {
    const cachedResponse = await matchCacheBestEffort(await cachePromise, request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await openCacheBestEffort(cacheName);
  const cachedResponse = await matchCacheBestEffort(cache, request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (isSuccessfulResponse(response)) {
    await putCacheBestEffort(cache, request, response);

    if (maxEntries) {
      await trimCacheBestEffort(cache, maxEntries);
    }
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

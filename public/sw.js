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

const PRECACHE_PAGE_PATHS = ["/"];
const PRECACHE_ASSET_PATHS = ["/manifest.webmanifest"];

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

async function openCacheBestEffort(cacheName) {
  try {
    return await caches.open(cacheName);
  } catch {
    return null;
  }
}

async function getCacheKeysBestEffort() {
  try {
    return await caches.keys();
  } catch {
    return [];
  }
}

async function addToCacheBestEffort(cache, request) {
  if (!cache) {
    return;
  }

  try {
    await cache.add(request);
  } catch {
    // 缓存写入只是加速手段，不能影响页面本身可用。
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
    // 配额或隐私存储失败时，成功的网络响应仍应返回给页面。
  }
}

async function getCacheEntryKeysBestEffort(cache) {
  if (!cache) {
    return [];
  }

  try {
    return await cache.keys();
  } catch {
    return [];
  }
}

async function deleteCacheBestEffort(cacheKey) {
  try {
    await caches.delete(cacheKey);
  } catch {
    // 旧缓存无法删除时也不能阻塞新 Service Worker 接管页面。
  }
}

async function deleteCacheEntryBestEffort(cache, request) {
  if (!cache) {
    return;
  }

  try {
    await cache.delete(request);
  } catch {
    // 缓存裁剪失败只会影响空间回收，不应中断请求。
  }
}

async function trimCacheBestEffort(cache, maxEntries) {
  const keys = await getCacheEntryKeysBestEffort(cache);

  if (keys.length <= maxEntries) {
    return;
  }

  await Promise.all(
    keys
      .slice(0, keys.length - maxEntries)
      .map((key) => deleteCacheEntryBestEffort(cache, key)),
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const [pageCache, assetCache] = await Promise.all([
        openCacheBestEffort(PAGE_CACHE_NAME),
        openCacheBestEffort(ASSET_CACHE_NAME),
      ]);

      await Promise.all([
        ...PRECACHE_PAGE_PATHS.map((pathname) =>
          addToCacheBestEffort(pageCache, withBasePath(pathname)),
        ),
        ...PRECACHE_ASSET_PATHS.map((pathname) =>
          addToCacheBestEffort(assetCache, withBasePath(pathname)),
        ),
      ]);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await getCacheKeysBestEffort();

      await Promise.all(
        cacheKeys
          .filter(
            (cacheKey) =>
              LEGACY_CACHE_NAMES.includes(cacheKey) ||
              (cacheKey.startsWith(CACHE_PREFIX) &&
                !CURRENT_CACHE_NAMES.includes(cacheKey)),
          )
          .map((cacheKey) => deleteCacheBestEffort(cacheKey)),
      );

      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheName) {
  const cache = await openCacheBestEffort(cacheName);

  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));

    if (isSuccessfulResponse(response)) {
      await putCacheBestEffort(cache, request, response);
    }

    return response;
  } catch (error) {
    const cachedResponse = await matchCacheBestEffort(cache, request);

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

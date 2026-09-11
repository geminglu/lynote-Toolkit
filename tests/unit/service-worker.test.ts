import { readFile } from "node:fs/promises";
import vm from "node:vm";

import { describe, expect, it, vi } from "vitest";

interface ServiceWorkerFunctions {
  cacheFirst(request: Request, cacheName: string): Promise<Response>;
  networkFirst(request: Request, cacheName: string): Promise<Response>;
}

async function loadServiceWorkerFunctions(
  cache: object | null,
  fetchMock: object,
) {
  const source = await readFile("public/sw.js", "utf8");
  const context = vm.createContext({
    Request,
    URL,
    caches: {
      open: async () => {
        if (!cache) {
          throw new Error("cache unavailable");
        }
        return cache;
      },
    },
    fetch: fetchMock,
    self: {
      addEventListener: () => undefined,
      clients: { claim: async () => undefined },
      location: { origin: "https://example.test" },
      registration: { scope: "https://example.test/tools/" },
      skipWaiting: () => undefined,
    },
  });

  vm.runInContext(
    `${source}\nglobalThis.__serviceWorkerFunctions = { cacheFirst, networkFirst };`,
    context,
  );

  return context.__serviceWorkerFunctions as ServiceWorkerFunctions;
}

describe("service worker cache fallback", () => {
  it.each(["networkFirst", "cacheFirst"] as const)(
    "%s 在缓存写入失败时仍返回网络响应",
    async (strategy) => {
      const response = new Response("network ok", { status: 200 });
      const cache = {
        keys: vi.fn(async () => []),
        match: vi.fn(async () => undefined),
        put: vi.fn(async () => {
          throw new Error("quota exceeded");
        }),
      };
      const functions = await loadServiceWorkerFunctions(
        cache,
        vi.fn(async () => response),
      );

      const result = await functions[strategy](
        new Request("https://example.test/tools/app.js"),
        "test-cache",
      );

      await expect(result.text()).resolves.toBe("network ok");
      expect(cache.put).toHaveBeenCalledOnce();
    },
  );

  it("不尝试缓存 206 Partial Content", async () => {
    const cache = {
      keys: vi.fn(async () => []),
      match: vi.fn(async () => undefined),
      put: vi.fn(),
    };
    const functions = await loadServiceWorkerFunctions(
      cache,
      vi.fn(async () => new Response("partial", { status: 206 })),
    );

    const result = await functions.cacheFirst(
      new Request("https://example.test/tools/video.mp4"),
      "test-cache",
    );

    expect(result.status).toBe(206);
    expect(cache.put).not.toHaveBeenCalled();
  });

  it.each(["networkFirst", "cacheFirst"] as const)(
    "%s 在缓存容器不可用时仍返回网络响应",
    async (strategy) => {
      const functions = await loadServiceWorkerFunctions(
        null,
        vi.fn(async () => new Response("network only", { status: 200 })),
      );

      const result = await functions[strategy](
        new Request("https://example.test/tools/app.js"),
        "test-cache",
      );

      await expect(result.text()).resolves.toBe("network only");
    },
  );
});

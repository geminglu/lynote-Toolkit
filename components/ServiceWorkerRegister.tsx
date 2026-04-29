"use client";

import { withBasePath } from "@/lib/seo";
import { useEffect } from "react";

/**
 * 负责在浏览器端静默注册 Service Worker。
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      /**
       * 开发环境下如果浏览器曾经注册过生产 SW，旧缓存可能会拦截
       * Turbopack chunk，导致 React 找不到最新模块工厂。
       */
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations.map((registration) => registration.unregister()),
          ),
        );
      void caches
        .keys()
        .then((cacheKeys) =>
          Promise.all(
            cacheKeys
              .filter((cacheKey) => cacheKey.startsWith("lynote-"))
              .map((cacheKey) => caches.delete(cacheKey)),
          ),
        );
      return;
    }

    const swUrl = withBasePath("/sw.js");
    const swScope = `${withBasePath("/")}/`.replace(/\/+$/, "/");
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void navigator.serviceWorker
        .getRegistration(swScope)
        .then((registration) => {
          void registration?.update();
        });
    };

    let intervalId: number | undefined;
    let disposed = false;

    void navigator.serviceWorker
      .register(swUrl, { scope: swScope })
      .then((registration) => {
        if (disposed) {
          return;
        }

        void registration.update();

        intervalId = window.setInterval(
          () => {
            void registration.update();
          },
          5 * 60 * 1000,
        );
      })
      .catch((error) => {
        console.error("Service Worker 注册失败", error);
      });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return null;
}

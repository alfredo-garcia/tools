/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // The library snapshot is cached in IndexedDB by the app itself; never serve a stale one from here.
    { matcher: ({ url }) => url.pathname === "/api/snapshot", handler: new NetworkOnly() },
    {
      // Photos stay available offline once seen; the URL carries ?v=<modifiedTime>.
      matcher: ({ url }) => url.pathname.startsWith("/api/photo/"),
      handler: new CacheFirst({
        cacheName: "recipe-photos",
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 200 }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

/**
 * Service worker (FR-15, ADR 001). Keeps the app shell so the app starts
 * cold without network. Health data never enters its caches: `/api/**` is network-only and is
 * never precached; the snapshot lives only in IndexedDB (PRD §11). Built by `serwist build`
 * (serwist.config.js, ADR 004).
 */
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const sameOrigin = (url: URL) => url.origin === self.location.origin;
const isApi = (url: URL) => sameOrigin(url) && url.pathname.startsWith("/api/");
/**
 * The app shells. They are static client pages with no data (the data comes from IndexedDB), so
 * caching them is safe. Never widen this to server-rendered pages that could carry health data.
 */
const SHELL_PATHS = new Set(["/", "/routines", "/routines/detail", "/exercises"]);

const serwist = new Serwist({
  // Build assets, public files and the prerendered pages; never /api/**
  precacheEntries: (self.__SW_MANIFEST ?? []).filter((e) => {
    const url = typeof e === "string" ? e : e.url;
    return !url.startsWith("/api/");
  }),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // First and explicit: the access key and health data never touch the SW cache
    { matcher: ({ url }) => isApi(url), handler: new NetworkOnly() },
    // The app shells and their RSC payloads for client-side navigation: network first, cached
    // copy offline
    {
      matcher: ({ request, url }) =>
        sameOrigin(url) &&
        SHELL_PATHS.has(url.pathname) &&
        (request.mode === "navigate" || request.headers.get("RSC") === "1"),
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 20 })],
      }),
    },
  ],
});

serwist.addEventListeners();

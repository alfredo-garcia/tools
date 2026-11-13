# ADR 004: Cómo se construye el service worker con Next.js 16

> Project: `fitness-coach`
> Status: Proposed (2026-11-13), pendiente de Al
> Triggered by: `fitness-coach/001` T6 (FR-15, AC-2)

## Context
tech_standards §1 aprueba `serwist` con su integración de Next.js (`@serwist/next`). Next.js 16 construye con Turbopack por defecto, y el plugin de `@serwist/next` es de webpack. Con `next build --webpack` el build falla con Node 20: `@tailwindcss/node` 4.3.5 depende de `magic-string` 1.x, que solo publica ESM, y el build falla al cargar el plugin de PostCSS de Tailwind dentro del pipeline de webpack de Next:

```
src/app/layout.tsx
An error occurred in `next/font`.
Error [ERR_REQUIRE_ESM]: require() of ES Module …/node_modules/magic-string/dist/index.mjs not supported.
    at mod.require (…/node_modules/next/dist/server/require-hook.js:79:28)
    at Object.<anonymous> (…/node_modules/@tailwindcss/node/dist/index.js:15:232)
```

Node 20.19 ya hace `require()` de ESM (fuera de Next, `require("magic-string")` desde `@tailwindcss/node` funciona), así que la causa está en cómo Next/webpack carga el plugin, no en Node; también falla con `--experimental-require-module` y con `experimental.webpackBuildWorker: false`. Todas las versiones 1.x de `magic-string` son solo ESM. Con Turbopack (el build actual) todo funciona, pero sin service worker no hay arranque en frío sin red (AC-2).

## Options Considered
- **A. Modo "configurator" de `@serwist/next` con Turbopack:** `@serwist/next/config` + el CLI `serwist build` tras `next build`. Es el camino que documenta serwist para Next 16 con Turbopack. Añade **`@serwist/cli`** (dependencia opcional de `@serwist/next`, del mismo proyecto y versión), que no está en tech_standards §1. Sin parches.
- **B. Plugin de webpack + `overrides` de `magic-string` a 0.30.x para `@tailwindcss/node`:** sin librerías nuevas, pero fuerza una versión fuera del rango que declara Tailwind (`^1.1.0`); frágil en cada actualización de Tailwind.
- **C. Plugin de webpack en Node 22:** no se ha podido probar (no hay Node 22 instalado). Como Node 20.19 ya soporta `require()` de ESM, es poco probable que lo resuelva; no conviene decidir por esto.
- **D. Service worker escrito a mano, sin serwist:** contradice tech_standards §1 (se eligió serwist para no mantener la caché a mano).

## Decision
Propuesta: **A**. Añadir `@serwist/cli` a la lista aprobada de tech_standards §1 (y a la allowlist de `scripts/check-standards.mjs`, E1) como parte de la integración de serwist; build `next build && serwist build`.

## Consequences
- Se completa T6 de `fitness-coach/001`: `src/sw.ts` precachea el shell (assets de `_next/static`, iconos y las rutas `/`, `/routines`, `/exercises`), `/api/**` es `NetworkOnly` y nunca entra en la caché, páginas y payloads RSC con `NetworkFirst` (3 s).
- Hay que vigilar `npm audit`: `@serwist/next` 9.5.13 fija `zod` 4.6.5 (aviso alto); se resuelve con `overrides: { "zod": "4.6.7" }`, la misma que usa la app.
- Hasta que se decida, la app es instalable (manifest e iconos, AC-17) pero no arranca en frío sin red (AC-2 en rojo).

## Enforcement
E1 (allowlist) cambia en el mismo PR. Revisión de alto riesgo: el service worker nunca cachea `/api/**` (tech_standards §17, §5/§10); e2e AC-2.

## Appendix: borrador de `src/sw.ts` (probado en tipos y lint, no construido)

```ts
/**
 * Service worker (FR-15, ADR 001, built by @serwist/next). Keeps the app shell so the app starts
 * cold without network. Health data never enters its caches: `/api/**` is network-only and is
 * never precached; the snapshot lives only in IndexedDB (PRD §11).
 */
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const sameOrigin = (url: URL) => url.origin === self.location.origin;
const isApi = (url: URL) => sameOrigin(url) && url.pathname.startsWith("/api/");

const serwist = new Serwist({
  // Build assets, public files and the three pages (next.config.ts); never /api/**
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
    // Pages and RSC payloads for client-side navigation: network first, cached copy offline
    {
      matcher: ({ request, url }) =>
        sameOrigin(url) && (request.mode === "navigate" || request.headers.get("RSC") === "1"),
      handler: new NetworkFirst({ cacheName: "pages", networkTimeoutSeconds: 3 }),
    },
  ],
});

serwist.addEventListeners();
```

# ADR 005: Runtime Node 22 LTS

> Project: `fitness-coach`
> Status: Proposed (2026-11-13), pendiente de Al
> Triggered by: `fitness-coach/001` T2 (install of `@googleapis/drive`)

## Context
tech_standards §1 fija "Node 20 LTS". Node 20 dejó de tener soporte en abril de 2026. Todas las versiones recientes de `@googleapis/drive` (25, 26 y 27) y sus dependencias (`google-auth-library`, `gaxios`, `googleapis-common`) declaran `engines: node >= 22`. Hoy funcionan en Node 20 (los tests pasan), pero no está soportado y npm avisa (`EBADENGINE`).

## Options Considered
- **Seguir en Node 20:** sin cambios, pero sin soporte de seguridad y fuera del rango de la librería de Drive.
- **Node 22 LTS:** soportado hasta 2027; Vercel lo ofrece; cumple el rango de `@googleapis/drive`.
- **Node 24 LTS:** también válido; más nuevo de lo necesario.

## Decision
Propuesta: **Node 22 LTS**. Cambiar tech_standards §1 ("Node 22 LTS"), `engines.node` en `package.json` (`>=22`) y la versión de Node del proyecto de Vercel; instalar Node 22 en local.

## Consequences
Se quitan los avisos `EBADENGINE`. Puede que también resuelva el build de webpack de ADR 004 (opción C), sin probar.

## Enforcement
`engines` en `package.json` (npm avisa en local); la versión del proyecto de Vercel se revisa a mano al montarlo (platform-engineer).

# ADR 005: Runtime Node 22 LTS

> Project: `fitness-coach`
> Status: Proposed (2026-11-13), pendiente de Al
> Triggered by: `fitness-coach/001` T2 (install of `@googleapis/drive`)

## Context
tech_standards §1 fija "Node 20 LTS". Node 20 dejó de tener soporte en abril de 2026. Todas las versiones recientes de `@googleapis/drive` (25, 26 y 27) y sus dependencias (`google-auth-library`, `gaxios`, `googleapis-common`) declaran `engines: node >= 22`. Hoy funcionan en Node 20 (los tests pasan), pero no está soportado y npm avisa (`EBADENGINE`).

## Options Considered
- **Seguir en Node 20:** sin cambios, pero sin soporte de seguridad y fuera del rango de la librería de Drive.
- **Node 22 LTS:** en mantenimiento hasta abril de 2027; Vercel lo ofrece; cumple el rango de `@googleapis/drive`. El más probado con el stack actual.
- **Node 24 LTS:** LTS activo, soporte hasta 2028 (un año más que 22); también lo ofrece Vercel. Contrapartida: menos probado con Next 16 y las librerías de Google; habría que repetir los tests y el build en local antes de cambiar.

## Decision
Propuesta: **Node 22 LTS** (o 24 si Al prefiere el soporte más largo; ambas cumplen). Cambiar la celda "Lenguaje" de tech_standards §1, `engines.node` en `package.json`, `@types/node` a la misma major y la versión de Node del proyecto de Vercel; instalar esa versión en local.

## Consequences
Se quitan los avisos `EBADENGINE`. No resuelve, previsiblemente, el build de webpack de ADR 004.

## Enforcement
`engines` en `package.json` (npm avisa en local); la versión del proyecto de Vercel se revisa a mano al montarlo (platform-engineer).

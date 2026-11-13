# ADR 002: Acceso a Drive con una service account

> Project: `fitness-coach`
> Status: Accepted (2026-11-12)
> Triggered by: Phase 0.2 (Visión §9: sin logins, credencial fuera del cliente)

## Context
La app necesita leer la carpeta `fitness` y añadir sesiones sin que Al inicie sesión y sin exponer credenciales en el navegador.

## Options Considered
- **OAuth de Google en el navegador:** sin servidor, pero obliga a iniciar sesión y a refrescar tokens; contra el driver "sin logins".
- **OAuth con refresh token del usuario guardado en el servidor:** da acceso a todo el Drive de Al; más riesgo del necesario.
- **Service account con solo la carpeta `fitness` compartida:** acceso mínimo, credencial en variables de entorno del servidor.

## Decision
Service account con la carpeta `fitness` compartida con su email; credencial e id de carpeta en variables de entorno de Vercel. Solo `src/lib/drive` usa la Drive API. Si es la misma service account que otras apps o una nueva se decide en el despliegue.

## Consequences
tech_standards §1, §10; hl_architecture §8, §10. Al tiene que compartir la carpeta con la service account una vez.

## Enforcement
Revisión: la credencial solo se lee en `src/lib/drive`; ningún import de `src/lib/drive` desde código de cliente (regla de lint de límites en Phase 0.2c si es viable).

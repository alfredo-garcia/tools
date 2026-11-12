# ADR 003: Clave de acceso compartida para leer y escribir

> Project: `fitness-coach`
> Status: Accepted (2026-11-12)
> Triggered by: Phase 0.2 (Visión §9: datos de salud, sin logins)

## Context
El snapshot incluye datos de salud (hernia L4-L5, restricciones, notas). La URL de la app es pública y no hay logins.

## Options Considered
- **Lectura abierta, clave solo para escribir:** más cómodo, pero expone los datos de salud a quien tenga la URL.
- **Clave compartida para todas las rutas `/api/**`:** una pregunta al instalar; protección suficiente para 1 usuario.
- **Login real (proveedor de auth):** contra el driver "sin logins" y desproporcionado.

## Decision
Cabecera `x-app-key` igual a `APP_ACCESS_KEY` en todas las rutas `/api/**`. Se pide en el primer arranque y se guarda en IndexedDB. Si se rechaza, se vuelve a pedir; la caché sigue visible y la outbox se conserva.

## Consequences
tech_standards §4, §10. Primer arranque con un paso extra. Señal de error: la clave se filtra o se comparte la app con otras personas, y entonces se revisa con auth real.

## Enforcement
Test unitario o e2e: una petición sin clave o con clave errónea a `/api/snapshot` y `/api/ops` devuelve 401. Revisión: ninguna ruta nueva sin la comprobación.

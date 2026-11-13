# Changelog: Datos del knowledge-base sin conexión

> Project: `fitness-coach`
> Merged: PR #1, merge commit `cc44d5a8` en `main` (2026-11-13); escrito en la rama antes del merge (tech_standards §15)
> Source PRD: `001_offline-kb-data_prd.md`
> Source UX Flow: `001_offline-kb-data_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (creación)
> Date applied: 2026-11-13
> Test plan: n/a (rigor personal); verificación en `tests/README.md` (Verified 2026-11-13, alcance automático)
> Reviewed and approved by: Al, 2026-11-13

## Summary

Creación inicial de la documentación funcional: la app se instala como "My Coach", pide la clave una vez, guarda una copia de los datos del knowledge-base y funciona sin conexión, actualizándose sola. Inicio es provisional; Rutinas y Ejercicios dicen "Próximamente".

## Added

- **Documento funcional** — creación de `docs/functional-spec.md` (visión, navegación, conceptos transversales, glosario).
- **SCR-access-welcome** — bienvenida con la clave.
- **SCR-access-first-open-offline** — primera apertura sin red.
- **SCR-home** — Inicio provisional con el resumen.
- **SCR-routines-list**, **SCR-exercises-list** — destinos provisionales "Próximamente".
- **CMP-sync-badge** (compartido), **CMP-access-key-field**, **CMP-access-key-sheet**, **CMP-home-summary**.
- **FLW-access-first-open**, **FLW-access-sync**, **FLW-access-new-key**.
- **Entidad:** copia de los datos (snapshot).

## Modified

None.

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| Sin botón "Sincronizar" | Botón "Actualizar" en pantalla ancha (≥ 640 px); en móvil, solo el gesto. Ya incorporado al PRD (FR-6e, AC-20) | Al, 2026-11-12 (prototipo) |
| Rutinas y Ejercicios dentro del marco (FR-16) | Cabecera con el título de la pantalla ("Rutinas", "Ejercicios") en lugar de "My Coach" | Al, 2026-11-12 |

## Post-merge Fixes

- 2026-11-13, rama `fitness-coach/001-config-diagnostics`: el log de `GET /api/snapshot` dice qué falló sin exponer datos. Con `500 server_misconfigured` lista los nombres de las variables que faltan o no son válidas; con `502 drive_unavailable`, la clase del error, el status HTTP y el código de motivo de Google. Sin cambios de comportamiento para el usuario. Integración con el Drive comprobada a mano en local (51 ficheros, 0 saltados).

## Open Questions / Follow-Ups

- Confirmar en el UX Flow (2.1, 2.6) los textos de error del servidor caído y de sin red en el sheet, y añadir sus e2e.
- `409` mientras se escribe la clave: el UX Flow dice "recargar y repetir"; hoy la clave se pierde (FR-10 no deja guardarla).
- Fallo de descarga de un fichero del Drive: hoy falla toda la actualización (502); el PRD no lo fija.
- Formalizar `TmpKeyField` en el registro; decidir sobre `TmpSummaryCard` con la #2. Re-sincronizar el design system "My Coach" de Claude Design.
- UX Flow escribe `lastSyncedAt` como prop de `SyncBadge`; el registro, `syncedAt`.
- Comprobaciones manuales antes del primer despliegue: instalación en el móvil (AC-17) y rendimiento (PRD §11). La integración con el Drive ya se comprobó en local (2026-11-13).

# Changelog: Mis rutinas

> Project: `fitness-coach`
> Merged: pendiente; escrito en la rama `fitness-coach/002-my-routines` antes del merge (tech_standards §15)
> Source PRD: `002_my-routines_prd.md`
> Source UX Flow: `002_my-routines_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (dominio `routines`, mapa de dominios, snapshot, cambios recientes)
> Date applied: 2026-11-14
> Test plan: n/a (rigor personal); trazabilidad en `tests/README.md`
> Reviewed and approved by: Al, 2026-11-14

## Summary

La pestaña Rutinas deja de ser provisional: lista las rutinas en cards, con filtros por día y por tipo y un grupo final de pausadas, y abre el detalle de cada una con sus bloques, ejercicios y dosis, y un pie fijo "Iniciar rutina" que, hasta el modo guiado, solo avisa.

## Added

- **SCR-routines-detail** — detalle de rutina (pantalla completa en móvil, ventana en pantalla ancha).
- **FLW-routines-browse** — consultar una rutina y volver con los mismos filtros.
- Glosario del dominio `routines`: rutina pausada, bloque, dosis.

## Modified

- **SCR-routines-list** — de "Próximamente" a la lista con filtros y el grupo "Pausadas".
- **Mapa de dominios** — `routines` pasa a Activo.
- **Copia de los datos (snapshot)** — la usa también `routines`.

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| AC-2: la card muestra los días "L · J" | Los siete días con los de la rutina marcados; para lectores de pantalla, "Días: L · J" | UX Flow §6, Al, 2026-11-13 |
| FR-8: el id en el estado de navegación | El id se guarda en el dispositivo (memoria y almacenamiento de la sesión), nunca en la URL | Misma intención (§10 de tech_standards); permite recargar el detalle |

## Open Questions / Follow-Ups

- El registro menciona "momento del día" en la cabecera del detalle; el PRD no lo pide y no se muestra (UX Flow §7).
- Proponer al registro: nada nuevo; `StatusBadge` `paused` ya está. Re-sincronizar el design system "My Coach" si hace falta.
- Comprobación manual en el móvil con los datos reales.

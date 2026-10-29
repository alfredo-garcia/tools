# Changelog: Recipe Detail

> Project: `my-food-manager`
> Merged: commit `9cf27f20` into `main` (fast-forward of `my-food-manager/002-recipe-detail`), confirmed by user on 2026-10-29
> Source PRD: `002_recipe-detail_prd.md`
> Source UX Flow: `002_recipe-detail_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Navigation, Screen & Flow Index, Cross-Cutting Concepts, Glossary, Recent Changes; domains `library` and `recipes`)
> Date applied: 2026-10-29
> Reviewed and approved by: user

## Summary

Each recipe in the list opens a read-only detail with its photo, key facts, ingredients, steps and notes, at its own address, as a modal on desktop and a full screen on mobile.

## Added

- **SCR-recipe-detail** — recipe detail with four collapsible sections (Info general, Ingredientes, Pasos, Notas).
- **FLW-open-recipe** — open and close a recipe, with its address and back behavior.
- **CMP-detail-layer**, **CMP-collapsible-section**, **CMP-recipe-link**.

## Modified

- **SCR-library-list** — rows open the recipe detail.
- **CMP-recipe-photo** — also used on the detail, at 16:9.
- **CMP-app-shell** — pulling down inside the detail does not start a refresh.
- **Overview and Navigation** — the app now has the list at `/` and the detail at `/recipes/<id>`.

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

The PRD was updated to match both rows before merge; they are recorded here so the reasoning travels with the change.

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| The header shows photo, title, category, time group, difficulty, servings and technique chips | The header has only photo and title; those facts and the other tags are rows of the "Info general" section | Four small cards were too tight on a 390 px phone; approved by user on 2026-10-29 |
| Servings unit label comes from the units vocabulary | Servings units `people`, `units`, `portions` use a fixed map (personas, unidades, porciones) | Those units are not in the units vocabulary; accepted by user on 2026-10-29 |

## Open Questions / Follow-Ups

1. Verified by the user after merge: opening a recipe address directly with no connection, a production build, offline use on a real device and pull-to-refresh on a real touch screen all work.
2. Mass and volume units are shown abbreviated and other units pluralized, instead of the raw vocabulary label ("gramos").

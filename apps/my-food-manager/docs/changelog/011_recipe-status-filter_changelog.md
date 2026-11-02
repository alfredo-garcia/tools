# Changelog: Recipe Status Filter

> Project: `my-food-manager`
> Merged: documented on the feature branch `my-food-manager/011-recipe-status-filter` before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require; merge commit `38e755b3`, confirmed by user on 2026-11-02
> Source PRD: `011_recipe-status-filter_prd.md`
> Source UX Flow: `011_recipe-status-filter_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Data, FLW-first-sync, Glossary, Recent Changes; domain `recipes`: SCR-library-list, CMP-recipe-filters, CMP-recipe-search, FLW-filter-recipes; `profile`: SCR-profile; `plan`: CMP-recipe-picker)
> Date applied: 2026-11-02
> Reviewed and approved by: user ("aprobado todo", 2026-11-02)

## Summary

Recipes have a status shared by the household: Por probar, Probada or Descartada (a recipe without a status is Probada). The food-manager skill sets it; the app only reads it. Recetas and the favorites in Perfil get a seventh filter, Estado, that starts on Probadas, with Por probar and Descartadas as the other options; removing it shows every status. The Plan's recipe picker leaves out the Descartadas. Nothing is written to Drive by the app.

## Added

- **Recipe status** data rule; glossary terms Status, Probada, Por probar, Descartada.
- **Estado filter** (seventh filter of CMP-recipe-filters).

## Modified

- **SCR-library-list**, **SCR-profile** — Estado starts on Probadas; the count reads "N de M recetas" from the start.
- **CMP-recipe-filters**, **FLW-filter-recipes**, **CMP-recipe-search** — Estado options, "Limpiar" clears it too, the search respects it.
- **CMP-recipe-picker** — Descartadas are not listed nor found.
- **FLW-first-sync** — a library stored before status existed is fetched again (snapshot format version 3).
- **Product Overview (§1)**, **Domain Map**, `ui_kit_registry.md` (`RecipeFilters`), `tech_standards.md` §5 (recipes schema 4), `product_vision.md` (#11 Done, §9 schema 4).

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

None. The prototype's hint line in the picker is prototype-only and is not in the app.

## Open Questions / Follow-Ups

- Not checked in the running app against Drive; the logic was verified with unit tests and the prototype. Today no recipe in Drive has `status`, so all show as Probadas until the skill sets it.
- Rating a recipe in the app and a "La probé" button will need to write `status`; that needs an ADR extending the app's write list (`tech_standards.md` §5).
- A favorite that is Descartada stays in `reviews/al.yaml`; it only shows in Perfil when Estado is changed or removed.
- Whether the Plan should signal that a planned recipe was discarded later.

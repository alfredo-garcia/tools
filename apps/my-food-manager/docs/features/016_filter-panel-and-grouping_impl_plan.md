# Implementation Plan: Filter Panel and Family Grouping
> Project: `my-food-manager` · Feature: `my-food-manager/016` · Variant: lite · Branch: `my-food-manager/016-filter-panel-and-grouping` · Status: Done (2026-11-13)

Approach: pure domain changes first (no Estado default, a `favorite` filter key, family grouping, the Compra "Comprar off → Tengo on" decision), each with unit tests written before the code; then the UI: a new `TmpFilterToggle`, `RecipeFilters` with `expanded` / `withFavorites`, and `IngredientsScreen` with the panel, grouping and both switches in Compra. Main risk: the pair of pantry operations from Compra and its interaction with the outbox collapse rule.

## Slice 1: Recetas and Perfil open clean, with the filters under an icon and a Favoritos filter
- [x] T1 Domain: `DEFAULT_FILTER_STATE` = `{}`; filter key `favorite` (options "Favoritos" / "No favoritos") read from a recipe's `favorite` flag; tests first (AC-1.1, AC-2.1, AC-2.2, AC-2.5)
- [x] T2 UI: `TmpFilterToggle`; `RecipeFilters` props `expanded` and `withFavorites`; `RecipeLibrary` and `ProfileScreen` wire the panel and the active count; favorites snapshot so a heart tap doesn't move rows until filters or search change (AC-1.2–1.4, AC-2.3, AC-2.4, AC-3.1–3.5)
Review: approved (2026-11-13, 6b4bb426..0da4a053): no blockers or should-fix; nits: aria-controls only while expanded (fixed in T4), the heart-tap rule lives in the component without a unit test (kept, same pattern as Perfil), tests not tagged with AC ids (n/a at personal rigor)

## Slice 2: Compra and Despensa with the panel, family grouping and Tengo in Compra
- [x] T3 Domain: `groupByFamily` (vocabulary order, unknown after, "Otros" last, alphabetical rows) and `listBuyFlip` (which operations a "Comprar" flip in Compra makes, and whether "Tengo" was set automatically); tests first (AC-4.2–4.5, AC-5.2, AC-5.3)
- [x] T4 UI: `IngredientsScreen` with `TmpFilterToggle`, family filter and "Agrupar por familia" in the panel, Estado always visible in Despensa, `TmpResultGroup` blocks; `IngredientRow` with both switches in Compra; Compartir icon-only on small windows (AC-3.1, AC-3.6, AC-4.1, AC-4.6, AC-4.7, AC-5.1, AC-5.4–5.6)
Review: approved (2026-11-13, 0da4a053..878c9ed8): no blockers or should-fix; nits kept: the autoHave bookkeeping in the screen has no unit test (listBuyFlip has), the "Agrupar por familia" row is taller than needed (empty TmpSwitch label), "Quitar filtros" in Despensa clears the family only, as before this feature (PRD §9 wording to be corrected in the docs)

## Deviations
- Compartir is icon-only on small windows in Compra (UX Flow §6, approved by the user on 2026-11-12).

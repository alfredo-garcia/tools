# Changelog: Recipe Filters

> Project: `my-food-manager`
> Merged: commit `ab91eee2` into `main`, confirmed by user on 2026-10-29
> Source PRD: `003_recipe-filters_prd.md`
> Source UX Flow: `003_recipe-filters_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Domain Map, Screen & Flow Index, Cross-Cutting Concepts, Recent Changes; domain `library` and new domain `recipes`)
> Date applied: 2026-10-29
> Reviewed and approved by: user

## Summary

The recipe list gets six client-side filters (category, time, diet, cuisine, difficulty, protein) with option counts and an animated reorder. The list stops being a proof screen.

## Added

- **Domain `recipes`**, in `docs/functional-spec.md`.
- **FLW-filter-recipes** — set, combine and clear filters.
- **CMP-recipe-filters** — filter row, option panel, count and "Limpiar".

## Modified

- **SCR-library-list** — from proof screen to filtered list: filters, "N de M recetas", a no-results state; the recipe count line is replaced by the filter count.

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

None. The UX Flow has no deviations section; the prototype was the implemented screen itself.

## Open Questions / Follow-Ups

1. Filters are not kept when the page reloads; persisting them was deferred in the PRD.
2. `FilterChip` and `FilterOptions` live under `components/inputs`; the UI kit registry already lists them.

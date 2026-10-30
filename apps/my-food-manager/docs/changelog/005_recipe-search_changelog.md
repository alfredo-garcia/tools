# Changelog: Recipe Search

> Project: `my-food-manager`
> Merged: commit `7d05d515` into `main` (merge of `my-food-manager/005-recipe-search`), documented after the fact at the user's request on 2026-10-29
> Source PRD: `005_recipe-search_prd.md`
> Source UX Flow: `005_recipe-search_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Screen & Flow Index, Cross-Cutting Concepts, Glossary, Recent Changes; domains `library` and `recipes`); `docs/context/ui_kit_registry.md`
> Date applied: 2026-10-29
> Reviewed and approved by: user (documentation written directly at the user's request, without a prior redline)

## Summary

The recipe list has a search bar under the "Recetas" title. From 3 characters and 1 second without typing (or Enter), the list shows results grouped by where the text was found: name, protein and ingredient. Search and the six filters combine and do not affect each other.

## Added

- **CMP-recipe-search** — the search bar and its grouped results.
- **FLW-search-recipes** — search the list.
- **Glossary** — Search / applied text, Result group.
- **Kit registry** — `SearchInput` (as implemented) and the temporary `TmpResultGroup`.

## Modified

- **SCR-library-list** — the search bar sits above the filters; with an applied search the list becomes up to three groups; the count line also shows while a search is applied; new "Grouped results" state; the empty state offers "Borrar búsqueda" as well as "Quitar filtros". The old statement "There is no text search" is removed.
- **Overview, Domain Map and Cross-Cutting Concepts** — search added to what the app does and to what works from the device.

## Removed / Deprecated

- The statement that the list has no text search.

## Deviations from PRD Carried Into the Docs

None.

## Open Questions / Follow-Ups

1. The search is documented from the PRD and UX Flow, checked against `src/lib/domain/search.ts` and the search components; it was not re-verified in the running app for this changelog.
2. `TmpResultGroup` is still a temporary component and needs formalizing when the grouped-list pattern is reused.
3. The selected-row highlight on every group row (large windows) follows the PRD; the prototype did not show it.

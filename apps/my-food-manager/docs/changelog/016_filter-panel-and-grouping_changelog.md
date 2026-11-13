# Changelog: Filter Panel and Family Grouping

> Project: `my-food-manager`
> Merged: documented on the feature branch `my-food-manager/016-filter-panel-and-grouping` before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require; merge commit `050e2d19`, merged and pushed at the user's request on 2026-11-13
> Source PRD: `016_filter-panel-and-grouping_prd.md`
> Source UX Flow: `016_filter-panel-and-grouping_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Product Overview, Domain Map, Glossary, Recent Changes; domains library, recipes, profile, pantry); also `docs/context/ui_kit_registry.md` and `docs/product/product_vision.md` (§7 #11 note)
> Date applied: 2026-11-13
> Test plan: n/a (rigor personal); implementation plan `016_filter-panel-and-grouping_impl_plan.md` with two independent reviews, both approved
> Reviewed and approved by: Al (redline approved on 2026-11-13)

## Summary

Recetas, Perfil, Compra and Despensa open as clean lists with their filters behind a filter icon next to the search. Recetas and Perfil lose the "Probadas" default and Recetas gains a Favoritos filter. Compra rows get "Tengo", and turning "Comprar" off there marks the ingredient as "Tengo". Compra and Despensa can group their rows by family.

## Added

- **Glossary: Filter icon** — the round button that shows or hides the filters, with the number of active ones.
- **CMP-recipe-filters: Favoritos filter** — "Favoritos" / "No favoritos" in Recetas only; a heart tap with it active leaves the row in place until filters or search change.
- **CMP-pantry-list: Agrupar por familia** — one block per family, "<family> · <count>", vocabulary order, unknown families after, "Otros" last.
- **Registry: `TmpFilterToggle`** — new temporary component.

## Modified

- **§1 Product Overview** — Recetas and Perfil no longer start on Probadas; mention of filters behind an icon, grouping and the automatic "Tengo" (PRD §1).
- **SCR-library-list** — opens with no filter, "N recetas"; nine filters behind the filter icon (US-1, US-3).
- **CMP-recipe-filters / FLW-filter-recipes** — filters hidden by default, icon with active count, Estado with no initial value, "Limpiar" no longer mentions Estado as a default (FR-1 to FR-5).
- **SCR-profile** — filter icon, eight filters (no Favoritos), nothing filtered on opening (US-1, US-3).
- **SCR-ingredients** — filter icon with family filter and grouping; Todos / Tengo / No tengo always visible; "Quitar filtros" clears the family only (FR-6, FR-11 to FR-13).
- **SCR-shopping-list** — both switches per row; "Comprar" off turns "Tengo" on and is undone by turning it back on; Compartir between search and filter icon (US-4, FR-7 to FR-9).
- **CMP-pantry-list, FLW-flip-switch** — panel, grouping, and the two changes sent from Compra, with their rejection handling (FR-8, FR-9, PRD §10).
- **CMP-share-button** — icon-only in Compra on small windows (UX Flow §6).
- **Glossary** — Filter (Favoritos, nothing active on opening), Tengo / Comprar (the Compra exception), Family (grouping).
- **Domain Map** — recipes filtering includes favorites.
- **Registry** — `RecipeFilters` (`expanded`, `withFavorites`, `panelId`, `DEFAULT_FILTER_STATE = {}`), `ShareButton.round`, `TmpResultGroup` and `TmpSwitch` guidance, Last updated.
- **Product vision §7 #11** — "Recetas filter defaults to Probadas" → "Recetas opens with no status filter (016)".

## Removed / Deprecated

- **Estado's "Probadas" default** in Recetas and Perfil (feature 011's initial state), replaced by no default (PRD FR-1).

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| §9: "Compartir" next to the search with icon and text (feature 015 rule) | Icon-only on small windows, with text on medium and large ones | With the filter icon beside it the search was too narrow on phones; approved by Al with the prototype on 2026-11-12 (UX Flow §6) |
| §9: "Quitar filtros" in Despensa also sets Todos / Tengo / No tengo back to Todos, "as today" | "Quitar filtros" removes the family filter only | That is what the code does, before and after this feature; documented as built, approved by Al with the redline on 2026-11-13 |

## Open Questions / Follow-Ups

- Review nits kept (implementation plan): the heart-tap rule in Recetas and the `autoHave` bookkeeping in Compra live in the components without their own unit tests (the domain functions `withFavorites` and `listBuyFlip` are tested); the "Agrupar por familia" row is taller than needed because `TmpSwitch` keeps an empty label.
- Not checked on a real phone: only the emulated phone viewport and desktop were used.
- The pantry domain Overview still describes Compra only as shareable; a later pass can mention grouping there.

# Changelog: Shopping List Section

> Project: `my-food-manager`
> Merged: documented on the feature branch `my-food-manager/015-shopping-list-section` before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require
> Source PRD: `015_shopping-list-section_prd.md`
> Source UX Flow: `015_shopping-list-section_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Product Overview, Domain Map, Navigation Structure, Screen & Flow Index, Glossary, Recent Changes; domain `navigation`: CMP-main-navigation, FLW-switch-section; domain `pantry`: Overview, SCR-ingredients, new SCR-shopping-list, CMP-pantry-list, FLW-flip-switch, new FLW-share-shopping-list; domains `recipes` and `library`: SCR-recipe-detail, CMP-collapsible-section, CMP-share-button, SCR-library-list); `docs/context/ui_kit_registry.md`
> Date applied: 2026-11-03
> Reviewed and approved by: user ("apruebo", 2026-11-03)

## Summary

The shopping list leaves Despensa and becomes the main-navigation section Compra (`/shopping-list`), with a count badge on its icon and a "Compartir" button that sends the whole list as text grouped by family. Despensa loses its tabs and its filter becomes Todos / Tengo / No tengo, opening on Todos. On small windows the recipe detail opens with Info general and Notas collapsed. The rating mark on list rows is centered on the category line.

## Added

- **SCR-shopping-list** — Compra, the shopping list as its own section.
- **FLW-share-shopping-list** — share the list as text grouped by family, or copy it where there is no share menu.
- Glossary term "Compra / Lista de compra / Lista de la compra".
- `TmpNavBadge` in `ui_kit_registry.md`.

## Modified

- **CMP-main-navigation**, **FLW-switch-section**, **Navigation Structure** — five sections, Compra between Plan and Despensa, with its badge.
- **SCR-ingredients** — no tabs; filter Todos / Tengo / No tengo with Todos by default; the list rules moved to SCR-shopping-list.
- **CMP-pantry-list**, **FLW-flip-switch** — used on Despensa and Compra.
- **pantry Overview** — also corrects the stale "It is the only part of the app that writes" (plan, favorites and ratings write too).
- **SCR-recipe-detail**, **CMP-collapsible-section** — Info general and Notas start collapsed on small windows.
- **CMP-share-button** — also shares the shopping list.
- **SCR-library-list**, glossary "Rating mark" — the mark is centered on the category line.
- **Product Overview**, **Domain Map**, **Screen & Flow Index**, glossary "Section", "Share menu", "Family".
- `ui_kit_registry.md`: `Nav` (Compra, `badges`), `ShareButton` (`recipeTitle` → `subject`), `CollapsibleSection.defaultOpen`, `RatingMark` alignment.

## Removed / Deprecated

- The "Despensa" / "Lista de compra" tabs of SCR-ingredients and its "Empty shopping list" state (now in SCR-shopping-list).

## Deviations from PRD Carried Into the Docs

None. The screen title "Lista de compra" may wrap to two lines next to the sync badge on narrow phones; approved with the prototype (UX Flow §6).

## Open Questions / Follow-Ups

- `product_vision.md` §7 still lists backlog items #6 (Plan), #7 (Pantry) and #8 (Shopping list) as Pending, though they shipped (008, 007) and are extended here. Owner: product-manager.
- Not checked on a real phone: the device share menu itself (checked in the browser with a stubbed share call) and the clipboard fallback.

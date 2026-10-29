# Changelog: Responsive Recipe Layout

> Project: `my-food-manager`
> Merged: commit `120520cd` into `main` (fast-forward of `my-food-manager/004-responsive-recipe-layout`), confirmed by user on 2026-10-29
> Source PRD: `004_responsive-recipe-layout_prd.md`
> Source UX Flow: `004_responsive-recipe-layout_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Navigation, Glossary, Recent Changes; domains `library` and `recipes`)
> Date applied: 2026-10-29
> Reviewed and approved by: user

## Summary

The recipe list and detail adapt to the window width in three layouts. On large windows the list is a column and the detail opens in a panel beside it, with the photo next to the general info. The 1024 px breakpoint of the recipe detail is replaced.

## Added

- **Large layout** of SCR-library-list (400 px column with its own scroll) and of SCR-recipe-detail (side panel, with an empty state "Elige una receta").
- **Breakpoints** small (under 640 px), medium (640 to 1279 px) and large (1280 px and above).

## Modified

- **SCR-recipe-detail** — the modal now starts at 640 px, not 1024 px, and always shows the recipe title in its bar; on large windows it is a panel, and the photo and Info general sit side by side (two fifths and three fifths).
- **SCR-library-list** — filters wrap onto several lines instead of scrolling sideways; the open recipe's row is highlighted on large windows.
- **CMP-detail-layer** — three modes (full screen, modal, panel); the panel is not modal.
- **CMP-recipe-link** — in the panel, the current recipe is marked and choosing another one replaces the history entry.
- **FLW-open-recipe** — history rules and direct address for the large layout.
- **Navigation Structure and Glossary** — three layouts; new terms Column and Panel.

## Removed / Deprecated

- The single 1024 px breakpoint for the recipe detail (feature `my-food-manager/002`), replaced by the three layouts.

## Deviations from PRD Carried Into the Docs

None. The photo beside Info general was requested after the PRD was approved and the PRD and UX Flow were updated to match before merge.

## Open Questions / Follow-Ups

1. Under the photo, on large windows, there is empty space because Info general is taller than the photo. A two-column layout of the whole detail, or a taller photo, were offered and not chosen.
2. When the window shrinks, the detail's scroll position is kept as far as the content allows, so it can be cut if the content gets shorter.
3. The future recipe grid and navigation sidebar must decide how they combine with the list column and the panel.
4. `ui_standards.md` §9 still places the sidebar at "Desktop (>1024px)"; it will be revisited with the sidebar feature.

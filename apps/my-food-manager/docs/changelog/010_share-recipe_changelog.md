# Changelog: Share Recipe

> Project: `my-food-manager`
> Merged: documented on the feature branch `my-food-manager/010-share-recipe` before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require; merge commit recorded below
> Source PRD: `010_share-recipe_prd.md`
> Source UX Flow: `010_share-recipe_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Screen & Flow Index, Glossary, Recent Changes; domain `recipes`: SCR-recipe-detail, new CMP-share-button and FLW-share-recipe)
> Date applied: 2026-10-30
> Reviewed and approved by: user ("Aprobar todo", 2026-10-30)

## Summary

The recipe detail has a "Compartir" button beside the favorite control. It opens the device's share menu with the recipe's title, its photo and the link to its detail, and copies the link where the browser has no share menu. It is available wherever the detail opens and never in lists. Nothing is written to Drive.

## Added

- **CMP-share-button**, **FLW-share-recipe**; glossary term Share menu.

## Modified

- **SCR-recipe-detail** — the share control (title row on small windows, labeled button under the photo on medium and large).
- **Product Overview (§1)**, **Screen & Flow Index (§5)**.

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

None. In the large panel the photo column is narrow, so "Compartir" wraps under "Añadir a favoritos" (PRD §9 allows wrapping).

## Open Questions / Follow-Ups

- Not verified on a real phone (share menu with photo, title and link, and what receiving apps show with the link inside the text); manual checks stubbed the browser's share API on the development server.
- The link uses the app's own address; whoever receives it needs that address to be reachable.
- `ui_kit_registry.md`: `ShareButton` entry added with this feature.

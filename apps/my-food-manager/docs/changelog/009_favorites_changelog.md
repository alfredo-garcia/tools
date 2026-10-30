# Changelog: Favorites

> Project: `my-food-manager`
> Merged: commit `ea2833f5` into `main` (merge of `my-food-manager/009-favorites`), confirmed by user on 2026-10-30; documented on the feature branch before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require
> Source PRD: `009_favorites_prd.md`
> Source UX Flow: `009_favorites_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Navigation Structure, Screen & Flow Index, Cross-Cutting Concepts, Shared Data Entities, Glossary, Recent Changes; new domain `profile`; SCR-library-list and SCR-recipe-detail; CMP-pending-changes and CMP-write-key; domain `navigation`: SCR-profile placeholder removed)
> Date applied: 2026-10-30
> Reviewed and approved by: user ("Aprobar todo", 2026-10-30)

## Summary

Recipes can be marked as favorites. Every row of the recipe list has a heart, the recipe detail has a heart on the title row (small windows) or a button with text under the photo (medium and large), and Perfil has a "Recetas favoritas" tab that lists only the favorites with the same search and filters as Recetas. Favorites belong to Al and are saved to `reviews/al.yaml` through the offline queue and the shared write key.

## Added

- **Domain `profile`** (proposed by the document manager; approved).
- **SCR-profile** (replaces the placeholder), **CMP-favorite-button**, **FLW-toggle-favorite**.
- Shared data entity **Reviews (Al)** and glossary terms Favorite and Heart.

## Modified

- **SCR-library-list** — a heart on every row and the pending-changes indicator.
- **SCR-recipe-detail** — the heart (title row on small windows, button with text under the photo on medium and large; in the photo's column on large).
- **CMP-pending-changes**, **CMP-write-key** — also used for favorites, on every screen with a heart.
- **Product Overview (§1)**, **Navigation Structure (§4)**, **Domain Map (§3)**, **Screen & Flow Index (§5)**, **Cross-Cutting Concepts (§6)** — "Writes" now includes Al's favorites and the order of a mixed batch (pantry, favorites, plan).

## Removed / Deprecated

- **SCR-profile placeholder** in domain `navigation`, replaced by the real screen in `profile`. No section is a placeholder today.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| §8: `404 REVIEWS_MISSING` as an error of the whole request | Each favorite operation is rejected with `REVIEWS_MISSING` and the rest of the batch is applied | Same handling as the plan; the user sees the rejection notice (implementation, approved with the redline 2026-10-30) |
| US-5.1: the rest of the file is unchanged | Only the `favorites:` and `updated:` lines are edited when the list is written inline, as the food-manager skill writes it | Keeps comments and layout byte for byte |
| §8: a mixed batch (not specified) | The server writes pantry first, then favorites, then plan | A retry after a partial failure then only repeats idempotent changes (ADR 003) |
| UX Flow §2.2: photo and button as one block in the large panel | The detail has a wrapper holding the photo and the button in grid column 1 | The user asked that the button sits under the photo, inside its column (2026-10-30) |

## Open Questions / Follow-Ups

- Not verified against the real Drive folder, nor offline on a production build with the service worker. Manual checks used a copy of the data and the development server.
- No person picker and no favorites for the household partner: the person is always Al until the Perfil feature (backlog #9).
- Ratings, comments and the "curated" flag remain pending.
- `ui_kit_registry.md`: `FavoriteButton` and `RecipeRow` entries updated with this feature.

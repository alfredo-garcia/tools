# Changelog: Recipe Ratings

> Project: `my-food-manager`
> Merged: documented on the feature branch `my-food-manager/012-recipe-ratings` before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require; merge commit `91a10223`, confirmed by user on 2026-11-02
> Source PRD: `012_recipe-ratings_prd.md`
> Source UX Flow: `012_recipe-ratings_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Screen & Flow Index, Writes, Data entities, Glossary, Recent Changes; domain `library`: SCR-library-list; `recipes`: SCR-recipe-detail, CMP-recipe-filters, new CMP-rating-stars, FLW-filter-recipes, new FLW-rate-recipe; `profile`: Overview, SCR-profile, FLW-toggle-favorite; `plan`: SCR-plan)
> Date applied: 2026-11-02
> Reviewed and approved by: user ("Aprobada", 2026-11-02)

## Summary

Al can rate a recipe from 1 to 5 stars from its detail, change the rating or remove it by tapping the current star again. The rating shows, display only, on the rows of Recetas, the favorites of Perfil and the Plan. A new filter, Rating ("1+ ★" to "4+ ★", "5 ★", "Sin rating"), joins the other seven, and Recetas and the favorites sort from the best rated down (unrated last, ties alphabetical). Ratings are saved to `reviews/al.yaml` with the offline queue and write key used for favorites, and rating a recipe that is Por probar or Descartada also makes it Probada (ADR 004).

## Added

- **FLW-rate-recipe** and **CMP-rating-stars** (`RatingStars`, plus the read-only `RatingMark`).
- **Rating** data entity; glossary terms Rating, Sin rating and Rating mark.
- **Rating filter** (eighth filter of CMP-recipe-filters).
- `RatingMark` in `ui_kit_registry.md`.

## Modified

- **SCR-recipe-detail** — rating row; on medium and large windows rating, favorite and share share one row when they fit.
- **SCR-library-list**, **SCR-profile** — rating mark on rows, order by rating, eight filters.
- **SCR-plan** — rating mark on planned recipes.
- **CMP-recipe-filters**, **FLW-filter-recipes**, **FLW-toggle-favorite**.
- **Writes**, **Reviews (Al)**, **Recipe status** — the app now writes `ratings` and, only as `tried`, the `status` of a rated recipe.
- **Product Overview (§1)**, **Domain Map**, `ui_kit_registry.md` (`RatingStars` implemented, `RecipeRow.rating`, `RecipeFilters`), `product_vision.md` (#9 in progress). `tech_standards.md` §5 and `hl_architecture.md` were updated earlier with ADR 004.

## Removed / Deprecated

None. The statements that the app never writes a recipe's status and that the detail has no rating control were replaced.

## Deviations from PRD Carried Into the Docs

- The Rating options carry a "★" character in their label ("1+ ★" … "5 ★") instead of a separate star icon, because filter labels are plain strings.
- Layout of the detail on medium and large windows (rating, favorite and share in one row when they fit) was refined after the prototype's approval; the PRD (§9) and UX Flow (§2.1) were updated to match.

## Open Questions / Follow-Ups

- Checked in the running app against a copy of the `food` folder (set a rating, change status of a Por probar recipe, order), not against the real Drive. Logic is covered by unit tests (245 passing).
- New `ratings` entries are written by the YAML library in compact form (`{stars: 4, date: 2026-11-02}`), without the spacing the food-manager skill uses; both read the same.
- If the status write fails after the rating is saved, the rating stays and rating the recipe again retries the status; the app shows no notice for it (the server reports a warning).
- The recipe lists after the rating of a recipe from Por probar: the recipe leaves "Por probar" at once and appears in Probadas.
- No comments, "curated" or person picker yet (backlog #9). Partner ratings need the person picker.

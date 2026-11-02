# PRD: Recipe Status Filter

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; `tech_foundations` re-checked and approved 2026-10-30)
> Source feature doc: `011_recipe-status-filter.md`
> Master doc referenced: `docs/functional-spec.md` (domains `recipes`, `profile`, `plan`; screens SCR-recipe-list, SCR-profile, SCR-plan; components CMP-recipe-filters, CMP-recipe-search, CMP-recipe-picker; flows FLW-filter-recipes, FLW-search-recipes)
> Status: Approved (2026-11-02)
> Branch: `my-food-manager/011-recipe-status-filter`; commits start with `[my-food-manager/011]`

## 1. Summary
Recipes get a status shared by the whole household: Por probar (a new idea), Probada (cooked and kept) or Descartada (not wanted). The food-manager skill sets it; the app only reads it. Recetas and the favorites in Perfil get a seventh filter, Estado, that starts on "Probadas" so the everyday library shows only what works; removing the filter shows every status. The Plan's recipe picker silently leaves out Descartadas. It is for Al and his household partner, on phone and desktop, online or offline.

## 2. Background & Context
- SCR-recipe-list lists recipes alphabetically with a search bar (CMP-recipe-search) and six filters (CMP-recipe-filters: Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína). One value per filter, filters combine, each option shows how many recipes it would give with the other active filters, "Limpiar" clears all filters when two or more are active, and the filters are not kept across reloads (FLW-filter-recipes). The search applies the active filters first (FLW-search-recipes).
- SCR-profile has a "Recetas favoritas" tab that reuses the same search and filters over the favorites.
- CMP-recipe-picker (SCR-plan) lists all recipes with a search box only, no filters.
- The recipe schema is the food-manager contract, `food/_system/schema.md`, which now defines recipes schema 4: an optional `status` field (`to-try`, `tried`, `discarded`; absent = `tried`), household-wide, written by the food-manager skill and, in the future, by the user. The skill sets `to-try` on every new recipe, `tried` when a rating is given, and `discarded` when asked to delete a recipe (the file is kept).
- Today, new ideas, tried recipes and recipes Al no longer wants all look the same. Trigger: user request on 2026-11-02. Added to Product Vision §7 as backlog #11.
- The app already stores the library on the device and refetches it when the stored library's format version differs (`SNAPSHOT_SCHEMA_VERSION`, functional spec: library domain).

## 3. Goals & Success Metrics
- G1: the Recetas list opens showing only Probadas.
- G2: Por probar and Descartadas are reachable in two taps, and all recipes by removing the filter in one tap.
- G3: Descartadas never show in the Plan picker, so a discarded recipe cannot be planned by accident.
- Metric (manual, on a phone-sized and a desktop viewport, with a library that has the three statuses and recipes with no `status`): open Recetas and check the list and counts; switch to each option; remove the filter; do the same in Perfil favorites; open the Plan picker and search for a discarded recipe by name.

## 4. Non-Goals / Out of Scope
- The app never writes `status`: no "La probé" button, no change to Probada when rating (they come with the ratings feature).
- No status badge or marker on rows or in the detail, no sorting, no saved filter choice across reloads.
- No change to favorites or ratings storage; a favorite that is Descartada stays in `reviews/al.yaml`.
- No filter or status control in the Plan; no change to what the Plan already contains.
- No new endpoint, library, ADR or Drive write. No change to the food-manager skill (already done) beyond what this document references.
- The detail of a recipe keeps working exactly as now for any status, including when opened from a link.

## 5. User Stories & Acceptance Criteria

### US-1: Everyday library shows only what works
**As** Al, **I want** Recetas to open showing only Probadas, **so that** new ideas and discarded recipes do not clutter my choice.
- AC-1.1: Given a library with recipes of the three statuses and recipes with no `status`, when Recetas opens, then the Estado filter shows "Probadas" and the list contains exactly the recipes with `tried` or no `status`.
- AC-1.2: Given Estado on "Probadas", when the list is shown, then the count line reads "N de M recetas" where M is every recipe in the library, whatever its status.
- AC-1.3: Given the user leaves Recetas and comes back, or reloads, then Estado is "Probadas" again and every other filter is empty.

### US-2: See new ideas or discarded recipes
**As** Al, **I want** to switch Estado to "Por probar" or "Descartadas", **so that** I can review my new ideas or reconsider a discarded recipe.
- AC-2.1: Given Estado on "Probadas", when the user opens the filter, then the options are "Probadas", "Por probar" and "Descartadas" in that order, each with the number of recipes it would give with the other active filters.
- AC-2.2: Given the user chooses "Por probar", then the list contains exactly the recipes with `to-try`, and the filter shows "Por probar" with an "x".
- AC-2.3: Given an option would give 0 recipes with the other active filters, then it is disabled, except the chosen one.

### US-3: See everything
**As** Al, **I want** to remove the Estado filter, **so that** I see every recipe whatever its status.
- AC-3.1: Given Estado is set to any value, when the user taps its "x", then no status condition applies and the list contains recipes of all statuses; the filter shows only its name "Estado".
- AC-3.2: Given Estado on "Probadas" and one other filter active, when two filters are active, then "Limpiar" shows; when tapped, it clears every filter, Estado included, and all recipes show.
- AC-3.3: Given Estado was removed, then it does not come back to "Probadas" until Recetas is reopened or reloaded.

### US-4: Search respects the status
**As** Al, **I want** the search to follow the chosen status, **so that** I do not get discarded recipes among the results by default.
- AC-4.1: Given Estado on "Probadas" and an applied search that matches a Descartada recipe, then that recipe is in no result group.
- AC-4.2: Given Estado removed or on "Descartadas", then the same recipe appears in its groups.
- AC-4.3: The filters' option counts, including Estado's, still ignore the search (as today).

### US-5: Favorites follow the same rule
**As** Al, **I want** the same Estado filter in Perfil's favorites, **so that** a discarded favorite does not clutter that tab either.
- AC-5.1: Given a favorite that is Descartada and Estado on "Probadas", when the "Recetas favoritas" tab is open, then that favorite is not listed; given Estado removed, it is listed.
- AC-5.2: Given Perfil is opened, then Estado is "Probadas" there, independent of the state in Recetas.
- AC-5.3: The favorite is not removed from `reviews/al.yaml` by hiding it.

### US-6: The Plan never offers Descartadas
**As** Al, **I want** the Plan's recipe picker to leave out discarded recipes, **so that** I do not plan one by mistake.
- AC-6.1: Given the picker is opened, then it lists recipes with `tried`, no `status` or `to-try`, and none with `discarded`.
- AC-6.2: Given a search in the picker whose title matches a Descartada recipe, then that recipe is not in the results.
- AC-6.3: Given a recipe already in the Plan whose status is `discarded`, then it stays in its slot, can be opened and removed as today.
- AC-6.4: The picker has no filter or status control.

## 6. Functional Requirements
1. FR-1: A recipe's status is its `status` value: `to-try` = Por probar, `tried` = Probada, `discarded` = Descartada. A missing or empty value is Probada.
2. FR-2: A `status` value outside the three known ones is treated as Probada and does not make the recipe invalid.
3. FR-3: Estado is a seventh filter of CMP-recipe-filters, after Proteína, with the same behaviour as the others: one value, an "x" that removes it, combines with the others by "all must match", and its options show counts that take the other active filters into account.
4. FR-4: Estado's options are always the three fixed ones, in the order Probadas, Por probar, Descartadas, even when the library has no recipe of one of them (that option is then disabled with 0).
5. FR-5: Estado's value is "Probadas" whenever the list or the favorites tab opens; removing it leaves no status condition.
6. FR-6: "Limpiar" clears every filter, Estado included; it keeps showing when two or more filters are active, counting Estado.
7. FR-7: The count line reads "N de M recetas" while any filter or search is active, with M = all recipes in the library. Because Estado starts active, the list opens with "N de M recetas".
8. FR-8: The search (FLW-search-recipes) applies the active filters, Estado included, before building its groups, and the option counts ignore the search.
9. FR-9: The favorites tab in Perfil uses the same filter row with its own state, starting on "Probadas".
10. FR-10: CMP-recipe-picker excludes recipes whose status is Descartada from the list and from its search; it adds no control.
11. FR-11: The Plan keeps showing, opening and removing recipes already planned, whatever their status.
12. FR-12: The recipe detail, its address `/recipes/<id>` and the share button are not affected by status.
13. FR-13: Filtering by status runs on the device over the stored library, with no request to the server, online and offline.
14. FR-14: The library stored on the device by an earlier version of the app (without `status`) is discarded and fetched again, using the existing format-version mechanism.

## 7. Data Model / Schema Changes
- **Drive:** none made by the app. `food/_system/schema.md` already defines recipes schema 4 with `status` (`to-try` | `tried` | `discarded`; absent = `tried`); the app never writes it (tech_standards §5 write list is unchanged).
- **App schema mirror (`src/lib/schema`):** the recipe schema gains an optional `status`. Per FR-1/FR-2 the parsed recipe exposes one of the three statuses, with `tried` for missing, empty or unknown values.
- **Snapshot:** recipes in `GET /api/snapshot` carry that `status`. `SNAPSHOT_SCHEMA_VERSION` goes from 2 to 3 so stored libraries are fetched again (FR-14).
- **Contract references:** `tech_standards.md` §5 names "recipes schema 3"; its number is refreshed to 4 as a documentation edit (no new technology, no write rule change).

## 8. API / Interface Contracts
- `GET /api/snapshot`: each recipe object adds `status?: "to-try" | "tried" | "discarded"`; errors and ETag behaviour unchanged. No other route changes; `POST /api/ops` is untouched.
- Domain: `status` becomes a seventh `FilterKey` in `src/lib/domain/filters.ts` (label "Estado", options Probadas / Por probar / Descartadas, same option-count rule) so that `filterRecipes`, `searchRecipes` and the option counts work unchanged for it.
- Initial filter state: a single exported constant for the default filter state (Estado = Probadas) used by Recetas and Perfil.
- Plan picker: the Plan screen passes the picker only recipes that are not Descartada.

## 9. UI/UX Requirements
- **Recetas and Perfil favorites:** one more chip in the filter row (CMP-recipe-filters), after Proteína, with the same look, panel, "x", wrapping and disabled option states. In its initial state it shows "Probadas" with an "x". Option labels: "Probadas", "Por probar", "Descartadas".
- **States:**
  - Empty library: as today.
  - No results: "Ninguna receta coincide" with "Quitar filtros" (which removes Estado too), as today. When Estado alone hides everything (for example a library of only new ideas), the same empty state shows.
  - Loading and error: unchanged.
- **Plan picker:** unchanged look; its list simply has no Descartadas. An empty list after excluding them uses the existing "No hay recetas todavía" state.
- Responsive: the extra chip wraps like the other six on small, medium and large windows. 44 px minimum targets as today.
- The ux-designer defines how Estado looks in its default state and the option labels' layout; this PRD fixes only behaviour.

## 10. Edge Cases & Error Handling
- Recipe with no `status`, empty `status` or unknown value: Probada (FR-1, FR-2).
- Library with no `to-try` or no `discarded` recipes: that option shows 0 and is disabled, unless chosen.
- Library where every recipe is Por probar: Recetas opens with 0 results and the "Ninguna receta coincide" state; "Quitar filtros" or choosing "Por probar" shows them.
- Estado removed, then another filter removed: the list returns to all recipes; Estado does not come back by itself.
- A favorite that is Descartada: hidden by default in Perfil; reappears with Estado removed; unfavoriting from the row works as today (the row stays dimmed until search or filters change).
- A favorite toggled in Recetas for a recipe that status then hides: not applicable; status changes only arrive through sync.
- Sync updates the library while a status is chosen: the list is recomputed in place with the current filters, as today.
- A recipe's status changes in Drive (for example to Probada after a rating): it appears in the Probadas list at the next sync; no notice.
- Planned recipe that is Descartada: stays in the Plan; adding it again is not possible from the picker; the pantry check on add (FR from feature 008) is unaffected.
- Offline with a stored library from before this version: the old copy is kept and used until a connection allows the refetch (existing behaviour); every recipe then shows as Probada.
- Search with fewer than 3 characters: nothing is filtered by text, Estado still applies.
- Direct link to a Descartada recipe: opens its detail normally.

## 11. Non-Functional Requirements
- Performance: filtering stays instant for 100+ recipes (vision §10); no extra render pass beyond the existing filter pipeline.
- Offline: fully supported; the read path works from the stored library (tech_standards §11).
- Accessibility: the new chip and its options behave as the other filters (keyboard, focus, screen-reader names, the "x" labelled "Quitar filtro Estado"). Contrast and sizes follow `ui_standards.md`.
- Security and privacy: not applicable; no new data leaves the device, no new input to the server.

## 12. Dependencies & Existing System Touchpoints
- **Contract:** `food/_system/schema.md` recipes schema 4 and the food-manager skill (already updated; the skill sets `status`, the app does not).
- **Library domain:** `src/lib/schema` (recipe mirror), snapshot version, `GET /api/snapshot`.
- **Recipes domain:** CMP-recipe-filters, CMP-recipe-search, SCR-recipe-list, FLW-filter-recipes, FLW-search-recipes.
- **Profile domain:** SCR-profile favorites tab.
- **Plan domain:** SCR-plan and CMP-recipe-picker (list only).
- **Docs to update at merge:** functional spec (filters, picker, library data rules), UI kit registry (CMP-recipe-filters), `tech_standards.md` §5 contract line (schema 4), Product Vision §7 (#11 → Done), changelog.
- **Blocking / blocked:** nothing blocks it. The future ratings feature will make the app set Probada on rating; the future "La probé" button will write `status`; both will need an ADR to extend the app's write list (tech_standards §5).
- Technology: nothing outside tech_standards §2; no ADR needed because the app only reads `status`.

## 13. Assumptions & Open Questions
- Assumption: all recipes in Drive are valid for schema 4 (their `status` is absent or one of the three values); existing recipes need no migration.
- Assumption: M in "N de M recetas" counts all recipes including Descartadas (FR-7).
- Open: when the ratings feature arrives, should the app also change `status` and must a Descartada recipe be re-evaluated? Owner: its own PRD.
- Open: whether the Plan should signal that a planned recipe was later discarded. Not in this feature.

## 14. Rollout & Testing Considerations
- Order: food-manager skill and schema 4 first (done), then the app. Existing recipes have no `status`, so the app shows them all as Probadas on day one.
- Unit tests (vitest): status normalization (missing, empty, unknown); the Estado filter in `filterRecipes`; option counts and the fixed option set; "Limpiar" and the default state; search with Estado; the picker exclusion; the zod schema against a sample recipe with and without `status`; the stored-library version check.
- Manual: the metric in §3 on a phone-sized and a desktop viewport, with a stored library from the previous version.
- Gates before merge: lint, type-check, tests; functional spec and changelog committed on the branch.

## 15. Appendix
- **Estado:** the new filter. **Probada / Por probar / Descartada:** the three statuses `tried` / `to-try` / `discarded`.
- Master doc sections used: `recipes` (SCR-recipe-list, CMP-recipe-filters, CMP-recipe-search, FLW-filter-recipes, FLW-search-recipes), `profile` (SCR-profile), `plan` (SCR-plan, CMP-recipe-picker).
- Related: `003_recipe-filters_prd.md`, `005_recipe-search_prd.md`, `008_meal-plan-calendar_prd.md`, `009_favorites_prd.md`.

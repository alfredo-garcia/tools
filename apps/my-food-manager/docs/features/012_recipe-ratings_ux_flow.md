# UX Flow: Recipe Ratings

> Project: `my-food-manager`
> Source PRD: `012_recipe-ratings_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/012_recipe-ratings/index.html` (clickable; screens: Recetas, Perfil · favoritas, Plan, recipe detail; views: automatic, phone 390 px, medium 820 px, large 1280 px; light and dark themes; toolbar for connection, write key and "reject next change")
> Status: Approved by user on 2026-11-02

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and the registry entries.

## 1. Flow Summary

Al rates a recipe from its detail with five stars; the rating shows, read only, on the rows of Recetas, the favorites of Perfil and the Plan; a new filter, Rating, narrows the lists and Recetas and the favorites sort by rating.

- `SCR-recipe-detail` (any layout) → (tap star N) → rating = N, shown at once, queued in the outbox
- `SCR-recipe-detail` → (tap the star equal to the current rating) → rating removed, five grey stars
- `SCR-recipe-list` / `SCR-profile` → (tap chip Rating) → options panel → (choose "1+ ★" … "5 ★" or "Sin rating") → same screen, list recomputed
- `SCR-recipe-list` / `SCR-profile` → (change of any rating) → list re-sorted at once (stars descending, unrated last, ties by title)
- Any rating change → `CMP-pending-changes` while it waits; the write key dialog (`CMP-write-key`) opens at the first change without a key; a rejected change shows the toast "No se pudo guardar <title>"

## 2. Screens

### 2.1. Recipe detail (`SCR-recipe-detail`, changed)

- **Platform**: Web. Layout divergence as today: small (<640 px) full screen, medium (640–1279 px) modal, large (>=1280 px) side panel.
- **Purpose**: read the recipe and rate it.

**Data required**

| Field | Type | Source |
|---|---|---|
| `ratings.get(recipe.id)` | `number \| undefined` (integer 1–5) | `useRatings()` (stored ratings of `reviews/al.yaml` plus pending rating operations) |
| `rate(recipeId, tappedStars)` | action | `useRatings()`; computes the next value with `nextRating` and enqueues `review.setRating` |

**Component tree** (only what changes)

- `<RecipeContent>` (reused: `components/recipes/detail/RecipeDetail`) builds one `rating` block and renders it twice, one per layout:
  - small windows: under the title row (title, `FavoriteButton`, `ShareButton`), inside `.detail-sections`, hidden with `group-data-[detail-mode=modal]:hidden group-data-[detail-mode=panel]:hidden`
  - medium and large windows: in the photo column, one `flex flex-wrap` row holding `rating`, then `FavoriteButton` and `ShareButton` (labeled) as one group, hidden with `group-data-[detail-mode=fullscreen]:hidden`; when the three fit, they share one row, otherwise `rating` keeps its own row and the favorite and share buttons take the next one together
  - `rating` = `<RatingStars value={stars ?? 0} onChange={(n) => rate(recipe.id, n)} recipeTitle={recipe.title} />` and a text `aria-live="polite"`: `"Sin rating"` when `stars === undefined`, otherwise `"<stars> de 5"`

**Conditional rendering states**

- If `stars === undefined`, render the five stars grey (`text-text-muted`, outline) and the text "Sin rating".
- If `stars === N`, render stars 1 to N filled (`text-warning-500`, `fill-current`, `aria-pressed="true"`) and the rest grey; the text reads "N de 5".
- If `canWrite === false` (no `reviews/al.yaml`), tapping a star adds the notice "No se pudo guardar <title>" and changes nothing.
- Loading, error and not-found states are unchanged.

**Interactions / transitions**

- Tap star N with `stars !== N` → `rate` enqueues `review.setRating { recipe, value: N }`; stars and text update at once.
- Tap star N with `stars === N` → `review.setRating { recipe, value: null }`; the five stars turn grey.
- Several taps on one recipe while pending collapse into the last value; returning to the saved value sends nothing.
- The first change on a device without a key dispatches `FAVORITE_TOGGLED`, which opens `CMP-write-key` (`FavoriteFeedback`).

### 2.2. Recipe list (`SCR-recipe-list`, changed) and Profile favorites (`SCR-profile`, changed)

- **Platform**: Web, all layouts.
- **Purpose**: browse recipes by rating.

**Data required**: as 2.1 for `ratings`; `library` comes from `useRatings()`, whose recipes carry `userRating` and, for a recipe with a pending rating, the status Probada.

**Component tree** (only what changes)

- `<RecipeLibrary>` and `<ProfileScreen>` (reused) read `library` from `useRatings()` and sort the filtered list with `sortByRating` when no search is applied.
  - `<RecipeFilters>` (reused: `components/recipes/RecipeFilters`) renders eight chips, Rating last, after Estado.
  - `<FilterChip>` and `<FilterOptions>` (reused) for Rating: options `1+ ★`, `2+ ★`, `3+ ★`, `4+ ★`, `5 ★`, `Sin rating`, in that order, each with its count.
  - `<RecipeRow rating={ratings.get(r.id)} />` (reused: `components/recipes/RecipeRow`, new optional prop `rating`) renders `<RatingMark stars={rating} />` after the category label, separated by a "·", only when `rating !== undefined`.

**Conditional rendering states**

- If `filters.rating === "N"` (N = 1 to 4), the list holds recipes rated N or more; `"5"` those rated 5; `"none"` the unrated ones; undefined applies no condition.
- If `activeFilterCount(filters) >= 2`, render "Limpiar", as today, counting Rating.
- If an Estado or Rating option has `count === 0` and is not the chosen one, render it `disabled`.
- If no search is applied, order by `sortByRating`; if a search is applied, render the groups Recetas / Proteína / Ingredientes in their current order.
- If the filtered list is empty, render `<EmptyState title="Ninguna receta coincide" … action="Quitar filtros" />`, as today.

**Interactions / transitions**

- Tap the Rating chip → opens its options; choose an option → `filters.rating = value`, panel closes; tap the "x" → `delete filters.rating`.
- A rating change re-sorts the list at once; `useListReorder` animates the move (FLIP); the open detail stays open.
- Tapping a row, including its rating mark, opens the detail; the mark has no action.

### 2.3. Plan (`SCR-plan`, changed: display only)

- **Platform**: Web, all layouts (day list and weekly columns).
- **Purpose**: show the rating of the planned recipes.

**Component tree** (only what changes): `<PlanRecipeItem>` (reused: `components/plan/PlanRecipeItem`) reads `ratings` from `useRatings()` and renders `<RatingMark stars={…} />` after the recipe title when it has a rating; nothing otherwise. The picker (`RecipePickerSheet`) is unchanged and shows no rating.

## 3. Navigation Map

```
SCR-recipe-list ─ row ─> SCR-recipe-detail ─ star N ─> rating saved ─> SCR-recipe-list (re-sorted)
SCR-recipe-list ─ chip Rating ─> options ─ choose ─> SCR-recipe-list [Rating=value]
SCR-profile (favorites) ─ same interactions ─> SCR-recipe-detail
SCR-plan ─ planned recipe ─> SCR-recipe-detail (rating shown on the item, editable in the detail)
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `ratings` | `Map<recipeId, 1–5>` | `reviews/al.yaml` `ratings` (valid entries only) plus pending `review.setRating` operations |
| `recipe.userRating` | `number \| undefined` | `withRatings(library.recipes, ratings, pending)`; never read from the recipe file |
| `filters.rating` | `"1" \| "2" \| "3" \| "4" \| "5" \| "none" \| undefined` | local state per screen; no initial value |
| `RATING_OPTIONS` | six options | `src/lib/domain/filters.ts` |
| `review.setRating` | `{ id, kind, recipe, value: 1–5 \| null }` | outbox → `POST /api/ops` (ADR 004) |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `RatingStars` (implemented; props `value`, `onChange`, `recipeTitle`) | `components/recipes/RatingStars` | 2.1 |
| `RecipeRow` (new optional prop `rating`) | `components/recipes/RecipeRow` | 2.2 |
| `RecipeFilters`, `FilterChip`, `FilterOptions` | `components/recipes/RecipeFilters`, `components/inputs/FilterChip`, `components/inputs/FilterOptions` | 2.2 |
| `FavoriteButton`, `ShareButton`, `RecipeDetail` | `components/recipes/FavoriteButton`, `components/recipes/ShareButton`, `components/recipes/detail/RecipeDetail` | 2.1 |
| `PlanRecipeItem` | `components/plan/PlanRecipeItem` | 2.3 |
| `TmpPendingChanges`, `KeyDialog`, `Toast`, `EmptyState` | existing paths | 2.1, 2.2 |

**New**

| Component | Import path | Purpose |
|---|---|---|
| `RatingMark` | `components/recipes/RatingMark` | read-only star and number on a row (registry entry to add at merge) |

No temporary (`Tmp`) component. The toolbar of the prototype is prototype-only.

## 6. Deviations from PRD (Approved)

- The Rating option labels carry a "★" character (`1+ ★` … `5 ★`) instead of a separate star icon, because filter labels are plain strings.

## 7. Open Items

- None blocking. Registry entries (`RatingStars` marked implemented, `RatingMark`, `RecipeRow.rating`, `RecipeFilters` eight filters) are updated by document-manager at merge.

# PRD: Recipe Filters

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28)
> Source feature doc: `003_recipe-filters.md`
> Master doc referenced: `docs/functional-spec.md` (domain `library`)
> Status: Approved (2026-10-29)
> Branch: `my-food-manager/003-recipe-filters`; commits start with `[my-food-manager/003]`

## 1. Summary
Adds six client-side filters (category, time, diet, cuisine, difficulty, protein) to the recipe list, with an animated reordering of the list. No server involvement.

## 2. Background & Context
- SCR-library-list shows all recipes alphabetically as rows (photo, title, category). The snapshot already carries `category`, `tags` (cuisine, diet, protein, ...), `time` and `difficulty` per recipe, and the category and tag vocabularies with their Spanish labels. No new data is needed.
- Architecture: the library lives in IndexedDB and is read in the browser; filtering is pure client logic in `src/lib/domain` (tech_standards §3).
- ui_standards §11: filters are chips; active chips use soft-tinted fill and colored border. The kit registry lists `Chip` (not yet implemented in code).

## 3. Goals & Success Metrics
- G1: any filter is applied in two taps and removed in one.
- G2: filtering works offline and shows its result within 100 ms for 100+ recipes.
- Metrics (manual, real library): every combination of filters returns exactly the recipes matching all of them; list reorders with animation on a mid-range phone without jank.

## 4. Non-Goals / Out of Scope
Text search; sort controls; multi-select inside one filter; saved filters or filters in the URL; favorites, ratings, "can cook now" filters; grid redesign; server-side filtering; recipe detail (feature `my-food-manager/002`).

## 5. User Stories & Acceptance Criteria

**US-1 Set a filter.** As Al, I want to pick a value for a filter in two taps.
1. Given the list, then six filters show in this order, each with only its name: Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína.
2. Given a filter, when I tap it, then its options show; tapping it again, pressing Esc or tapping outside closes them. Opening one filter closes any other open one.
3. Given open options, when I choose one, then the options close, the list is filtered, and the filter shows the chosen option label and an "x".
4. Given an active filter, when I tap its label, then its options open with the current one marked, and I can change it.

**US-2 Remove filters.** As Al, I want to clear what I set.
1. Given an active filter, when I tap its "x", then it is removed, shows only its name again and the list updates.
2. Given two or more active filters, then a "Limpiar" action removes all of them at once.

**US-3 Combine.** As Al, I want filters to narrow each other.
1. Given several active filters, then only recipes matching all of them show.
2. Given a recipe with several tags in a family (e.g. two proteins), then it matches the filter if any of its tags equals the chosen option.
3. Given a time option, then it matches by total time (prep + cook + rest, missing parts as 0): "Hasta 15 min", "Hasta 30 min", "Hasta 1 h", "Más de 1 h". A recipe with no time data never matches a time option.
4. Given difficulty `easy|medium|hard`, then options read "Fácil", "Media", "Difícil"; a recipe without difficulty never matches.

**US-4 Useful options.** As Al, I want only options that make sense.
1. Given a filter, then its options are the values that exist in the library, in vocabulary order, each with the number of recipes it would show given the other active filters.
2. Given an option whose count is 0, then it is shown disabled; the currently selected option is always enabled.
3. Given a value not in the vocabulary, then its raw id shows as label.

**US-5 Visual feedback.** As Al, I want to see the list react.
1. Given a filter change, then recipes that stay move smoothly to their new position, recipes that appear fade in, and the visible count ("N de M recetas") updates.
2. Given `prefers-reduced-motion`, then no animation plays and the list updates instantly.

**US-6 No results.** As Al, I want a way out.
1. Given filters that match nothing, then an empty state "Ninguna receta coincide" with a "Quitar filtros" action shows.

## 6. Functional Requirements
1. FR-1: Filtering is a pure function of the stored library and the filter state; no network request is made.
2. FR-2: Filter state is one optional value per filter key (`category`, `time`, `diet`, `cuisine`, `difficulty`, `protein`) held in the page; it is not persisted across reloads.
3. FR-3: List order is preserved (alphabetical, as in the snapshot).
4. FR-4: Filters render in a single horizontally scrolling row on narrow screens; the options panel opens below the row, never clipped by the scroll area.
5. FR-5: Chip targets are at least 44 px high; the "x" has its own 44 px target and an `aria-label` ("Quitar filtro <nombre>").
6. FR-6: A sync that updates the library re-applies the active filters in place; an active filter whose value no longer exists keeps working and simply yields no matches.

## 7. Data Model / Schema Changes
None. No writes.

## 8. API / Interface Contracts
None. New domain module `src/lib/domain/filters.ts`.

## 9. UI/UX Requirements
- **New components (UI kit):** `FilterChip`, `FilterOptions`, `RecipeFilters` (assembly); animation helper `useListReorder`. Reused: `EmptyState`, `Button`, `RecipePhoto`, tokens.
- **Copy (Spanish):** "Categoría", "Tiempo", "Dieta", "Cocina", "Dificultad", "Proteína"; "Limpiar"; "N de M recetas"; "Ninguna receta coincide" / "Quitar filtros".
- **Accessibility:** chips expose `aria-expanded` and `aria-haspopup`; options are a `role="listbox"` of `role="option"` with `aria-selected`; focus ring per ui_standards §8; state never conveyed by color alone (active chip also shows its value and "x").

## 10. Edge Cases & Error Handling
- Library not loaded or empty: no filters shown.
- A filter with no values in the library: shown but with no options ("Sin opciones"), disabled.
- Very long option labels truncate with ellipsis inside the chip; they wrap in the options panel.
- Filter changes while a sync is running: result follows the latest library.

## 11. Non-Functional Requirements
- Performance: filtering and option counts computed with `useMemo` over the library; < 100 ms for 100+ recipes.
- Offline: identical to online.
- Accessibility: WCAG AA, fully keyboard-operable.

## 12. Dependencies & Existing System Touchpoints
- Modifies: SCR-library-list (adds filters, counts, empty state). Feature `my-food-manager/002` also modifies the rows of this screen; whichever merges second resolves the overlap in `src/app/page.tsx`.
- Stack: nothing outside tech_standards §2 (animation via the Web Animations API).

## 13. Assumptions & Open Questions
- Assumption: one option per filter (single-select), as requested.
- Assumption: "Tiempo" uses total time buckets above.
- Deferred: persisting filters across navigation (relevant once the detail opens as its own route, feature 002).
- Open: none.

## 14. Rollout & Testing Considerations
- Unit tests (vitest) for `src/lib/domain/filters.ts`: total time, time buckets, each filter key, AND combination, multi-tag matching, option building with counts, unknown vocabulary ids, recipes with missing data. Checked against the fixture recipes.
- Manual: phone-sized and desktop viewports, offline, reduced motion, light and dark themes.

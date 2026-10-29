# PRD: Recipe Search

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28)
> Source feature doc: `005_recipe-search.md`
> Master doc referenced: `docs/functional-spec.md` (domain `library`)
> Status: Approved (2026-10-29)
> Branch: `my-food-manager/005-recipe-search`; commits start with `[my-food-manager/005]`

## 1. Summary
Adds a search bar to the recipe list, between the "Recetas" title and the filters. Once the text has 3 letters and the user stops typing for 1 second, the list shows the recipes that match, grouped by where the text was found: name ("Recetas"), "Proteína" and "Ingredientes". It works on the device over the stored library and combines independently with the six filters of feature `my-food-manager/003`.

## 2. Background & Context
- SCR-library-list lists recipes alphabetically, with six filters (CMP-recipe-filters) and an "N de M recetas" count (functional spec, domain `library`). The functional spec says "There is no text search or sort".
- Each recipe in the snapshot already carries `title`, `tags.protein` (ids resolved to Spanish labels through the tag vocabulary) and `ingredients[].ing` (ids resolved to `name` through the ingredient catalog). No new data is needed.
- Filtering is pure client logic in `src/lib/domain` (tech_standards §3, §5). On large windows (feature 004) the list is a 400 px column with its own scroll, and the selected recipe's row is highlighted.
- The UI kit registry lists `SearchInput` (Beta, pill input with a search icon) but it is not implemented in code yet.
- Trigger: the 003 feature left "simple search" out; the vision's MVP scope (§5) includes it.

## 3. Goals & Success Metrics
- G1: a known recipe is on screen 1 second after the third letter is typed, without touching any filter.
- G2: results tell the user where the text was found (name, protein or ingredient).
- G3: search works offline and shows its result within 100 ms of the debounce firing for 100+ recipes.
- Metric (manual, real library): for any 3+ letter text, each group lists exactly the recipes whose name, protein label or ingredient names contain it (accents and case ignored) and that pass the active filters.

## 4. Non-Goals / Out of Scope
- Category, cuisine, diet, difficulty and time are not searched.
- No search over steps, notes, comments, reviews, descriptions or source; no history or suggestions.
- No relevance sorting, no highlighting of the matched text, no typo tolerance or synonyms.
- The text is not persisted (reload empties it) and is not in the address.
- No server-side search, no new endpoints, no change to the filters or to the recipe detail.

## 5. User Stories & Acceptance Criteria

**US-1 Type to search.** As Al, I want to type a few letters and have the list narrow by itself.
1. Given SCR-library-list, then a search bar shows under the "Recetas" title and above the filters, with a search icon and the placeholder "Buscar por nombre, proteína o ingrediente".
2. Given the text has fewer than 3 characters after trimming, when I type, then nothing is filtered, the list shows as if there were no search, and no message appears.
3. Given the trimmed text has 3 or more characters, when 1 second passes with no typing, then the search is applied and the list shows the grouped results.
4. Given a search is pending, when I type again, then the 1-second wait restarts and the list keeps showing what it showed before.
5. Given an applied search, when I delete letters until fewer than 3 remain, then after the 1-second wait the list goes back to the ungrouped list.

**US-2 Clear the search.** As Al, I want to remove the text in one tap.
1. Given the bar has text, then a "x" shows at its right end; with no text it is hidden.
2. Given text in the bar, when I tap the "x", then the text is erased, the grouped results go away at once (no wait), and the list shows as if there were no search; the filters are untouched.
3. Given the bar is empty, then "Limpiar" and "Quitar filtros" never change it; they only remove filters.

**US-3 Grouped results.** As Al, I want to see where each match came from.
1. Given an applied search, then results are shown in up to three groups, in this order, each with a heading: "Recetas" (title matches), "Proteína" (protein matches), "Ingredientes" (ingredient matches).
2. Given a group with no recipes, then it is not shown.
3. Given a recipe that matches in several places, then it is listed in every group where it matches.
4. Given a group, then its recipes are in the alphabetical order of the list (Spanish collation) and its rows are the same as the normal list rows.
5. Given several words, then a recipe is in a group only if every word is found in that same place: in the title, or in the protein labels (all words in the same label), or in the name of a single ingredient (all words in the same name).
6. Given text, then comparison ignores case and accents and matches parts of words ("pol" matches "Pollo", "cafe" matches "café").

**US-4 Searching with filters.** As Al, I want both to apply together without affecting each other.
1. Given an applied search and active filters, then only recipes that match the search and every filter are shown, in each group.
2. Given an applied search, when I add, change or remove a filter, then the search text is unchanged; and when I clear the search, the filters stay as they were.
3. Given an applied search or any active filter, then the count line shows "N de M recetas", where N is the number of different recipes shown and M the library total.
4. Given the search and filters leave no recipe, then the empty state "Ninguna receta coincide" shows.

**US-5 Offline.** As Al, I want it to work in the store.
1. Given no connection, when I search, then results appear the same as online and no request is made.

## 6. Functional Requirements
1. FR-1: Search state is the text typed (raw) and the applied text; both live in the page and are not persisted.
2. FR-2: The applied text is the typed text trimmed, set 1000 ms after the last change, only when it has 3 or more characters; otherwise the applied text is empty.
3. FR-3: Pressing Enter in the bar applies the search at once, without waiting.
4. FR-4: Normalization for comparison: lowercase, accents removed, text split into words on whitespace.
5. FR-5: Title group: the recipe `title`.
6. FR-6: Protein group: the labels of the recipe's `tags.protein` values as shown in the filter (Spanish vocabulary label, or the id when the vocabulary has none). The raw id is also compared.
7. FR-7: Ingredients group: the name of each ingredient line, taken from the ingredient catalog (`name`); when the catalog has no entry for the id, the id with hyphens turned into spaces is used; optional ingredients are included; quantities, units, notes and groups are not.
8. FR-8: A recipe is in a group if the group's rule in US-3.5 is true; the three groups are computed independently.
9. FR-9: Active filters are applied before grouping with the existing filter logic, unchanged.
10. FR-10: Filter option counts do not take the search into account.
11. FR-11: Pressing Esc in the bar clears the text, like the "x".
12. FR-12: After the "x" is tapped, focus returns to the bar.
13. FR-13: A sync that updates the library re-applies the applied search and the filters in place.
14. FR-14: Search is a pure function in `src/lib/domain` (no I/O, no React) with unit tests.

## 7. Data Model / Schema Changes
None. No writes, no new fields.

## 8. API / Interface Contracts
None; no endpoints. Internal contract: a domain function that, given the library, the applied text and the filter state, returns the ordered groups (`recipes`, `protein`, `ingredients`), each with its recipes, plus the number of distinct recipes. A no-search call (empty applied text) returns the ordinary filtered list.

## 9. UI/UX Requirements
- **New component:** `SearchInput` from the UI kit registry (pill input, search icon, focus ring), extended with the clear "x" button. Registered as implemented in the kit registry at documentation time.
- **Placement:** inside the list, between the title row and the filters, in every layout. On large windows it is inside the 400 px column and scrolls with the rest of it.
- **Copy (Spanish):** placeholder "Buscar por nombre, proteína o ingrediente"; group headings "Recetas", "Proteína", "Ingredientes"; "N de M recetas"; empty state "Ninguna receta coincide".
- **Group headings:** small label above each group with the group's recipe count ("Proteína · 3").
- **States:**
  - No search / fewer than 3 letters: the ordinary list.
  - Pending: the previous list stays; no spinner.
  - Results: grouped list.
  - No results: EmptyState "Ninguna receta coincide" with actions: "Borrar búsqueda" when there is an applied search, and "Quitar filtros" when filters are active (both when both).
- **List animation:** rows are keyed by group and recipe id; reordering animation from 003 is used between states, and instant with `prefers-reduced-motion`.
- **Selected recipe (large windows):** the highlight shows on every row of the open recipe.
- **Accessibility:** the bar has `role="search"` on its container and an accessible name; the "x" has its own 44 px target and `aria-label` "Borrar búsqueda"; group headings are headings; the count line is announced politely when results change.
- Mobile-first; the bar is full width of the list.

## 10. Edge Cases & Error Handling
- Text of only spaces: counts as fewer than 3 characters.
- Text with 3 or more characters but spaces inside ("a b"): trimmed length is 3, so it applies; words match per US-3.5.
- Very long text: no limit enforced; it simply matches nothing.
- Library empty or not loaded: the bar is not shown (same as the filters).
- Library updated by a sync mid-search: results update with the new library.
- Pasting text applies after the same 1-second wait.
- Recipe with no ingredients or no protein: simply absent from those groups.
- Ingredient id missing from the catalog: see FR-7.
- Special characters (regex symbols, accents, "ñ"): treated as plain text; "ñ" is not folded into "n" (only combining accents are removed).
- Browser cannot store data: unchanged; the notice from the list still shows.

## 11. Non-Functional Requirements
- Performance: search is computed in memory over the stored library; under 100 ms for 100+ recipes; input stays responsive while typing (the work only runs on the applied text).
- Offline: identical to online.
- Accessibility: WCAG AA, fully keyboard-operable, visible focus (ui_standards §8).
- Security/privacy: the text never leaves the device.

## 12. Dependencies & Existing System Touchpoints
- Modifies SCR-library-list (adds the bar, grouped results, new empty-state actions) and the count line; CMP-recipe-filters is unchanged. Feature `my-food-manager/003` filter logic is reused as is. Feature `my-food-manager/004` layout: the bar sits in the large-window column.
- `src/lib/domain/filters.ts` is read-only here; the new logic lives in a new domain module.
- Stack: nothing outside tech_standards §2.

## 13. Assumptions & Open Questions
- Assumption: group order and the three searched places are fixed as listed; adding more later is a new feature.
- Assumption: "Limpiar" is the existing control that clears filters only.
- Open: none.

## 14. Rollout & Testing Considerations
- Unit tests (vitest) for the new domain module: normalization (case, accents, "ñ"), 3-character minimum and trimming, multi-word rule per group, each of the three groups, a recipe in several groups, combination with filters, ordering, recipes without protein or ingredients, ingredient not in the catalog, and the distinct-recipe count.
- Behavior of debounce, Enter, Esc and "x" checked manually (no browser tests required by tech_standards §8).
- Manual: phone-sized and desktop viewports, large-window column, offline, reduced motion, light and dark themes.

## 15. Appendix
- Terms: "applied text" is the search text after the 1-second wait; "group" is one of Recetas, Proteína, Ingredientes.
- Master doc: domain `library`, SCR-library-list, CMP-recipe-filters, CMP-app-shell.

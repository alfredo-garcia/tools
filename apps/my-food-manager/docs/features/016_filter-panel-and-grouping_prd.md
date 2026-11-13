# PRD: Filter Panel and Family Grouping

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; ADR 005 accepted 2026-11-03)
> Surfaces touched: web
> Issue: n/a (work_tracker none) · Stories: n/a
> Technical review (tech-lead Mode C): n/a (rigor personal)
> Test plan (qa-engineer): n/a (rigor personal)
> Prototype (ux-designer): signed off (2026-11-12)
> Source feature doc: `016_filter-panel-and-grouping.md`
> Master doc referenced: `docs/functional-spec.md` (domains `library`, `profile`, `pantry`; SCR-library-list, CMP-recipe-filters, FLW-filter-recipes, SCR-profile, SCR-ingredients, SCR-shopping-list, CMP-pantry-list, FLW-flip-switch)
> Status: Approved

## 1. Summary
Recetas, the favorites of Perfil, Compra and Despensa open as clean lists: every recipe or ingredient, with the filters hidden behind a filter icon next to the search. Recetas loses the "Probadas" default and gains a "Favoritos" filter. Compra rows gain the "Tengo" switch, and ticking an ingredient off in Compra marks it as "Tengo" at once. Compra and Despensa can group their ingredients by family. It is for Al, at home and in the shop; the household partner uses the same screens.

## 2. Background & Context
- SCR-library-list and SCR-profile show the search and, always visible below it, the filters of CMP-recipe-filters (eight in Recetas and Perfil: Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína, Estado, Rating). Estado starts on "Probadas" in both (feature 011).
- There is no filter by favorite; favorites are the heart on each row and the list of SCR-profile (feature 009).
- SCR-shopping-list rows show only "Comprar". Turning it off leaves the row struck through until leaving Compra; "Tengo" is not touched, and FLW-flip-switch keeps the two switches independent everywhere (features 007 and 015).
- SCR-ingredients and SCR-shopping-list show the family filter always (CMP-pantry-list); Despensa also shows the "Todos · Tengo · No tengo" filter. Both lists are one alphabetical list.
- Why now: the filter row takes most of a phone's first screen, the "Probadas" default hides new recipes, and after shopping the pantry still has to be fixed by hand in Despensa.

## 3. Goals & Success Metrics
- G1: On opening Recetas, Perfil, Compra or Despensa, the first row of the list is visible directly under the search on a phone (no filter row in between).
- G2: Recetas opens showing every recipe; Al can narrow to his favorites in two taps (filter icon, Favoritos).
- G3: After shopping, every ingredient ticked off in Compra reads "Tengo" in Despensa with no other action.
- G4: Compra and Despensa can show the ingredients by family in two taps (filter icon, Agrupar por familia).
- Metric (manual, phone-sized and desktop viewport): open each of the four screens and check the clean list; filter Recetas by Favoritos; tick off three ingredients in Compra and check Despensa; group both lists.

## 4. Non-Goals / Out of Scope
- Turning "Comprar" off in Despensa does not change "Tengo"; the switches stay independent there. Turning "Tengo" on or off never changes "Comprar", in either screen.
- No new filters other than Favoritos; existing filters keep their options and rules, except that Estado has no initial value.
- No Favoritos filter in Perfil (every recipe there is a favorite).
- No grouping in Recetas or Perfil, and no grouping other than by family.
- No change to the shared shopping-list text (FLW-share-shopping-list) or to the Plan's picker (Descartadas stay out of it).
- No saved preferences per device or per person: the panel, the grouping, the filters and the search reset on leaving a section or reloading, as today.
- No change to what is written to Drive: only the existing `pantry.setHave` and `pantry.setBuy` changes.
- No change to the main navigation badge, which keeps counting the ingredients with "Comprar" on.

## 5. User Stories & Acceptance Criteria

### US-1: Recetas without a default filter
**As** Al, **I want** Recetas and my favorites to show every recipe on opening, **so that** new and untried recipes are not hidden.
- AC-1.1 (FR-1): Given Al opens Recetas, then no filter is active, every recipe of every status is listed and the count reads "N recetas".
- AC-1.2 (FR-1): Given Al opens the favorites tab of Perfil, then no filter is active and every favorite of every status is listed.
- AC-1.3 (FR-1): Given Al chooses Estado "Probadas", leaves Recetas and comes back, then no filter is active again.
- AC-1.4 (FR-1): Given Estado is active, when Al removes it with its "x", then every status shows, as today.

### US-2: Favoritos filter
**As** Al, **I want** to filter Recetas by my favorites, **so that** I choose among what I already like, or find what I haven't marked yet.
- AC-2.1 (FR-2): Given Recetas, then the filters include "Favoritos", with the options "Favoritos" and "No favoritos", each with its count given the other active filters.
- AC-2.2 (FR-2): Given Al chooses "Favoritos", then only the recipes with a filled heart (pending changes included) are listed; with "No favoritos", only the others.
- AC-2.3 (FR-3): Given the Favoritos filter on "Favoritos", when Al unmarks a recipe's heart, then the row stays where it is until the filters or the search change, as the heart's rule in the list (no reorder).
- AC-2.4 (FR-2): Given the favorites tab of Perfil, then there is no Favoritos filter.
- AC-2.5 (FR-2): Given no recipe is a favorite, then "Favoritos" shows 0 and is disabled, and "No favoritos" counts every recipe.

### US-3: Filters under an icon
**As** Al, **I want** the filters hidden until I ask for them, **so that** the list starts right under the search.
- AC-3.1 (FR-4): Given Recetas, Perfil, Compra or Despensa opens, then the filters are hidden and a filter icon button sits at the right of the search bar.
- AC-3.2 (FR-4): Given the filters are hidden, when Al taps the icon, then they show under the search; tapping it again hides them.
- AC-3.3 (FR-5): Given N filters are active, then the icon shows N; with none, it shows no number.
- AC-3.4 (FR-5): Given filters are active and hidden, then "N de M recetas" and, with two or more active, "Limpiar" stay visible above the list; "Limpiar" clears them and the icon's number disappears.
- AC-3.5 (FR-4): Given Al leaves the section and comes back, or reloads, then the filters are hidden again.
- AC-3.6 (FR-6): Given Despensa, then "Todos · Tengo · No tengo" is always visible, outside the panel, and does not count in the icon's number.

### US-4: Tengo in Compra
**As** Al in the shop, **I want** what I tick off in Compra to be marked as at home, **so that** the pantry is up to date when I get home.
- AC-4.1 (FR-7): Given Compra, then each row shows two switches, "Tengo" and "Comprar", as in Despensa.
- AC-4.2 (FR-8): Given an ingredient in Compra with "Tengo" off, when Al turns "Comprar" off, then "Tengo" turns on at once, the row is struck through, and both changes are saved (also offline, through the pending changes).
- AC-4.3 (FR-8): Given an ingredient in Compra with "Tengo" already on, when Al turns "Comprar" off, then "Tengo" stays on and only "Comprar" changes.
- AC-4.4 (FR-9): Given a row struck through in this visit whose "Tengo" was turned on by FR-8, when Al turns "Comprar" back on, then "Tengo" returns to off.
- AC-4.5 (FR-9): Given a struck row whose "Tengo" Al changed by hand after striking it, when Al turns "Comprar" back on, then "Tengo" keeps the value Al set.
- AC-4.6 (FR-7): Given Compra, when Al flips "Tengo" on a row, then "Comprar" does not change and the row stays in the list.
- AC-4.7 (FR-10): Given Despensa, when Al turns "Comprar" off, then "Tengo" does not change.

### US-5: Group by family
**As** Al, **I want** to see the ingredients by family, **so that** I go through the shop or the pantry aisle by aisle.
- AC-5.1 (FR-11): Given Compra or Despensa with the filters shown, then the panel holds the family filter and an "Agrupar por familia" option, off by default.
- AC-5.2 (FR-12): Given "Agrupar por familia" on, then the list shows one block per family with ingredients, headed by the family label and its count, e.g. "Verduras · 3", in vocabulary order, with families missing from the vocabulary after them and "Otros" last; rows inside a block are alphabetical.
- AC-5.3 (FR-12): Given grouping on and an active search, family filter or Todos/Tengo/No tengo value, then the groups are computed on what remains, and empty groups are not shown.
- AC-5.4 (FR-12): Given grouping on in Compra, then a struck row stays in its family block until leaving Compra.
- AC-5.5 (FR-13): Given grouping on, then the filter icon's number does not count it.
- AC-5.6 (FR-4): Given Al leaves the section or reloads, then grouping is off again.

## 6. Functional Requirements
1. FR-1: Recetas and the favorites tab of Perfil open with no active filter; Estado has no initial value. Leaving and coming back, or reloading, restores that state.
2. FR-2: Recetas has a ninth filter, "Favoritos", placed after Rating, with two fixed options, "Favoritos" and "No favoritos", following CMP-recipe-filters' rules (count per option, disabled at 0, one value, "x" to remove, counted by "Limpiar"). Favorites are those of Al's reviews with pending changes applied. Perfil does not show it.
3. FR-3: With the Favoritos filter active, a heart change does not move or remove the row until the filters or the search change.
4. FR-4: In Recetas, Perfil, Compra and Despensa the filters are behind a filter icon button at the right of the search bar, hidden on opening, shown and hidden by tapping it. Leaving the section or reloading hides them.
5. FR-5: The filter icon shows the number of active filters when there is at least one (in Recetas and Perfil, any of the filters; in Compra and Despensa, the family filter). In Recetas and Perfil, the count line and "Limpiar" keep their current rules and stay visible whether the filters are shown or hidden.
6. FR-6: In Despensa, the "Todos · Tengo · No tengo" filter stays always visible, below the search, outside the panel, with its current rules.
7. FR-7: Compra rows have the "Tengo" switch with the same rules as in Despensa (FLW-flip-switch); flipping it never changes "Comprar" and does not remove the row.
8. FR-8: In Compra, turning "Comprar" off on an ingredient with "Tengo" off also turns "Tengo" on, as two pantry changes (`pantry.setBuy` false, `pantry.setHave` true) through the outbox.
9. FR-9: In Compra, turning "Comprar" back on in the same visit, on a row whose "Tengo" was turned on by FR-8 and not changed by hand since, turns "Tengo" off again.
10. FR-10: In Despensa the two switches stay independent: "Comprar" off never changes "Tengo".
11. FR-11: In Compra and Despensa the panel holds the family filter and "Agrupar por familia" (off by default), as a switch below the family filter.
12. FR-12: With grouping on, the list shows one block per family present in the filtered list, headed "<family label> · <count>", in the family vocabulary's order, families missing from it after them (as Despensa shows them today) and "Otros" (no family) last; rows inside a block are alphabetical (Spanish).
13. FR-13: Grouping does not count as an active filter: it does not add to the icon's number and does not change "Quitar filtros" in the no-match state.
14. FR-14: Nothing in this feature writes to Drive beyond the existing pantry switches.

## 7. Data Model / Schema Changes
- No schema or file change. Favorites are read from `reviews/al.yaml` as today; the pantry is written as today.

## 8. API / Interface Contracts
- None new. FR-8 and FR-9 send the existing `pantry.setBuy` and `pantry.setHave` operations through `POST /api/ops`, in that order, collapsing with other pending changes to the same switch as today.

## 9. UI/UX Requirements (web)
- **Filter icon:** a button at the right of the search bar with the `SlidersHorizontal` (lucide-react) icon, accessible name "Filtros" (or "Filtros, N activos"), with `aria-expanded`. The active count follows the badge style of the navigation badge (feature 015). In Compra, "Compartir" stays next to the search, between the search and the icon.
- **Panel:** the existing filter row (CMP-recipe-filters) or the family filter, shown in place under the search, pushing the list down; not a modal or sheet.
- **Compra rows:** the same row as Despensa, with "Tengo" and "Comprar"; struck rows keep both switches.
- **Group headings:** same style as the search result group headings of Recetas ("Proteína · 3").
- **States:** loading, offline with no library, error, no match and empty Compra as today, in every screen. "Quitar filtros" in the no-match state clears the panel's filters (and, in Despensa, sets Todos/Tengo/No tengo back to Todos, as today).

## 10. Edge Cases & Error Handling
- Recetas with a search applied: the filters (Favoritos included) apply first and the search groups are computed on what remains, as today.
- Favoritos with "Favoritos" chosen and the last favorite unmarked: the row stays (FR-3); changing filters or search then gives the no-match state.
- A favorite change rejected by the server: the heart returns and the row follows the filter on the next filter or search change; the notice "No se pudo guardar <receta>" as today.
- FR-8 offline or without key: both changes wait in the outbox ("N cambios pendientes"); the key dialog opens at the first change, as today.
- FR-8 with one of the two changes rejected by the server: that switch returns to its stored value and "No se pudo guardar <ingrediente>" shows, as today; the other change stands.
- Fast double tap on "Comprar" (off then on): FR-9 restores "Tengo"; the collapsing rule sends nothing when both switches end at their stored values.
- The other phone changes the same ingredient: the last change wins, as today.
- An ingredient with a family missing from the vocabulary: its own block, placed after the vocabulary families and before "Otros".
- Grouping on with the family filter active: a single block.
- Compra with only struck rows: grouping keeps them in their blocks; "Compartir" stays hidden (feature 015).
- Staples never appear in Compra; in Despensa they show in their family block with their locked switches.
- Old filter state: there is no stored state to migrate (nothing is remembered).

## 11. Non-Functional Requirements
- Performance: grouping and filtering run on the device over the stored library (hundreds of ingredients, 100+ recipes); a toggle updates the list within one render, with no request.
- Offline: everything works offline; writes go through the outbox.
- Accessibility: the filter icon has an accessible name with the active count and `aria-expanded`; group headings are headings for screen readers; switches keep their labels per row.
- Scale: not applicable beyond the vision's 2 users.

## 12. Dependencies & Existing System Touchpoints
- CMP-recipe-filters, SCR-library-list, SCR-profile, FLW-filter-recipes (features 003, 011, 012); favorites (009).
- SCR-ingredients, SCR-shopping-list, CMP-pantry-list, FLW-flip-switch, CMP-pending-changes, CMP-write-key (features 007, 015).
- Family vocabulary order and "Otros" as used by the shared text (feature 015).
- No shared dependencies. Platform needs: none. Release needs: none.

## 13. Assumptions & Open Questions
- Assumption (from the user): "Tengo" in Compra is an editable switch, as in Despensa; the automatic "Tengo" applies only in Compra.
- Assumption (from the user): Perfil also gets the filter icon and no Estado default.
- The vision backlog item #11 note ("Recetas filter defaults to Probadas") becomes outdated; product-manager updates it with this feature's docs.

## 14. Rollout & Testing Considerations
- No migration or flag; one deploy.
- Risks deserving attention: the FR-8/FR-9 pair of changes and its interaction with the outbox collapse rule and rejections; the Favoritos filter with pending heart changes; the filter count with Estado no longer defaulted; grouping order with unknown families and "Otros".

## 15. Appendix
- **Panel de filtros:** the filters shown or hidden by the filter icon. **Agrupar por familia:** the view option of Compra and Despensa.
- References: functional spec domains `library`, `profile`, `pantry`; CMP-recipe-filters, CMP-pantry-list, FLW-flip-switch.

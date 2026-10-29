# PRD: Responsive Recipe Layout

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28)
> Source feature doc: `004_responsive-recipe-layout.md`
> Master doc referenced: `docs/functional-spec.md` (domains `library` and `recipes`)
> Status: Approved (2026-10-29)
> Branch: `my-food-manager/004-responsive-recipe-layout`; commits start with `[my-food-manager/004]`

## 1. Summary
Replaces the single desktop breakpoint of the recipe detail with three layouts by window width. Small keeps the full-screen detail, medium keeps the modal, and large shows the list as a column with the detail in a side panel, so the list stays usable while reading. For Al and his partner on laptops and monitors.

## 2. Background & Context
- SCR-library-list opens SCR-recipe-detail (FLW-open-recipe) through CMP-detail-layer: full screen below 1024 px, a modal from 1024 px. The list is inert under the modal.
- `ui_standards` §4 defines `mobile <640`, `tablet 640-1024`, `desktop >1024` and a 720 px maximum for detail screens; §9 already allows "centered modal or side panel" on desktop.
- This feature supersedes the 1024 px breakpoint in `002_recipe-detail_prd.md` (US-1.2, US-4.4, FR-4).

## 3. Goals & Success Metrics
- G1: on a 1280 px or wider window, a recipe changes with one click on the list and the list never leaves the screen.
- G2: no behavior change on windows narrower than 1280 px except where this PRD says so.
- Metrics (manual, real library): at 1280 px and 1440 px the list and a recipe are visible together; resizing across 639/640 and 1279/1280 never closes the open recipe.

## 4. Non-Goals / Out of Scope
Carried from the feature doc: changes to the detail content or the list rows (other than the filters wrapping in the column); recipe grid and navigation sidebar; resizable or collapsible columns and remembered widths; previous/next shortcuts; any data, sync or offline change.

## 5. User Stories & Acceptance Criteria

**US-1 Layout by width.** As Al, I want the screen to use the space I have.
1. Given a window narrower than 640 px, then the detail opens full screen with an "Atrás" button, as today.
2. Given a window from 640 px to 1279 px, then the detail opens as a modal over the list (max width 720 px, centered, dimmed backdrop).
3. Given a window of 1280 px or wider, then the list is a column on the left and the detail opens in a panel on the right.
4. Given widths of exactly 639, 640, 1279 and 1280 px, then they belong to small, medium, medium and large respectively.

**US-2 Medium: modal.** As Al on a tablet or small laptop, I want the modal to say which recipe it is.
1. Given an open modal, then the recipe title is visible in its header from the start, truncated to one line, with the full title available on hover, and a "Cerrar" button at the right.
2. Given the modal, when I press Esc, click the backdrop or use "Cerrar", then it closes and the list shows as before.

**US-3 Large: list column.** As Al, I want the list to keep working beside the recipe.
1. Given the large layout, then the list is a 400 px column with its own scroll; the page title, sync badge, refresh button, filters and rows are all inside it and scroll with the list.
2. Given the column, then the filters wrap onto as many lines as needed and never scroll sideways.
3. Given an open recipe, then its row is highlighted in the list and marked as current for screen readers; if filters hide that row, the recipe stays open and no row is highlighted.
4. Given an open recipe, when I scroll the list or change filters, then the panel does not scroll or change.

**US-4 Large: detail panel.** As Al, I want the recipe to use the room I have.
1. Given the panel, then it fills the width left by the column, with no maximum width, and shows the same content as the modal: 16:9 photo, then Info general, Ingredientes, Pasos and Notas.
2. Given the panel, then its header shows the recipe title from the start and a "Cerrar" button; there is no backdrop and the list stays interactive.
3. Given nothing selected, then the panel shows the icon, the title "Elige una receta" and the hint "Se abrirá aquí, sin perder la lista.".
4. Given a panel header, then it stays visible while the content scrolls.
5. Given the panel, then screen readers find it as a region named after the recipe, not as a dialog.

**US-5 Choosing and closing in the large layout.** As Al, I want to flip through recipes without filling the history.
1. Given an empty panel, when I choose a recipe, then it opens and a history entry is added.
2. Given a recipe open in the panel, when I choose another recipe in the list, then the panel shows it and the current history entry is replaced.
3. Given a recipe open, when I press "Cerrar" or the device back button, then the panel returns to "Elige una receta" and the address becomes `/`.
4. Given a recipe open that was reached directly by its address, when I close it, then the address becomes `/` and I stay in the app.
5. Given a recipe opened in the panel, when I tap an ingredient that links to another recipe, then that recipe opens and a history entry is added; "atrás" returns to the previous one.
6. Given the keyboard, when I choose a row, then focus stays on that row; when I close the panel, then focus goes to the previously selected row if it is still in the list.

**US-6 Addresses.** As Al, I want every recipe to keep its address.
1. Given the large layout, when I open `/recipes/<id>` directly, then the list shows with that recipe open in the panel.
2. Given `/`, then the panel is empty.
3. Given an address whose recipe is not in the library, then the panel shows "Receta no encontrada" with "Volver a recetas", which closes the panel.

**US-7 Resizing.** As Al, I want to change the window without losing my place.
1. Given a recipe open, when the window crosses any breakpoint, then the same recipe stays open in the layout that fits, with its scroll position, the open or closed state of its sections and the open time breakdown kept.
2. Given the large layout with an empty panel, when the window shrinks below 1280 px, then the list shows alone, with no modal.
3. Given any layout, then the list keeps its scroll position and active filters across the change.

**US-8 Refresh.** As Al, I want pull-to-refresh only where it makes sense.
1. Given a touch device, when I pull down at the top of the list or the list column, then a sync starts; pulling inside the detail or the panel does not.

## 6. Functional Requirements
1. FR-1: The layout is a pure function of the window width: small `< 640`, medium `640–1279`, large `>= 1280`.
2. FR-2: The address model of feature 002 (`/recipes/<id>`, opened without a network request) is unchanged for all layouts.
3. FR-3: In small and medium the recipe is open as today (full screen / modal): page scroll locked, focus kept inside, list inert.
4. FR-4: In large the panel is not a dialog: the page is not locked, the list is not inert, focus is not trapped and Esc does not close it.
5. FR-5: In large, choosing a recipe from the list replaces the current history entry when a recipe is already open, and adds one otherwise; ingredient links always add one.
6. FR-6: Closing in large (button or back) leaves `/` and an empty panel; no recipe is selected automatically.
7. FR-7: The list column is 400 px wide; the panel takes the remaining width, with no maximum.
8. FR-8: The header of the modal and of the panel always shows the title; on small it appears when the in-body title scrolls out of view, as today.
9. FR-9: The photo is 16:9 in every layout.
10. FR-10: Changing layout never refetches data or reloads the page.
11. FR-11: The detail's state (scroll, section state, time breakdown) survives a layout change.
12. FR-12: The selected row has `aria-current="true"` and the panel is a labelled region, not a dialog.
13. FR-13: Choosing a row in large leaves keyboard focus on that row; closing the panel moves focus to the previously selected row if it is still in the list.
14. FR-14: The column's title, sync badge, refresh button and filters scroll with the list (they are not pinned).

## 7. Data Model / Schema Changes
None. No writes.

## 8. API / Interface Contracts
None. A pure helper `layoutForWidth(width)` returning `small | medium | large` in `src/lib/domain` holds FR-1.

## 9. UI/UX Requirements
- **Surfaces:** modifies SCR-library-list (column in large) and SCR-recipe-detail (panel in large, title in the modal header). Prototype: `prototypes/004_responsive-recipe-layout/index.html`.
- **Components:** `RecipeLibrary` gains the split layout; `DetailLayer` gains the panel mode (non-modal, no backdrop, close button, title always visible) besides full screen and modal. No new component is expected; any new one is registered in `ui_kit_registry.md`.
- **Copy (Spanish):** "Elige una receta", "Se abrirá aquí, sin perder la lista.", "Cerrar", "Atrás", "Receta no encontrada", "Volver a recetas", "Cargando tu receta…".
- **States in the panel:** empty, loading (library not ready: "Cargando tu receta…"), recipe, not found; the list column keeps its own states (loading, offline, error, empty, no results).
- **Standards:** `ui_standards` §4 breakpoints become `small <640`, `medium 640–1279`, `large >=1280`, and §4 notes that the panel is exempt from the 720 px maximum for detail screens.

## 10. Edge Cases & Error Handling
- A window exactly at a breakpoint belongs to the wider layout.
- Large with the library not loaded: the column shows its loading state and the panel shows the loading state if the address names a recipe, otherwise the empty panel.
- Large with a recipe open that a sync removes: the panel switches to "Receta no encontrada".
- Filters that match nothing while a recipe is open: the recipe stays open; the list shows "Ninguna receta coincide".
- A recipe open and its row hidden by filters: no row is highlighted.
- Rotating a tablet across 640 or 1280 px: same as resizing.
- Very short windows: the column and the panel scroll independently; nothing is cut off.
- The browser's back button while in medium with a modal: closes it, as in feature 002.
- Opening a recipe address with no connection: works as in feature 002, in every layout.

## 11. Non-Functional Requirements
- Performance: switching layout or recipe shows content within 300 ms from the stored library and causes no reload.
- Accessibility: WCAG AA; all controls keyboard-reachable in a natural order (list, then panel); touch targets at least 44 px.
- Offline: identical to feature 002.
- Security / scale: not applicable.

## 12. Dependencies & Existing System Touchpoints
- Modifies: SCR-library-list, SCR-recipe-detail, FLW-open-recipe, CMP-detail-layer, CMP-app-shell (no centered maximum width in large), CMP-recipe-filters (wrapping).
- Supersedes: the 1024 px breakpoint in `002_recipe-detail_prd.md`.
- Documentation to update: `ui_standards.md` §4 and §9, `ui_kit_registry.md` (`DetailLayer`, `RecipeLibrary`), and the master doc after merge.
- Stack: nothing outside `tech_standards.md` §2.

## 13. Assumptions & Open Questions
- Assumption: the 400 px column and the panel without a maximum width are fixed; no setting changes them.
- Assumption: in large, the detail's loading and not-found states appear inside the panel.
- Implementation risk: keeping the detail's state when the window crosses a breakpoint (FR-11) means the detail cannot be rebuilt from scratch when its container changes between full screen, modal and panel. Implementation must flag it if that proves impossible without changing the layout.
- Deferred: a recipe grid and the navigation sidebar will need their own decision on how they combine with the column and the panel.
- Open: none.

## 14. Rollout & Testing Considerations
- No flag or migration.
- Unit tests (vitest) for `layoutForWidth` at 639, 640, 1279 and 1280 and at extreme values.
- Manual, on the real library: widths 390, 820, 1280 and 1440; crossing each breakpoint with a recipe open; choosing recipes, closing and the device back button in large; direct address; filters wrapping in the column; reduced motion; light and dark themes.

## 15. Appendix
- Glossary: **Column** = the list in the large layout; **Panel** = the detail in the large layout.
- References: master doc `library` and `recipes` domains, `ui_standards` §4 and §9, `002_recipe-detail_prd.md`, `003_recipe-filters_prd.md`.

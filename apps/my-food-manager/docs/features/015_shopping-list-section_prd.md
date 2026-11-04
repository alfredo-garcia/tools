# PRD: Shopping List Section

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; ADR 005 accepted 2026-11-03)
> Source feature doc: `015_shopping-list-section.md`
> Master doc referenced: `docs/functional-spec.md` (domains `pantry`, `recipes`, `library`, navigation; SCR-ingredients, CMP-pantry-list, CMP-main-navigation, SCR-recipe-detail, CMP-share-button, FLW-share-recipe, FLW-flip-switch, SCR-library-list)
> Status: Approved

## 1. Summary
The shopping list leaves Despensa and becomes its own section, "Compra", in the main navigation, with a count badge and a "Compartir" button that sends the list as text grouped by family. Despensa loses its tabs and its filter becomes "Todos · Tengo · No tengo", opening on "Todos". On small windows the recipe detail opens with Info general and Notas collapsed. The rating on list rows sits on the category's line. It is for Al, and the household partner uses the same screens, on phone and desktop, online or offline.

## 2. Background & Context
- SCR-ingredients (`/ingredients`, "Despensa") has two tabs, "Despensa" and "Lista de compra · N". The list tab shows the ingredients with "Comprar" on, with search and the family filter; a row whose "Comprar" is turned off stays struck through until leaving the tab. The Despensa tab has the filter Tengo / No tengo / Todos, on "Tengo" by default.
- CMP-main-navigation has four sections: Recetas, Plan, Despensa, Perfil (bottom bar on small windows, sidebar on medium and large).
- FLW-share-recipe opens the device's share menu from the recipe detail and, without one, copies the link and says "Enlace copiado".
- SCR-recipe-detail opens its four sections (Info general, Ingredientes, Pasos, Notas) expanded on every window size.
- The rating mark on list rows (Recetas, favorites in Perfil, Plan) sits slightly above the category text.
- Why now: the list is what Al opens in the shop, and today it is two taps away and can't be sent to the partner.

## 3. Goals & Success Metrics
- G1: The shopping list is one tap away from any screen.
- G2: Al sends the whole list, grouped by family, to any app in two taps (Compra, then Compartir).
- G3: On a phone, Ingredientes is visible on opening a recipe without scrolling past Info general.
- Metric (manual, phone-sized and desktop viewport): open Compra from every section; share the list to a messaging app and check the text; open three recipes on a phone and check the collapsed sections; check Despensa opens on "Todos"; check the rating on the category's line in Recetas, Perfil and Plan.

## 4. Non-Goals / Out of Scope
- No quantities, photos, links or recipe names in the shared text; nothing written to Drive by sharing.
- No change to what "Tengo" and "Comprar" do or to how the list is computed (ingredients with "Comprar" on).
- No remembered collapsed state between recipes or sessions; Ingredientes and Pasos stay expanded on every size.
- No change to Plan or Perfil beyond the rating alignment; no new section beyond Compra.
- No sharing from Despensa, and no share of a filtered part of the list.

## 5. User Stories & Acceptance Criteria

### US-1: Compra as its own section
**As** Al, **I want** the shopping list in the main navigation, **so that** I open it in one tap in the shop.
- AC-1.1: Given any screen with the main navigation, then it shows five sections in this order: Recetas, Plan, Compra, Despensa, Perfil.
- AC-1.2: Given Al taps Compra, then the shopping list opens at `/shopping-list` with the title "Lista de compra" and the browser tab "Lista de compra · My Food", and Compra is marked as the current section.
- AC-1.3: Given N > 0 ingredients with "Comprar" on (pending changes included), then the Compra icon shows a badge with N in the bottom bar and in the sidebar; with N = 0 there is no badge.
- AC-1.4: Given Compra, then it shows the search, the family filter and the rows with "Comprar" on, sorted alphabetically, and a row whose "Comprar" is turned off stays struck through until leaving Compra, as the old tab did.
- AC-1.5: Given an empty list with no search or filter, then Compra says "Tu lista está vacía" with "Ir a Despensa", which opens Despensa.

### US-2: Despensa without tabs
**As** Al, **I want** Despensa to show the whole pantry first, **so that** I see everything before narrowing.
- AC-2.1: Given Al opens Despensa, then there are no tabs, and the filter reads "Todos · Tengo · No tengo" with "Todos" selected.
- AC-2.2: Given Despensa, then every row keeps its two switches, "Tengo" and "Comprar", behaving as today (FLW-flip-switch).

### US-3: Share the list
**As** Al, **I want** to send the list as text, **so that** the partner can buy it or I can keep it in another app.
- AC-3.1: Given Compra with at least one ingredient with "Comprar" on, then a "Compartir" button is shown; with none, it is not shown.
- AC-3.2: Given Al taps Compartir on a device with a share menu, then the menu opens with text only, built as §7 describes, from the whole list, whatever the search or the family filter.
- AC-3.3: Given rows struck through in this visit, then they are not in the shared text.
- AC-3.4: Given a browser with no share menu, then the text is copied and a notice says "Lista copiada", or "No se pudo copiar la lista" if the clipboard is refused.
- AC-3.5: Given Al cancels the menu, then nothing happens; any other failure says "No se pudo compartir".

### US-4: Recipe detail on a phone
**As** Al, **I want** the recipe to open on its ingredients, **so that** I don't scroll past details I rarely need.
- AC-4.1: Given a small window (under 640 px), when a recipe detail opens, then Info general and Notas are collapsed and Ingredientes and Pasos are expanded.
- AC-4.2: Given a medium or large window, when a recipe detail opens, then all four sections are expanded, as today.
- AC-4.3: Given Al expands a collapsed section and then opens another recipe, then the new recipe opens again with Info general and Notas collapsed (on small windows).

### US-5: Rating aligned
- AC-5.1: Given a list row with a rating (Recetas, favorites in Perfil, Plan), then the star and the number sit on the same line as the category text, vertically centered with it.

## 6. Functional Requirements
1. FR-1: The main navigation lists Recetas (`/`), Plan (`/plan`), Compra (`/shopping-list`), Despensa (`/ingredients`), Perfil (`/profile`), in that order, in the bottom bar and the sidebar.
2. FR-2: Compra's icon is `ShoppingCart` (lucide-react).
3. FR-3: The Compra badge counts the ingredients with "Comprar" on in the pantry with pending changes applied (the number today's tab label shows). It shows "99+" above 99.
4. FR-4: The accessible name of Compra with a badge is "Compra, N por comprar".
5. FR-5: `/shopping-list` shows the shopping list: title "Lista de compra", search ("Buscar ingrediente"), family filter, rows and states as the old "Lista de compra" tab, including the strike-through rule (scoped to the visit to Compra) and CMP-pending-changes, CMP-write-key and the rejection notice.
6. FR-6: `/ingredients` shows Despensa with no tabs: title "Despensa", search, family filter and the Estado filter "Todos · Tengo · No tengo" with "Todos" by default; other rules as today.
7. FR-7: Compra shows a "Compartir" button only while the list (pending changes applied) has at least one ingredient.
8. FR-8: Compartir builds the text in §7 from every ingredient with "Comprar" on, ignoring the search and the family filter and leaving out rows struck through in this visit, and opens the device's share menu with that text and no title, link or file.
9. FR-9: Without a share menu, the text is copied to the clipboard; the notices are "Lista copiada" and "No se pudo copiar la lista", for 4 seconds. Cancelling the menu does nothing; any other failure says "No se pudo compartir".
10. FR-10: On small windows, SCR-recipe-detail opens Info general and Notas collapsed every time a recipe opens; Ingredientes and Pasos open expanded. On medium and large windows all open expanded. The layout at the moment the recipe opens decides; resizing an open detail does not fold or unfold sections.
11. FR-11: The rating mark on list rows is vertically centered on the category's line.
12. FR-12: Nothing in this feature writes to Drive beyond the existing pantry switches.

## 7. Data Model / Schema Changes
- No schema or file change.
- **Shared text** (plain text, lines separated by `\n`):
  ```
  Lista de la compra

  Verduras
  ☐ Cebolla
  ☐ Tomate

  Lácteos
  ☐ Nata
  ```
  - First line "Lista de la compra", then a blank line, then one block per family with ingredients, separated by a blank line.
  - Family heading: the family label as Despensa's filter shows it; families in vocabulary order; ingredients with no family under "Otros", last.
  - Each ingredient: "☐ " plus its catalog name; alphabetical (Spanish) within its family.
  - No trailing blank line.

## 8. API / Interface Contracts
- None new. Compra and Despensa read the same snapshot and write through the same `pantry.setHave` / `pantry.setBuy` operations as today.
- Web Share API (`navigator.share({ text })`) and Clipboard API (`navigator.clipboard.writeText`), as FLW-share-recipe already uses.

## 9. UI/UX Requirements (web)
- **Navigation:** five items; the bottom bar keeps one row with icon and label per item; the badge follows the UI standards' badge/count style (ux-designer to define if the kit has none).
- **Compra header:** "Compartir" next to the search, with the `Share2` icon and the text, as the recipe detail's labelled share button.
- **Despensa:** the segmented Estado filter in its new order, directly under the search and family filter, as today.
- **Recipe detail:** the existing collapsible sections; only the initial state changes.
- **Rating mark:** no visual change other than its vertical alignment.
- **States:** loading, offline-with-no-library and error as Despensa today, in both screens.

## 10. Edge Cases & Error Handling
- List with only rows struck through in this visit: Compartir is hidden (FR-7 counts the live list).
- A pending "Comprar" change offline: counted in the badge and included in the shared text, as shown on screen.
- Ingredient with a family missing from the vocabulary: shown under its family label as Despensa does today (FR-5), placed after the vocabulary families and before "Otros".
- Staples: never on the list, so never in the text (as today).
- Double tap on Compartir while the menu opens: the second tap does nothing until the first finishes.
- Old bookmarks: `/ingredients` still opens Despensa; there was never an address for the list tab.
- Recipe with no notes: Notas is absent, as today; nothing to collapse.
- Detail opened from Perfil or over the Plan on a small window: same collapsed rule.

## 11. Non-Functional Requirements
- Performance: no extra request; the text is built on the device from the stored library.
- Offline: Compra, Despensa and sharing work offline (the share menu itself is the device's).
- Accessibility: the badge is part of the item's accessible name (FR-4); the Compartir button has a visible label; the collapsed sections keep `aria-expanded`.
- Scale: not applicable beyond the vision's 2 users and the ingredient catalog.

## 12. Dependencies & Existing System Touchpoints
- CMP-main-navigation (`src/lib/domain/navigation.ts`, `components/navigation/Nav`), my-food-manager/006.
- SCR-ingredients, CMP-pantry-list, FLW-flip-switch, CMP-pending-changes, CMP-write-key, my-food-manager/007.
- FLW-share-recipe pattern, my-food-manager/010.
- SCR-recipe-detail (`CollapsibleSection`), my-food-manager/002 and 004.
- Rating mark on rows (`RatingMark`), my-food-manager/012.
- No shared dependencies.

## 13. Assumptions & Open Questions
- Assumption (from the user): the shared text ignores search and filters and uses "☐" bullets.
- Assumption: the vision backlog gets no new item; product-manager may record these adjustments under #7/#8 later.

## 14. Rollout & Testing Considerations
- No migration or flag.
- Unit tests (vitest): the shared-text builder (family order, "Otros" last, unknown family, alphabetical order, struck rows left out, single family, no trailing blank line); navigation destinations and `currentDestination` for `/shopping-list`; the badge label ("99+"); the default initial section state by layout.
- Manual: the metric in §3, on a phone-sized viewport and desktop, plus sharing offline and the clipboard fallback on desktop.

## 15. Appendix
- **Compra:** the main-navigation section for the shopping list. **Lista de compra:** its screen title. **Lista de la compra:** the first line of the shared text.
- References: functional spec domains `pantry`, `recipes`, `library`; FLW-share-recipe.

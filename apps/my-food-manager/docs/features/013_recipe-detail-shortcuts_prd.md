# PRD: Recipe Detail Shortcuts

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28)
> Source feature doc: `013_recipe-detail-shortcuts.md`
> Master doc referenced: `docs/functional-spec.md` (domains `recipes`, `plan`, `pantry`; SCR-recipe-detail, SCR-plan, CMP-detail-layer, CMP-recipe-picker, CMP-missing-ingredients, CMP-write-key, CMP-pending-changes, FLW-add-recipe-to-plan, FLW-flip-switch)
> Status: Approved

## 1. Summary
The recipe detail gets two contextual buttons. "Añadir a lista de compra" opens a modal that sorts the recipe's ingredients into Faltan, En mi lista de la compra and Ya tengo, and puts the Faltan ones on the shopping list. "Añadir al plan" takes Al to the Plan with the recipe first and already chosen in the recipe picker, so planning it is one slot and one tap. The sheet shown after planting a recipe in the Plan adopts the same three groups. It is for Al, on phone and desktop, online or offline.

## 2. Background & Context
- The detail (SCR-recipe-detail, opened as CMP-detail-layer over Recetas, Perfil, Plan and Despensa) shows rating, favorite and share, and nothing that acts on the pantry or the plan.
- The Plan (SCR-plan) adds a recipe through CMP-recipe-picker from the "Añadir" of a slot, then CMP-missing-ingredients lists the "faltantes" (catalog ingredients that are not staples and are not "Tengo") and offers to turn "Comprar" on for them (FLW-add-recipe-to-plan).
- The picker lists all recipes except Descartadas (feature 011); Probadas and Por probar are both plannable today.
- The pantry stores `have` and `to_buy` per ingredient (non-staples only); staples are always available (spec, Shared data entities).
- Why now: Al decides to cook a recipe while looking at it, and today has to leave it, re-find it elsewhere or detour through the Plan to get its shopping list.

## 3. Goals & Success Metrics
- G1: From a recipe detail, Al puts what is missing on the shopping list in at most three taps (button, "Añadir a la lista", nothing else).
- G2: From a recipe detail, Al plans the recipe with at most four taps after the button (section opens on the Plan, "Añadir" of a slot, "Añadir receta"), without searching.
- G3: The modal and the Plan's sheet agree on what is missing.
- Metric (manual, phone-sized and desktop viewport, with a library that has recipes in the three statuses and a pantry with ingredients in every state): use both buttons on a Probada, a Por probar and a Descartada recipe; verify the groups against the pantry, the shopping list in Despensa and the plan after each action.

## 4. Non-Goals / Out of Scope
- No new kind of write: only `pantry.setBuy` and `plan.addRecipe` (ADR 001, ADR 003). No data model, API or schema change.
- The detail does not ask for day or slot; they stay in the Plan.
- "En mi lista de la compra" and "Ya tengo" are informational: no switches, no removing from the list, no quantities.
- No change to the Plan's other functions, the filters, the search or what a planned recipe shows.
- Descartada recipes other than the one Al came from stay out of the picker.
- No shortcut in rows (Recetas, Perfil, Plan); only in the detail.

## 5. User Stories & Acceptance Criteria

### US-1: Shopping-list modal from the detail
**As** Al, **I want** to see which ingredients of a recipe I still have to buy and add them to my list from its detail, **so that** I do not have to flip switches one by one.
- AC-1.1: Given the detail of any recipe, in any status, when it is shown, then it has the buttons "Añadir a lista de compra" and "Añadir al plan".
- AC-1.2: Given a recipe, when Al taps "Añadir a lista de compra", then a modal (bottom sheet on small windows) opens with the recipe's title and its ingredients in the groups "Faltan", "En mi lista de la compra" and "Ya tengo", in that order, each ingredient once.
- AC-1.3: Given an ingredient of the catalog that is not a staple, whose `have` is off and `to_buy` is off, then it is in "Faltan".
- AC-1.4: Given an ingredient of the catalog that is not a staple, whose `have` is off and `to_buy` is on, then it is in "En mi lista de la compra".
- AC-1.5: Given an ingredient whose `have` is on (whatever `to_buy` is), or a staple, then it is in "Ya tengo".
- AC-1.6: Given pending changes in the outbox, when the modal opens, then the groups take them into account (an ingredient just switched on in Despensa while offline is placed by its pending value).
- AC-1.7: Given a group with no ingredients, then that group is not shown.
- AC-1.8: Given at least one ingredient in "Faltan", when Al taps "Añadir a la lista", then "Comprar" is turned on for each of them, the modal closes, the detail is shown again, and the change is saved like any other pantry change.
- AC-1.9: Given no ingredient in "Faltan", then "Añadir a la lista" is disabled and the modal says that nothing is missing.
- AC-1.10: Given the modal, when Al taps "Cancelar", taps "Atrás", presses Esc or taps the backdrop, then it closes, the detail is shown again and nothing changes.

### US-2: Plan from the detail
**As** Al, **I want** "Añadir al plan" to take me to the Plan with this recipe ready, **so that** I only pick the slot.
- AC-2.1: Given the detail of a recipe, when Al taps "Añadir al plan", then the app shows the Plan and the detail closes.
- AC-2.2: Given the Plan arrived from the button, when Al taps "Añadir" in any slot, then the picker opens with that recipe first in the list, highlighted, and already chosen, so "Añadir receta" is enabled.
- AC-2.3: Given the picker open in that state, then the search box and the rest of the library are there as always; tapping another recipe moves the choice, tapping the chosen one clears it, and search filters the whole list as always.
- AC-2.4: Given a search that does not match the origin recipe, then it leaves the list like any other; clearing the search brings it back first.
- AC-2.5: Given the picker was opened once from that arrival, when it is opened again (after adding or after closing it without adding), then it is the usual picker with no recipe first and none highlighted.
- AC-2.6: Given the origin recipe is Descartada, then it is first and highlighted in that one opening, and no other Descartada recipe is listed.
- AC-2.7: Given a recipe whose status is Por probar, then it is plannable exactly like a Probada one, with no status control.
- AC-2.8: Given a recipe already planned, then it can be planned again (as today).

### US-3: Same groups after planning
**As** Al, **I want** the sheet that appears after planning a recipe to use the same groups, **so that** it never contradicts the modal of the detail.
- AC-3.1: Given a recipe just planned, when it has ingredients in "Faltan", then the sheet opens with the three groups and the buttons "Continuar" and "Añadir a mi lista de la compra".
- AC-3.2: Given the sheet, when Al taps "Añadir a mi lista de la compra", then "Comprar" is turned on for the "Faltan" ingredients only, as in AC-1.8.
- AC-3.3: Given the sheet, when Al taps "Continuar", presses Esc or taps the backdrop, then the shopping list stays as it is and the recipe stays in the plan.
- AC-3.4: Given a recipe just planned with nothing in "Faltan", then the sheet does not open, as today.

## 6. Functional Requirements
1. FR-1: The recipe detail shows two buttons, "Añadir a lista de compra" and "Añadir al plan", for every recipe in every status.
2. FR-2: Ingredient classification (shared by the modal and the Plan sheet), over the recipe's ingredient lines, each catalog ingredient once, in recipe order, optional lines included: Ya tengo = staple, or `have` on; En mi lista de la compra = not Ya tengo and `to_buy` on; Faltan = the rest. `have` and `to_buy` are the stored values with the outbox's pending changes applied.
3. FR-3: Ingredients that are not in the catalog are not listed in any group.
4. FR-4: The modal lists the groups in the order Faltan, En mi lista de la compra, Ya tengo, hides empty groups, and shows each group's count in its heading.
5. FR-5: "Añadir a la lista" enqueues `pantry.setBuy` (on) for each ingredient of Faltan and closes the modal; it is disabled when Faltan is empty.
6. FR-6: Closing the modal by "Cancelar", "Atrás", Esc or the backdrop changes nothing.
7. FR-7: "Añadir al plan" shows the Plan section and closes the detail, carrying the recipe id.
8. FR-8: While the carried recipe is pending, the first opening of the recipe picker from any slot lists that recipe first, highlighted and chosen, then the rest in the usual order without repeating it; any opening afterwards, and leaving the Plan, ends it.
9. FR-9: The origin recipe is listed in that opening even if it is Descartada; the rest of the picker follows the existing rule (no Descartadas).
10. FR-10: An origin recipe id that does not exist in the library is ignored and the picker is the usual one.
11. FR-11: The sheet shown after a recipe is planted uses FR-2 and FR-4; it opens only when Faltan is not empty; "Añadir a mi lista de la compra" turns "Comprar" on for Faltan only.
12. FR-12: Pantry and plan writes made from these flows use the same outbox, write key (asked after the sheet or modal closes), pending counter and rejection notice as FLW-flip-switch and FLW-add-recipe-to-plan.
13. FR-13: Rating, favorite and share in the detail are unchanged.

## 7. Data Model / Schema Changes
Not applicable: no new fields, files or operations. `pantry.setBuy` (pantry schema 2) and `plan.addRecipe` (plan schema 1) are used as defined in tech_standards §5 and ADR 001/003.

## 8. API / Interface Contracts
- No new endpoint; `POST /api/ops` receives existing operations.
- The Plan receives the origin recipe in its address, `/plan?add=<recipe-id>`; the Plan removes the parameter from the address when the suggestion ends, so reloading or sharing the link afterwards shows the usual Plan.
- Pure domain function (new, in `src/lib/domain`): classifies a recipe's ingredients into the three groups from recipe, catalog, `have`, `to_buy` (FR-2, FR-3). It replaces the current "faltantes" function; the Plan sheet and the modal both call it.

## 9. UI/UX Requirements
Platform: web (small under 640 px, medium 640 to 1279, large 1280 and up). Patterns: `Sheet` (bottom sheet on small windows, centered dialog from medium), `Button`, as CMP-recipe-picker and CMP-missing-ingredients.
- **Detail buttons:** two buttons in a row under the rating/favorite/share row, secondary style with icons from lucide-react, full width on small windows.
- **Modal (CMP shopping-list modal):** title = recipe title, subtitle "Lista de compra"; three groups with headings "Faltan (n)", "En mi lista de la compra (n)", "Ya tengo (n)"; ingredient names capitalized as in CMP-missing-ingredients; buttons "Cancelar" (secondary) and "Añadir a la lista" (primary). "Atrás" is the sheet's close/back control. "Ya tengo" is collapsed by default when it has more than 5 ingredients.
- **Plan sheet:** same groups and ingredient list; buttons unchanged.
- **Picker with suggestion:** the origin recipe row is first, with the chosen style the picker already has plus a label "Tu receta" on the row. The rest of the list is as today.
- **Plan after arriving:** no banner or extra control (the suggestion is visible in the picker only).
- **States:** modal with Faltan empty: "No te falta nada: todo está en tu despensa o en tu lista", button disabled; recipe without catalog ingredients: "Esta receta no tiene ingredientes del catálogo" and no groups; library offline: works from the stored library; Plan file missing: the Plan's existing message, no picker, suggestion dropped.
- Accessible names: the buttons use their labels; groups are headings; the highlighted row exposes "Tu receta" in its accessible name.
- Copy in Spanish; a UI-kit registry entry is added for the new modal component.

## 10. Edge Cases & Error Handling
- Recipe with no ingredients, or with none in the catalog: modal with the empty state; nothing is written.
- Ingredient listed twice in the recipe: counted once, in the group of its first line.
- Ingredient with `have` and `to_buy` both on: Ya tengo.
- Staple in the recipe: Ya tengo, never Faltan, never written.
- Pending changes (outbox) flip an ingredient between groups while the modal is open: the groups update and the button reflects the new Faltan.
- "Añadir a la lista" offline or without a key: ingredients appear on the list at once and wait in the outbox; the key dialog opens after the modal closes; "Ahora no" leaves them pending (FLW-enter-write-key).
- Server rejects a write: same notice and rollback as FLW-flip-switch.
- Ingredient turned on for list that was already on (race with another device): idempotent, stays on.
- Taps twice on "Añadir a la lista": only one set of writes (the modal closes on the first tap).
- Plan file missing or unreadable: "Añadir al plan" still navigates; the Plan shows its message; the suggestion is dropped.
- Origin recipe removed from the library between sync and arrival: FR-10.
- Origin recipe Descartada: see FR-9; planning it is allowed once; adding it again later goes through the usual picker, which does not offer it.
- Detail opened over the Plan (CMP-detail-layer): "Añadir al plan" closes the layer and starts the suggestion in place, with no navigation.
- User opens the picker, closes it without adding, and wants the suggestion back: not available (AC-2.5); they use the detail button again.
- Window resized between layouts while the modal or picker is open: text and choice are kept (as CMP-recipe-picker).
- Reload with `?add=` in the address: the suggestion is still pending until the picker opens once.
- Rapid double navigation (button tapped twice): a single Plan and a single suggestion.

## 11. Non-Functional Requirements
- Performance: the classification is synchronous over at most a few dozen ingredient lines; the modal and the picker open without waiting for the network.
- Offline: all reads from the stored library and outbox; writes through the outbox (tech_standards §11).
- Accessibility: modal and sheet are focus-trapped and closable with Esc as `Sheet` already is; the three headings are real headings; buttons have visible focus and touch targets of at least 44 px; the highlighted row is not conveyed by color alone (label "Tu receta").
- Security: no new write path; the write key rules are unchanged.

## 12. Dependencies & Existing System Touchpoints
- recipes: SCR-recipe-detail, CMP-detail-layer (new buttons; the layer also opens over Perfil, Plan and Despensa).
- plan: SCR-plan (arrival with the recipe), CMP-recipe-picker (first row), CMP-missing-ingredients (three groups), FLW-add-recipe-to-plan.
- pantry: `pantry.setBuy`, CMP-pending-changes, CMP-write-key, FLW-flip-switch, FLW-enter-write-key.
- Feature 008 (the "faltantes" definition is replaced by FR-2), 011 (picker excludes Descartadas; one exception here), 012 (detail rating row).
- Blocking/blocked: none. Tech standards: no new library, no ADR needed.

## 13. Assumptions & Open Questions
- Confirmed: ingredients not in the catalog are not listed in any group (FR-3), because they have no switches.
- Confirmed: the Plan sheet keeps opening only when Faltan is not empty (FR-11).
- Assumption: the vision backlog gets a new item for this feature (#12), added when it is documented.
- Retraction recorded: Por probar recipes can be planned; this already holds, so no behavior changes (AC-2.7).
- Open: none.

## 14. Rollout & Testing Considerations
- No flag, no migration; ships with the app.
- Unit tests (vitest) for: the classification (every group, Tengo wins, staples, duplicates, non-catalog, optional lines, pending changes); the picker ordering with an origin recipe (present, absent, Descartada, search, second opening); the replaced Plan helper; the `?add=` parsing.
- Existing tests of the old "faltantes" function and the Plan sheet are updated.
- Manual: both viewports; offline; no key; Plan file missing; detail opened over the Plan.

## 15. Appendix
- Glossary: Faltan (not at home and not on the list), En mi lista de la compra (`to_buy` on, `have` off), Ya tengo (`have` on, or staple), receta de origen (the recipe whose detail Al came from).
- Master doc sections used: `recipes` (SCR-recipe-detail, CMP-detail-layer), `plan` (SCR-plan, CMP-recipe-picker, CMP-missing-ingredients, FLW-add-recipe-to-plan), `pantry` (FLW-flip-switch, CMP-write-key, CMP-pending-changes).
- Related: `002_recipe-detail_prd.md`, `007_pantry-shopping-list-switches_prd.md`, `008_meal-plan-calendar_prd.md`, `011_recipe-status-filter_prd.md`, `012_recipe-ratings_prd.md`.

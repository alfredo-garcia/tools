# PRD: Meal Plan Calendar

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; `tech_foundations` re-approved 2026-10-30; plan storage per ADR 003, accepted 2026-10-30)
> Source feature doc: `008_meal-plan-calendar.md`
> Master doc referenced: `docs/functional-spec.md` (domains `library`, `recipes`, `navigation`, `pantry`; screen SCR-plan; components CMP-recipe-search, CMP-detail-layer, CMP-pending-changes, CMP-write-key; flow FLW-flip-switch)
> Status: Approved (2026-10-30)
> Branch: `my-food-manager/008-meal-plan-calendar`; commits start with `[my-food-manager/008]`

## 1. Summary
Replaces the "Próximamente" placeholder of Plan (`/plan`) with a calendar from today onward. Each day has three slots, Desayuno, Almuerzo and Cena, and each slot holds any number of recipes. A recipe is added through a picker (bottom sheet on small windows, modal on medium and large) with a search box, and removed with an X. When a recipe is added, the app checks its ingredients against the pantry and, if some are missing, offers to mark them "Comprar" on the shopping list. Small windows show days stacked and load 7 more days when scrolling; medium and large windows show a Monday–Sunday week in columns with previous/next week buttons. The plan is one agenda for the household, saved to Drive.

## 2. Background & Context
- SCR-plan is a placeholder (functional spec, domain `navigation`); the main navigation already routes Plan to `/plan`.
- The write architecture exists from feature 007: `POST /api/ops`, the IndexedDB outbox, the shared write key (CMP-write-key) and the pending-changes indicator (CMP-pending-changes). Today it handles only pantry operations on one file.
- ADR 003 (accepted 2026-10-30) decides the storage: `plan/plan.yaml`, a map `YYYY-MM-DD` → list of meals `{ slot, label, note, dishes }` (food-manager's schema), edited through `plan.addRecipe` and `plan.removeRecipe`, per-entry merge, multi-file batches grouped per file and not atomic. The file is created by the food-manager skill; the app never creates it. `food/_system/schema.md` must get the plan section (plan schema 1) before implementation.
- Pantry schema 2: `items` map with `{ have, to_buy }` per non-staple ingredient; staples are never listed and always available. Existing pantry operations: `pantry.setHave`, `pantry.setBuy`.
- The `Sheet` component is registered in the UI Kit Registry (bottom sheet on small windows, centered modal on larger ones, traps focus, closes on Esc/backdrop) but is not implemented yet; the pantry's `KeyDialog` is an own overlay waiting for it.
- Breakpoints (ui_standards): `small <640`, `medium 640–1279`, `large >=1280`.
- Trigger: vision v2 stage 2, backlog #6; vision revised 2026-10-30 to three meal times.

## 3. Goals & Success Metrics
- G1: a recipe is added to a slot in at most 4 taps from `/plan` (Añadir → recipe → Añadir receta, plus one tap if the missing-ingredients sheet appears).
- G2: an add or remove shows on screen in under 100 ms, with or without connection.
- G3: a change made online is in `plan/plan.yaml` within 5 seconds; one made offline within 5 seconds of the connection and a valid key returning.
- G4: no change is lost: after any sequence of online/offline periods, reloads and a missing or wrong key, every recipe the user added or removed ends up in Drive, unless rejected and reported.
- G5: a recipe with missing ingredients never goes unnoticed: the missing-ingredients sheet appears every time.
- Metric (manual, real library and Drive): plan a week on a phone and read it on a second device; add/remove on both (one offline); after sync Drive and both screens agree and the file keeps its other days.

## 4. Non-Goals / Out of Scope
- Recipes only: no free text entries, portions/servings, clock times or notes.
- No drag and drop, copy of day/week, templates, or reordering inside a slot.
- The shopping list is not generated or recalculated from the plan. Only the recipe being added is checked, at that moment. Removing a recipe, or later pantry changes, do not touch the list. Plan-driven list and "bought refills pantry" are backlog #8.
- No editing or viewing of past days, no history.
- No per-person plans, no real-time sync, no conflict screen (last change wins per entry).
- The app never creates `plan/plan.yaml`, nor deletes any Drive file or any plan day.
- No change to the recipe list, filters, search, detail, or to the Despensa screen.
- No confirmation before removing and no undo for a removal.

## 5. User Stories & Acceptance Criteria

**US-1 See the plan.** As Al, I want to see what is planned for each day.
1. Given `/plan` on a small window (<640px), then days appear stacked vertically starting with today, each with a heading (e.g. "Hoy", "Mañana", then "jueves 5 nov") and three slots in the order Desayuno, Almuerzo, Cena.
2. Given a slot with recipes, then each recipe shows its photo (or placeholder) and title in the order they appear in the file (all meals of that slot together); an empty slot shows only its name and the "Añadir" action.
3. Given a recipe in a slot, when I tap its title or photo, then the recipe detail opens (CMP-detail-layer) and closing it returns me to the same place in the Plan.
4. Given the plan file has a recipe id that no longer exists in the library, then it is not shown, and not counted anywhere. Given a free-text dish (`text`), then it is shown as plain text in its slot without photo, with no X and no detail link.
5. Given `/plan` opened offline after a previous sync, then the cached plan is shown.

**US-2 Pick and add a recipe.** As Al, I want to add a recipe to a slot.
1. Given a slot, when I tap "Añadir" (a "+" button labelled "Añadir"), then a picker opens: a bottom sheet on small windows, a centered modal on medium and large, titled with the day and slot (e.g. "Añadir al almuerzo · jueves 5 nov").
2. Given the picker, then it shows a search box ("Buscar receta") and the list of library recipes (photo and title), and a bottom button "Añadir receta" that is disabled.
3. Given the picker, when I tap a recipe, then it shows as selected and "Añadir receta" is enabled; tapping the selected recipe again deselects it and disables the button; tapping another recipe moves the selection.
4. Given 3 or more characters typed in the search box, then the list is filtered by the same matching rules as CMP-recipe-search; with fewer, the full list shows. If nothing matches, "Sin resultados" shows and the selection is kept.
5. Given a selected recipe, when I tap "Añadir receta", then the picker closes and the recipe appears at the end of that slot.
6. Given the picker, when I press Esc, tap the backdrop or the close control, then it closes and nothing is added.
7. Given a slot, then there is no limit to recipes in it, and the same recipe may be added again.

**US-3 Remove a recipe.** As Al, I want to take a recipe out of a slot.
1. Given a recipe in a slot of today or a later day, then it has an "X" control labelled "Quitar <title>".
2. Given I tap it, then the recipe disappears at once from that slot (one occurrence if repeated) and the change is saved; the shopping list is not touched.

**US-4 Pantry check on add.** As Al, I want to know what I am missing when I plan a recipe.
1. Given I added a recipe, when every ingredient line is a staple or is "Tengo", then no extra sheet appears.
2. Given I added a recipe with ingredients not at home, then a second sheet/modal opens with the text "En tu despensa te faltan estos ingredientes:" and the list of missing ingredient names, and two buttons: "Continuar" and "Añadir a mi lista de la compra".
3. Given the missing-ingredients sheet, when I tap "Continuar", then it closes, the recipe stays in the plan and the shopping list is not changed.
4. Given the missing-ingredients sheet, when I tap "Añadir a mi lista de la compra", then every listed ingredient gets "Comprar" on (those already on stay on), the sheet closes and the recipe stays in the plan.
5. Given the missing-ingredients sheet, when I press Esc or tap the backdrop, then it behaves as "Continuar".

**US-5 Small window: days keep loading.** As Al, on my phone, I want to scroll through the coming days.
1. Given `/plan` on a small window, then it shows today and the next 7 days (8 days).
2. Given I scroll to the end of the loaded days, then 7 more days are appended below, with no upper limit.
3. Given a small window, then no day before today can be reached.

**US-6 Medium/large window: weekly columns.** As Al, at home, I want to see a whole week.
1. Given `/plan` on a medium or large window, then it shows the current week from Monday to Sunday, one column per day, each column with the day heading and the three slots.
2. Given the current week, then days before today are dimmed, show their recipes, and have no "Añadir" nor "X".
3. Given the current week, then the "previous week" button is disabled; given a later week, then it is enabled and moves back one week (never before the current week).
4. Given any week, when I tap the "next week" button, then the following Monday–Sunday week shows; there is no upper limit.
5. Given a week is shown, then a title shows its range (e.g. "26 oct – 1 nov") and, for the current week, the day of today is highlighted.
6. Given the window is resized across 640px, then the layout switches between the vertical list and the weekly columns without losing the plan.

**US-7 Saving.** As Al, I want the plan to reach Drive even from poor signal.
1. Given I add or remove a recipe online with a valid key, then it is saved to `plan/plan.yaml` and shows as saved.
2. Given I am offline or the key is missing/rejected, then the change shows on screen, waits as pending (same indicator and key dialog as the pantry), and is sent in order when possible.
3. Given the first change on a device, then the write key is asked once, as in feature 007.
4. Given a plan change and "Añadir a mi lista de la compra" in one action, then both reach Drive (the server writes the pantry first and the plan last) and each shows its own pending/failed state.

## 6. Functional Requirements
1. FR-1: `/plan` shows the "Plan" screen, titled "Plan · My Food", replacing the placeholder; it opens offline from the cache.
2. FR-2: "Today" is the device's local calendar date.
3. FR-3: Day slots are, in order, Desayuno (`breakfast`), Almuerzo (`lunch`), Cena (`dinner`).
4. FR-4: The screen never shows or edits a day before today; on a medium/large current week, earlier days of that week are shown dimmed and read-only.
5. FR-5: Layout is chosen by window width: <640px vertical list, >=640px weekly columns (US-6).
6. FR-6: Vertical list initially renders today plus the next 7 days and appends 7 days each time the end is reached, with no limit.
7. FR-7: Weekly view starts at the Monday of the current week; "previous week" is disabled at that week; "next week" is always enabled.
8. FR-8: Each editable slot has an "Añadir" action; a slot holds unlimited recipes, repeats allowed, in file order. Slots `snack` (Merienda) present in the file are preserved but not shown.
9. FR-9: The picker is a `Sheet` (bottom sheet <640px, centered modal otherwise), with a search box, a single-select recipe list and a bottom "Añadir receta" button enabled only with a selection.
10. FR-10: Picker search uses the recipe search matching rules (3 characters minimum, ignoring case and accents, name/title match); below 3 characters the whole library shows.
11. FR-11: Confirming adds the recipe to the slot at once (optimistic), queues a `plan.addRecipe` operation and closes the picker.
12. FR-12: Each recipe dish in an editable slot has an X that removes that dish (one occurrence) at once and queues a `plan.removeRecipe` operation.
13. FR-13: After an add, missing ingredients (optional lines included) = the recipe's ingredient lines that reference a catalog ingredient which is not a staple and is not "Tengo" in the pantry. Lines without a catalog ingredient are ignored. Each missing ingredient is listed once, by catalog name.
14. FR-14: If there are missing ingredients, the missing-ingredients sheet opens after the picker closes, with the two buttons of US-4.
15. FR-15: "Añadir a mi lista de la compra" queues one `pantry.setBuy` (value true) per missing ingredient and applies it on screen at once; "Continuar" and dismissing queue nothing.
16. FR-16: Plan and pantry operations use the existing outbox, write key, pending/failed indicator and replay rules; operations keep their order.
17. FR-17: Tapping a recipe in a slot opens its detail with the existing detail layer.
18. FR-18: Recipe ids in the plan that are not in the library are not rendered and not counted.
19. FR-19: Only the minimum of the plan is written: `days` entries for add/remove and `updated`; every other content of the file is preserved (tech_standards §5).

## 7. Data Model / Schema Changes
- **Drive file** `plan/plan.yaml` (plan schema 1, ADR 003), already created by food-manager (`days: {}`) with its section in `food/_system/schema.md`: `updated` (ISO 8601 with `-05:00`) and `days`, a map `YYYY-MM-DD` → list of meals `{ slot, label?, note?, dishes }`, `slot` in `breakfast`, `lunch`, `snack`, `dinner`; dish `{ recipe, servings?, note? }` or `{ text, note? }`. The app reads and writes only recipe dishes of `breakfast`, `lunch` and `dinner`; `add` creates `{ slot, dishes: [{ recipe }] }` or appends to the slot's last meal; `remove` drops one dish and cleans empty meals/days. Everything else (labels, notes, servings, text dishes, `snack`) is preserved.
- **Snapshot** gains `plan`: the days from today (in `-05:00`, minus one day of tolerance, see §10) onward in the file's own meal/dish shape (the client groups dishes by slot), plus the file's `updated`. Missing file → `plan` absent and the screen shows an error state (see §10), not an empty plan.
- **Client**: the outbox holds plan operations beside pantry ones; the screen derives its view from snapshot plan + pending operations.
- No change to recipes, ingredients, pantry or reviews data.

## 8. API / Interface Contracts
- `GET /api/snapshot`: adds `plan` (above). ETag behaviour unchanged.
- `POST /api/ops` (header `x-app-key`, as in 007): the body keeps `{ ops: [...] }`, up to 100 operations, each with `id` (unique), `kind`:
  - `pantry.setHave` / `pantry.setBuy`: `{ id, kind, ingredient, value }` (unchanged).
  - `plan.addRecipe`: `{ id, kind, date: "YYYY-MM-DD", meal: "breakfast"|"lunch"|"dinner", recipe: <recipe-id> }`.
  - `plan.removeRecipe`: same fields; removes one occurrence, no-op if absent.
- Response: `results[]` per op (`applied` / `rejected` with `{code, message}`, as today) and the refreshed `pantry` and `plan` sections. Operations are grouped by file; each file is read, written and retried independently, pantry first and plan last (ADR 003). The response carries `pantry` only when the batch had pantry operations and `plan` only when it had plan operations. `INVALID_OP` rejections for: unknown kind, bad `date` format, `date` earlier than the server's tolerance (below), unknown `meal`, unknown recipe id on add.
- Errors keep the standard format `{ "error": { code, message } }`: `UNAUTHORIZED` for a missing/wrong key, `PLAN_MISSING` (404) if `plan/plan.yaml` does not exist, `PLAN_INVALID` (500) if it cannot be parsed, `CONFLICT` (409) as for the pantry.
- Pantry operations are idempotent (set a value). A plan operation whose `id` this server instance applied in the last 10 minutes is answered `unchanged` and not applied again (best effort, ADR 003).

## 9. UI/UX Requirements
Reuses ui_standards and the kit; components to define with ux-designer (UX Flow): `PlanScreen`, `PlanDay`, `PlanSlot`, `PlanRecipeItem`, `RecipePickerSheet`, `MissingIngredientsSheet`, `WeekNav`; `Sheet` is implemented as registered, and other overlays reuse it. Copy is Spanish.
- **Small (<640px):** vertical list of day sections, each with three slots; the "Añadir" action sits at the end of each slot; pickers are bottom sheets.
- **Medium/large:** week header with the range and previous/next buttons at the sides of the columns; seven columns (on medium windows, where seven columns do not fit, the week scrolls horizontally with a minimum column width of 132px; large fits all seven). Pickers are centered modals.
- **States:** loading (skeleton days while there is no snapshot), empty slot (name + "Añadir"), loaded, pending change (reuse CMP-pending-changes: pending/failed markers and retry), offline (screen works from cache; the sync badge as elsewhere), error when `plan/plan.yaml` is missing ("El plan todavía no está disponible en Drive" with no add/remove actions), picker with no results, recipe library empty (picker shows "No hay recetas todavía").
- **Accessibility:** sheets/modals trap focus, close on Esc, return focus to the opener (like `Sheet`); the X has an accessible name; selected recipe in the picker is exposed with `aria-selected`; infinite loading also offers no keyboard trap (the end of the list is reachable with the keyboard).
- Dark and light themes via existing tokens; icons from lucide-react only.

## 10. Edge Cases & Error Handling
- Empty library: picker shows its empty message; "Añadir receta" stays disabled.
- Adding the same recipe twice to a slot: two entries; the missing-ingredients sheet appears each time if still missing.
- Removing a repeated recipe removes only one occurrence.
- Two devices add to the same slot: both entries survive (append). Two devices remove the same entry: the second is a no-op.
- Recipe deleted from Drive after being planned: hidden (FR-18); its removal is not offered.
- A rejected operation (e.g. recipe unknown to the server): the optimistic entry is reverted and the failure is shown with the existing failed-change indicator.
- Wrong or missing write key: changes stay pending; key dialog as in 007; nothing lost.
- `plan/plan.yaml` missing or invalid: the error state above; the screen does not offer to create it.
- Midnight passes while the screen is open: on next focus/visibility the "today" boundary is recalculated; the previous day becomes read-only (medium/large) or disappears (small) without losing scroll position.
- Time zones: the server accepts a `date` no earlier than the day before "today" in `-05:00`, so a device ahead of or behind Colombia time is never wrongly rejected; the UI itself never offers a day before the device's today.
- The recipe's ingredient references an id missing from the catalog: ignored for the missing check.
- Everything in the pantry is staple or "Tengo": no sheet.
- Add pressed while the pantry is still being changed by a pending operation: the check uses the pantry as shown on screen (snapshot + pending operations).
- Browser resized while a picker is open: the picker changes between sheet and modal keeping search text and selection.
- Plan operations succeed but the pantry marking fails (multi-file, not atomic): the recipe stays in the plan; the pantry operations stay pending/failed and visible, never silently dropped.
- Loading more days when offline on small windows: days are generated locally (empty if no data), so scrolling is never blocked.

## 11. Non-Functional Requirements
- Performance: the plan view renders from the cache without network; rendering 8 days or 7 columns with up to ~10 recipes per day stays smooth (no layout jump while loading more days); the picker list with 100+ recipes filters without perceptible lag.
- Security: writes need `x-app-key`; no new secret; plan data is low sensitivity.
- Accessibility: keyboard operable (Tab to every action, Esc closes overlays), visible focus, touch targets >= 44px, `prefers-reduced-motion` respected for sheet transitions.
- Scale: one household, a few weeks of data, ≤100 operations per batch (ADR 003 revisit signal at ~100 KB file size).

## 12. Dependencies & Existing System Touchpoints
- Master doc: SCR-plan (replaced), CMP-main-navigation (unchanged), CMP-recipe-search (matching rules), CMP-detail-layer (recipe detail from a planned recipe), CMP-pending-changes and CMP-write-key (reused), FLW-flip-switch (outbox behavior), SCR-ingredients (pantry data it reads; unchanged).
- Code areas: `lib/drive` (multi-file write path, `ops.ts`), `lib/domain/pantry-ops.ts` (a new plan-ops module beside it), `lib/schema` (zod for plan and the extended ops), `lib/offline` (outbox accepts plan ops), `app/plan/page.tsx`, `components/overlays/Sheet`, new `components/plan/*`.
- Done 2026-10-30: the food-manager skill extended `food/_system/schema.md` and created the empty `plan/plan.yaml`. Its note that optional ingredients are not shopping candidates covers its own flow; FR-13 counts them in this feature. `drive.readonly` scope and Viewer sharing already moved to write access in 007.
- Blocked by this: backlog #8 (plan-driven shopping list) builds on this plan data; the "Inspiration" feature may later add recipes to the plan.
- Shared dependencies: none.

## 13. Assumptions & Open Questions
- Assumed: slot ids are English as in the schema; the UI says Desayuno, Almuerzo, Cena (the schema's label for `lunch` is "Comida"; the app keeps the wording the user asked for). New dishes get no `servings` (the schema defaults to the recipe's).
- Assumed: a single selected recipe per "Añadir receta" press (to add several, repeat the flow).
- Assumed: "today" is the device date; the server tolerance protects against time zones.
- Decided 2026-10-30: ingredient lines marked optional in a recipe count as missing like any other (FR-13 makes no exception).
- Decided 2026-10-30 (UX Flow, approved prototype): medium and large columns have a minimum width of 132px (not ~150px) so that seven fit at 1280px with the sidebar expanded; medium scrolls horizontally. Picker search applies after 1000 ms without typing or on Enter, like the other searches. The write key dialog waits until the picker and the missing-ingredients sheet are closed. Overlays of the Plan are centered modals on medium and large (ui_standards §9 exception).

## 14. Rollout & Testing Considerations
- Order of work: (1) food-manager's schema section and `plan/plan.yaml` (done); (2) schema/ops/domain with tests; (3) `Sheet`; (4) Plan UI; (5) manual check on a phone-sized viewport and on desktop.
- Unit tests (vitest): plan ops merge (add append, repeats, remove one occurrence, no-op on absent, rejected cases, preserving other days and `updated`), per-file grouping and partial failure in `runOps`, outbox replay with plan + pantry ops, zod schemas against a real sample `plan.yaml`, week and day-range calculations (current week start, no backward navigation, +7 day loading), missing-ingredient computation (staples, `have`, unknown ids, duplicates).
- Manual acceptance: US-1 to US-7 on a phone-sized viewport and on desktop, including offline add/remove, wrong key, and two devices.
- No feature flag: the Plan section replaces a placeholder.

## 15. Appendix
- Glossary: **Slot**: one meal time of one day (Desayuno, Almuerzo, Cena). **Plan**: the household's agenda of recipes per day and slot. **Faltante**: a non-staple ingredient of a recipe that is not "Tengo".
- References: `docs/functional-spec.md` (SCR-plan, CMP-recipe-search, CMP-detail-layer, CMP-pending-changes, CMP-write-key, FLW-flip-switch); `docs/architecture/adr/003_meal-plan-storage.md`; `docs/features/007_pantry-shopping-list-switches_prd.md`; `docs/context/ui_standards.md`.

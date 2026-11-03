# PRD: Plan: Eat Out and Delivery

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; ADR 005 accepted 2026-11-03)
> Source feature doc: `014_plan-eat-out-delivery.md`
> Master doc referenced: `docs/functional-spec.md` (domain `plan`; SCR-plan, CMP-plan-calendar, CMP-recipe-picker, CMP-missing-ingredients, CMP-pending-changes, CMP-write-key, FLW-add-recipe-to-plan, FLW-remove-plan-recipe)
> Status: Approved

## 1. Summary
The recipe picker of the Plan gets a row with two options before the search: "Salir fuera" and "Pedir". Choosing one marks that slot of that day as `eat-out` or `delivery` in `plan/plan.yaml`. In the Plan each mark shows its own icon and the schema label ("Comer fuera", "Pedir a domicilio"), so Al sees at a glance which meals are not cooked at home. "Comer fuera" takes the whole slot; "Pedir a domicilio" can share it with recipes. It is for Al, and the household partner sees the same plan, on phone and desktop, online or offline.

## 2. Background & Context
- SCR-plan shows the days from today with the slots Desayuno, Almuerzo and Cena. Each slot lists its recipes and free-text dishes and offers "Añadir", which opens CMP-recipe-picker (search, single-select list, "Añadir receta"). Feature 013 made the picker open, once, with a recipe already chosen when Al comes from a recipe detail.
- The app writes only `plan.addRecipe` and `plan.removeRecipe` today, and it drops `out` dishes when reading the plan, so marks written by food-manager are invisible.
- `food/_system/schema.md` (plan schema 1, updated 2026-11-03): an `out` dish is `eat-out` (Comer fuera) or `delivery` (Pedir a domicilio). A meal with `eat-out` has no other dishes. A meal with `delivery` may also hold `recipe` or `text` dishes, but only one `delivery`. `out` dishes add no ingredients and are never shopping candidates.
- ADR 005 (accepted 2026-11-03) adds `plan.addOut` and `plan.removeOut` and applies the rules per slot.
- Why now: an empty slot looks the same as one nobody planned, so the plan does not reflect the weeks Al actually lives.

## 3. Goals & Success Metrics
- G1: Al marks a slot as eaten out or ordered in with two taps ("Añadir", then the option).
- G2: Each mark is recognizable without reading: a distinct icon per kind, in both layouts.
- G3: The app never writes a plan that breaks the schema rules (`eat-out` alone, one `delivery`).
- Metric (manual, phone-sized and desktop viewport): mark an empty slot with each option, a slot with recipes with "Pedir", try "Salir fuera" on a slot with recipes and on one with "Pedir", remove each mark; check `plan.yaml` in Drive and the Plan on the second device after each step.

## 4. Non-Goals / Out of Scope
- Slot by slot only: no "whole day out" action.
- Marks never change the pantry or the shopping list and never open CMP-missing-ingredients.
- No restaurant name, note, label or any detail on a mark; only the two `out` values.
- No change to how recipes are found, chosen or shown; no change to free-text dishes (still read-only) or snack meals (still hidden).
- No conversion between marks (for example, turning "Pedir" into "Salir fuera" in one step): Al removes one and adds the other.
- No "out" statistics, history or filters.

## 5. User Stories & Acceptance Criteria

### US-1: Mark a slot from the picker
**As** Al, **I want** to choose "Salir fuera" or "Pedir" when I add to a slot, **so that** the plan shows that meal is not cooked at home.
- AC-1.1: Given the picker opened from "Añadir" of any slot, then a row with "Salir fuera" and "Pedir", each with its icon, is shown above the search box.
- AC-1.2: Given an empty slot, when Al taps "Salir fuera", then the picker closes and the slot shows "Comer fuera" with its icon, and nothing else.
- AC-1.3: Given an empty slot or a slot with recipes, when Al taps "Pedir", then the picker closes and the slot shows "Pedir a domicilio" with its icon, together with its recipes.
- AC-1.4: Given a slot with at least one dish (recipe, free text or "Pedir a domicilio"), when the picker opens, then "Salir fuera" is disabled.
- AC-1.5: Given a slot with "Pedir a domicilio", when the picker opens, then "Pedir" is disabled.
- AC-1.6: Given a slot with "Comer fuera", then the slot offers no "Añadir", so no recipe or "Pedir" can be added.
- AC-1.7: Given a slot with "Pedir a domicilio", when Al adds a recipe through the picker, then the recipe is added as today and the mark stays.
- AC-1.8: Given a mark is added, then CMP-missing-ingredients does not open and the pantry and the shopping list do not change.

### US-2: See and remove marks
**As** Al, **I want** each mark to stand out and to be removable, **so that** I know at a glance which days I don't cook and can change my mind.
- AC-2.1: Given a slot with "Comer fuera" or "Pedir a domicilio", in the day list and in the weekly columns, then the mark shows its own icon and its label, and an X named "Quitar Comer fuera" / "Quitar Pedir a domicilio".
- AC-2.2: Given a mark, when Al taps its X, then it disappears at once, with no confirmation and no undo, and the slot shows what is left (with "Añadir" again if it was "Comer fuera").
- AC-2.3: Given a mark written in Drive by food-manager, then after the next sync it shows exactly like one made in the app.
- AC-2.4: Given a day before today in the current week of the weekly view, then its marks show, dimmed, without X.

### US-3: Saved and shared
**As** Al, **I want** marks saved to Drive, **so that** the partner and Claude see them.
- AC-3.1: Given a mark added or removed, then the change goes to the outbox with the same sending, write key, pending counter and retry rules as FLW-add-recipe-to-plan, and shows at once, also offline.
- AC-3.2: Given the server rejects the change (see §10), then the mark leaves the screen (or comes back, for a removal) and a 4-second notice says "No se pudo guardar Comer fuera" / "No se pudo guardar Pedir a domicilio".

## 6. Functional Requirements
1. FR-1: CMP-recipe-picker shows, above the search box, one row with two buttons: "Salir fuera" (`eat-out`) and "Pedir" (`delivery`), each with its icon.
2. FR-2: Tapping an enabled option closes the picker and enqueues `plan.addOut { date, meal, out }` for the slot it was opened from. It does not need "Añadir receta" and ignores any recipe chosen in the list.
3. FR-3: "Salir fuera" is disabled when the slot, as shown (stored dishes plus pending changes), has any dish. "Pedir" is disabled when the slot has a `delivery` dish.
4. FR-4: A slot that has an `eat-out` dish shows no "Añadir".
5. FR-5: The Plan view shows `out` dishes: icon, label ("Comer fuera" or "Pedir a domicilio") and an X, with no photo and no detail link. Unknown `out` values are not shown.
6. FR-6: The X of a mark enqueues `plan.removeOut { date, meal, out }`.
7. FR-7: The pending view applies `plan.addOut` and `plan.removeOut` in order, like the recipe operations.
8. FR-8: The server applies the operations as ADR 005 states: `eat-out` rejected if the slot has any dish; `delivery` rejected if the slot has `eat-out`; an `out` already in place is `unchanged`; `plan.addRecipe` rejected if the slot has `eat-out` and never appended to an `eat-out` meal; removals clean empty meals and days.
9. FR-9: The snapshot carries `out` dishes (`eat-out`, `delivery`); everything else in the file is preserved on write.
10. FR-10: `out` operations never read or write the pantry and never open CMP-missing-ingredients.
11. FR-11: Rejections, write key and pending changes behave as in FLW-add-recipe-to-plan, with the mark's label as the name in the notice.
12. FR-12: Opening the picker from the 013 shortcut and then choosing an option marks the slot and ends the suggestion, as any other opening does.

## 7. Data Model / Schema Changes
- No new file or field: `out` dishes are already in `food/_system/schema.md` (plan schema 1, 2026-11-03 update).
- The snapshot's plan dish gains `{ out: "eat-out" | "delivery" }` next to `{ recipe }` and `{ text }`.
- Placement on write (ADR 005): `eat-out` gets its own new meal `{ slot, dishes: [{ out: eat-out }] }` in slot order; `delivery` is appended to the last meal of the slot, or to a new meal if there is none.

## 8. API / Interface Contracts
- `POST /api/ops` (plan group, header `x-app-key`), new operations:
  - `{ id, kind: "plan.addOut", date: "YYYY-MM-DD", meal: "breakfast" | "lunch" | "dinner", out: "eat-out" | "delivery" }`
  - `{ id, kind: "plan.removeOut", date, meal, out }`
- Per-op results as today: `applied`, `unchanged`, or `rejected` with `{ code: "INVALID_OP", message }` (message in Spanish, for example "La comida ya tiene platos" or "La comida es fuera de casa").
- `GET /api/snapshot`: plan dishes may be `{ out }`.

## 9. UI/UX Requirements (web)
- **Picker row:** two equal-width buttons in one row, outlined like the secondary `Button`, icon and text, between the title and the search box; disabled ones at reduced opacity.
- **Icons:** `Utensils` for Comer fuera and `Bike` for Pedir a domicilio (lucide-react), in the picker and in the Plan (confirmed by the user).
- **Mark in the slot:** a row like a planned recipe, with the icon on a tinted square of the photo's size instead of the photo, the label and the X; the row has a soft tinted background so it reads as "not cooked".
- **Order:** a mark is shown first in its slot, before recipes and free-text dishes, whatever its position in the file.
- **Accessible names:** the options are named "Salir fuera, <slot>, <day>" and "Pedir, <slot>, <day>"; a disabled option keeps its name and is marked disabled.
- **Narrow weekly columns (132 px):** the label may wrap to two lines; the icon and X stay visible.
- **States:** loading, offline, error and plan-file-missing as SCR-plan today; in the plan-file-missing state the options are not reachable, because there is no "Añadir".

## 10. Edge Cases & Error Handling
- "Salir fuera" on a slot that, on the server, already has a dish (added from the other phone or by food-manager): rejected; the mark leaves the screen with the notice.
- A recipe or "Pedir" added from one phone to a slot where the other phone just put "Comer fuera": the later one in apply order is rejected with the notice (ADR 005).
- "Pedir" added twice (two phones, or a retry): the second one is `unchanged`; the slot shows one mark.
- Removing a mark that is no longer there: `unchanged`; nothing changes.
- Pending offline: marks and removals show at once and wait in the outbox; FR-3 uses the slot with pending changes applied.
- Files from food-manager valid per meal but not per slot (for example, `eat-out` in one lunch meal and recipes in another lunch meal): all dishes are shown; the slot has `eat-out`, so it offers no "Añadir"; recipes and the mark keep their X.
- Two `delivery` dishes in one slot (in different meals, from food-manager): both are shown, each with its X; "Pedir" is disabled.
- Unknown `out` value in the file: not shown; kept on write.
- Removing the last dish of a meal or day removes the meal or day (as FLW-remove-plan-recipe).
- Plan file missing or unreadable: only the plan changes are rejected, as today.
- Days before yesterday in `-05:00`: rejected as today.
- Write key missing or rejected: as FLW-enter-write-key; the change stays pending.

## 11. Non-Functional Requirements
- Performance: no extra request; marks travel in the existing snapshot and outbox.
- Accessibility: the options and the X have accessible names (§9); a disabled option is marked disabled; icon and label always go together, so the mark never relies on the icon alone.
- Scale: not applicable beyond the vision's 2 users and one plan file.
- Security: writes need `x-app-key`, as all writes.

## 12. Dependencies & Existing System Touchpoints
- `food/_system/schema.md` plan section (owned by food-manager), updated 2026-11-03.
- ADR 003 (plan storage and operations) and ADR 005 (out dishes).
- SCR-plan, CMP-plan-calendar (`PlanSlot`, `PlanRecipeItem`), CMP-recipe-picker (`RecipePickerSheet`), CMP-pending-changes, CMP-write-key.
- my-food-manager/013 picker suggestion (FR-12).
- No shared dependencies.

## 13. Assumptions & Open Questions
- Assumption (from the user's answers): "Salir fuera" is blocked by any dish in the slot, including free-text dishes written by food-manager.
- Assumption: the app's per-slot rule is stricter than the schema's per-meal rule and never conflicts with it (ADR 005 §3).

## 14. Rollout & Testing Considerations
- No migration or flag; the schema already allows the marks.
- Unit tests (vitest): `applyPlanOps` for `addOut`/`removeOut` and every rule in FR-8, including `unchanged` cases, cleanup of empty meals and days, food-manager files with `eat-out` and `delivery` meals, and an unknown `out` value preserved; `planFromDays` keeps `out`; `planWithPending` applies the new ops; the picker availability rule (FR-3).
- Manual: the metric in §3, on a phone-sized viewport and desktop, plus offline add and remove.

## 15. Appendix
- **Mark:** an `out` dish shown in a slot. **Comer fuera:** `eat-out`. **Pedir a domicilio:** `delivery`.
- References: functional spec domain `plan`; ADR 003; ADR 005; `food/_system/schema.md` plan section.

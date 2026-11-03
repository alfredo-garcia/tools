# ADR 005: The app writes `out` dishes (eat-out, delivery) in the plan

> Project: `my-food-manager`
> Status: Accepted (2026-11-03)
> Triggered by: `my-food-manager/014` Plan: Eat Out and Delivery; tech_standards §5 ("`plan/plan.yaml` (add/remove recipe dishes per day and meal only, ADR 003)"); food-manager schema update of 2026-11-03 (plan `out` rules)

## Context
Feature 014 lets Al mark a slot of a day as eaten out or ordered in. The food-manager contract (`food/_system/schema.md`, plan schema 1) has an `out` dish with the values `eat-out` and `delivery`. It has no other fields, adds no ingredients and is never a shopping candidate. A meal with `eat-out` has no other dishes. A meal with `delivery` may also hold `recipe` or `text` dishes, but only one `delivery`.

Today ADR 003 and tech_standards §5 limit plan writes to adding and removing recipe dishes. `planFromDays` in `src/lib/domain/plan-ops.ts` drops `out` dishes from the snapshot, and `addDish` would append a recipe to an `eat-out` meal written by food-manager, which breaks the contract.

## Options Considered
- **Use what we have: no app writes; show marks made by food-manager only.** No standards change. Rejected: the feature is about marking from the Plan, and Al would have to ask Claude or use Telegram for every meal out.
- **Reuse `plan.addRecipe` / `plan.removeRecipe` with an optional `out` field instead of `recipe`.** No new kinds. Rejected: one op with two exclusive shapes and different rules (pantry check, recipe-id check, dedupe) makes validation and the client code harder to read for no gain.
- **A new pair `plan.addOut` / `plan.removeOut`, applied in the plan group (recommended).** Same file, write path, `modifiedTime` check and retry as ADR 003. The contract's rules are checked on the server against the latest file.

## Decision
1. **Operations** (plan group of `POST /api/ops`, same date and slot validation as ADR 003 §3):
   - `plan.addOut { date, meal, out }` with `out` = `eat-out` or `delivery`.
     - `eat-out`: rejected if the slot (any of its meals) already has any dish. If the slot already holds `eat-out`, the result is `unchanged`. Otherwise a new meal `{ slot, dishes: [{ out: eat-out }] }` is created in slot order.
     - `delivery`: rejected if the slot holds `eat-out`. If the slot already holds `delivery`, the result is `unchanged`. Otherwise `{ out: delivery }` is appended to the last meal of the slot, or a new meal is created in slot order.
   - `plan.removeOut { date, meal, out }`: removes that `out` dish from the slot's meals (first match). A meal left without dishes is removed, and a day left without meals is removed. If there is nothing to remove, the result is `unchanged`.
   - Rejections use the per-op `INVALID_OP` result (ADR 003). The client shows the 4-second notice and drops the change.
2. **`plan.addRecipe` changes:** it is rejected if the slot holds `eat-out`, and it never appends to a meal that holds `eat-out`. Adding a recipe to a slot with `delivery` is allowed.
3. **The app enforces a stricter rule: per slot, not per meal.** The app shows all meals of a slot as one list (ADR 003 §2), so "only one `delivery`" and "`eat-out` alone" are checked across the whole slot. That never contradicts the contract. Files written by food-manager that are valid per meal but not per slot (for example, `eat-out` in one lunch meal and recipes in another) are shown as they are and kept on write. Only new app writes follow the stricter rule.
4. **Idempotence:** `addOut` and `removeOut` are naturally idempotent (`unchanged` when already in place), so they don't need the 10-minute applied-ops memory. They may still go through it like the other plan ops.
5. **Snapshot:** the plan dish schema gains `{ out: "eat-out" | "delivery" }`. `planFromDays` keeps `out` dishes. An unknown `out` value is left out of the snapshot and preserved in the file.
6. **No other file is touched:** `out` ops never read or write the pantry, and they never trigger a missing-ingredients check.

## Consequences
- **tech_standards.md §5:** "The app writes only" changes `plan/plan.yaml` to "add/remove recipe dishes and `out` dishes (eat-out, delivery) per day and meal only, ADR 003, ADR 005". The operations example adds `plan.addOut`.
- **hl_architecture.md:** §5 data model, the Plan dishes, adds "or an `out` mark (eat-out, delivery)". §8 conflicts notes that concurrent adds of a recipe and `eat-out` to the same slot resolve in apply order: the later one is rejected. §10 indexes this ADR.
- **Code:** `src/lib/schema` (`PLAN_OP_KINDS`, `PlanOp` as a union, dish schema) and `src/lib/domain/plan-ops.ts` (new ops, the `eat-out` guard in `addDish`, `planFromDays`). There are no new libraries and no new files in Drive.
- **Tests:** unit tests for each rule above, including food-manager files with `eat-out` and `delivery` meals, `unchanged` results, empty-meal and empty-day cleanup, and an unknown `out` value that is preserved.
- **Watch:** two devices racing a recipe against `eat-out` on the same slot. The loser gets a notice, which is acceptable for 2 users. Revisit only if it happens in practice.

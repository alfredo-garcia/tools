# ADR 003: Meal plan stored in a shared Drive file, written by intent operations

> Project: `my-food-manager`
> Status: Accepted (2026-10-30)
> Triggered by: `my-food-manager/008` Meal Plan Calendar; Vision §9/§11 (plan lives in its own storage domain, write rules for two devices open)

## Context
The Plan must be saved to Drive and seen from both phones, Claude and Telegram. Today tech_standards §5 limits app writes to `pantry/pantry.yaml`, `reviews/<user>.yaml` and `curated`, and ADR 002 says the app never creates Drive files (a file created by the service account is owned by it and, in a user-owned folder, can fail on storage quota). The write path in `src/lib/drive/ops.ts` handles a single file (the pantry). Adding a recipe can also mark missing ingredients "Comprar" in the pantry, so one user action touches two files.

## Options Considered
- **Device-only plan (IndexedDB).** No schema or write-scope change. Rejected: Vision §11 decided the plan lives in Drive, and the partner would not see it.
- **Plan inside the pantry file or in the recipe files.** Reuses the existing write path. Rejected: mixes domains, would force pantry schema 3, and breaks the rule that the app never edits recipe fields.
- **New file `plan/plan.yaml`, edited by the app through intent operations (recommended).** Same pattern as ADR 001: read the latest file, apply the operation, `modifiedTime` check, one retry. Needs a schema addition and a generalized write path.
- **One file per month or per week.** Smaller files, but the app would have to create files (conflicts with ADR 002) and handle boundaries. Not justified at this scale.

## Decision
1. Add a new Drive file `plan/plan.yaml` (plan schema 1, as written by food-manager in `food/_system/schema.md` on 2026-10-30), one shared household agenda. It is **created outside the app** (food-manager skill, which owns the schema); the app only edits it and fails with `PLAN_MISSING` if absent, as with the pantry.
2. Shape (the food-manager contract, adopted as is): `updated` and `days`, a map `YYYY-MM-DD` → list of meals `{ slot, label?, note?, dishes }`; `slot` is `breakfast`, `lunch`, `snack` or `dinner`; a dish is `{ recipe, servings?, note? }` or `{ text, note? }`. Several meals of the same slot are allowed (told apart by `label`); a day's meals stay in slot order; empty days and meals left without dishes are omitted. Unknown fields (`label`, `note`, `servings`, `text` dishes, `snack` meals) are preserved on write. The app shows and edits `breakfast`, `lunch` and `dinner` only; it reads all dishes of a slot (across its meals) as one list and never creates `label`, `note`, `text` dishes or `snack` meals.
3. Operations (applied server-side, in `POST /api/ops` with the pantry ones):
   - `plan.addRecipe { date, meal, recipe }`: appends the dish `{ recipe }` to the last existing meal of that slot on that day, or creates a meal `{ slot, dishes: [{ recipe }] }` in slot order if the slot has none. Rejected (per-op result error) if `date` is before the server's tolerance (day before today in `-05:00`), `meal` is not one of the three, or the recipe id does not exist.
   - `plan.removeRecipe { date, meal, recipe }`: removes one dish with that recipe id from the slot's meals (first match, any meal of the slot); a meal left without dishes is removed, and a day left without meals is removed; no-op if absent. Removal never touches the pantry.
   - Pantry marking reuses the existing pantry operation that sets `to_buy` per ingredient.
4. Concurrency: operations are per entry, so two devices adding to the same slot both survive (append) and removals of an absent entry are no-ops. Same `modifiedTime` check and one retry as ADR 001, per file.
5. Multi-file batches: ops are grouped by target file; each file is read, written and retried independently, in the order plan then pantry. Writes are **not atomic across files**; each op reports its own result, and a failed group stays in the outbox for replay. Worst case is a recipe in the plan without its missing ingredients on the list, which the user can fix on the shopping list.
6. Past days stay in the file (the schema lets any writer remove them; the app does not prune); the snapshot returns days from today onward only.
7. Recipes deleted from Drive later: their ids are skipped by the Plan view and left in the file until food-manager cleans them (same rule as reviews).

## Consequences
- **tech_standards.md:** §5 contract line adds plan 1; "The app writes only" adds `plan/plan.yaml` (add/remove entries only); §5 operations examples add `plan.addRecipe`; §6 `POST /api/ops` notes multi-file batches; §3 `lib/schema` and `lib/domain` gain plan modules (no new library).
- **hl_architecture.md:** §4 `lib/drive` and `api/ops` mention the plan; §5 data model adds **Plan**; §8 conflicts adds the per-entry merge and the non-atomic multi-file note; §10 indexes this ADR.
- **Cross-project:** `food/_system/schema.md` (plan section) and the empty `plan/plan.yaml` were created by the food-manager skill on 2026-10-30; this ADR follows that contract. Where the schema says optional ingredients are not shopping candidates, the app's rule for feature 008 counts them (PRD FR-13); food-manager's note covers only its own flow.
- **Harder:** `ops.ts` and `pantry-ops.ts` must be generalized from "one pantry file" to per-file groups, with unit tests for the merge and for partial failure.
- **Watch:** the plan file growing (revisit with a yearly archive if it passes ~100 KB or snapshot time suffers), and lost updates when removing duplicate entries from two devices at once.

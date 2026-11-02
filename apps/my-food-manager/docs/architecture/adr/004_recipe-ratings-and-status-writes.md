# ADR 004: Ratings written to the reviews file, and `status` written to the recipe when a recipe is rated

> Project: `my-food-manager`
> Status: Accepted (2026-11-02)
> Triggered by: `my-food-manager/012` Recipe Ratings; tech_standards §5 ("never edits other recipe fields") vs. food-manager schema 4 ("giving a recipe a rating sets it to `tried`")

## Context
Feature 012 lets Al create, change and remove a star rating from the app. Two write needs follow:

1. **Ratings** live in `reviews/al.yaml` under `ratings` (`recipe id → { stars, comment?, date }`). The file is already written by the app for `favorites` (`review.setFavorite`, ADR 001/003 pattern), so this is the same file and the same write path with a new operation.
2. **Status.** The food-manager contract (`food/_system/schema.md`, recipes schema 4) says a rating sets the recipe to `tried`, and its "Who writes what" lets the user write `curated` and `status` on recipes through the app. tech_standards §5 and ADR 003 say the app never edits recipe fields, and no code writes a recipe file today. The user chose that rating a recipe in Por probar or Descartada also moves it to Probada.

Facts of the recipe files: Markdown with a YAML frontmatter; 74 of 77 recipes have no `status` line (absent = `tried`); every writer sets `updated`; recipe bodies are owned by food-manager.

## Options Considered
- **Use what we have: write only `ratings`; never touch recipes.** No standards change, no new file type written. Rejected for 012: a recipe rated in the app would stay Por probar or Descartada and keep being hidden or shown by the Estado filter against the contract, until food-manager reprocesses it.
- **Server derives the status change from the rating operation (recommended).** `review.setRating` is the only new operation; after the reviews file is written, the server also sets `status: tried` (and `updated`) in the rated recipe's frontmatter when its status is `to-try` or `discarded`. One user intent, one operation, nothing new for the client or the outbox.
- **Separate client operation `recipe.setStatus`.** More general (would also serve a future "La probé" button), but it lets the client write arbitrary statuses, grows the write surface beyond what 012 needs, and splits one intent into two outbox entries that can diverge. Deferred until a feature needs it.

## Decision
1. **Operation.** `review.setRating { recipe, value }` with `value` an integer 1–5, or `null` to remove. Rejected (per-op result) if the value is invalid or the recipe id does not exist. Applied in the reviews group of `POST /api/ops`, with the existing `modifiedTime` check and one retry.
2. **Reviews file edit.** Only `ratings[recipe]` and `updated` change. Setting creates or replaces `stars` and sets `date` (`YYYY-MM-DD` in `-05:00`), keeping any existing `comment` and unknown fields of the entry. Removing deletes the whole entry (comment included; `stars` is required by the schema). Unchanged value = `unchanged`, file not rewritten. The edit patches text where the layout allows (as `setFavorite` does) so comments and layout stay byte for byte, else rewrites with the `yaml` document.
3. **Status side effect.** On every applied or unchanged `review.setRating` with a value (not `null`), the server reads the recipe file and, if `status` is `to-try` or `discarded`, rewrites only the frontmatter: `status: tried` and `updated`. A missing or `tried` status leaves the file untouched. Nothing else in the recipe is edited, and the body is never touched. The app never sets `to-try` or `discarded`, and removing a rating never reverts the status.
4. **Order and failure.** Groups run pantry, reviews, then recipe status, then plan. Writes are not atomic across files (ADR 003). If the status write fails after the rating was saved, the operation reports the rating as applied with a warning for the status; the next `setRating` of that recipe (even with the same value) retries the status because step 3 runs on `unchanged` too. The recipe file is rewritten with the same `modifiedTime` check and one retry.
5. **Scope of writes grows by exactly one field.** The app writes the `status` of a recipe only as `tried`, only as a result of a rating. No deletes, no creation.
6. **Snapshot.** Al's `ratings` (stars only) are added to the snapshot's reviews part; the recipe `status` already travels in the snapshot.

## Consequences
- **tech_standards.md §5:** "The app writes only" adds "`status` of a recipe, only to `tried` when it is rated (ADR 004)"; the operations example adds `review.setRating`; "never edits other recipe fields" stays, with that single exception. §4 note: recipe frontmatter edits live in `src/lib/domain` (pure text transform) and are called from `src/lib/drive`.
- **hl_architecture.md:** §4 `lib/drive`/`api/ops` mention recipe frontmatter writes; §8 conflicts notes the non-atomic rating plus status pair and its self-heal; §10 indexes this ADR.
- **Cross-project:** consistent with `food/_system/schema.md` (Who writes what; status section). food-manager keeps ownership of recipe bodies and of `status` values `to-try` and `discarded`.
- **Harder:** the first code that writes a recipe file; needs unit tests for the frontmatter patch (no `status` line, existing line, CRLF, quoted or commented values) against real sample recipes, and for the partial-failure path.
- **Watch:** concurrent edits by food-manager on the same recipe (the `modifiedTime` check and retry cover it); revisit option 3 (`recipe.setStatus`) if a feature needs more status writes.

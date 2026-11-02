# PRD: Recipe Ratings

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; `tech_foundations` re-checked 2026-10-30; §5 updated by ADR 004, 2026-11-02)
> Source feature doc: `012_recipe-ratings.md`
> Master doc referenced: `docs/functional-spec.md` (domains `library`, `recipes`, `profile`, `plan`; screens SCR-library-list, SCR-recipe-detail, SCR-profile, SCR-plan; components CMP-recipe-filters, CMP-favorite-button, CMP-pending-changes, CMP-write-key; flows FLW-toggle-favorite, FLW-filter-recipes, FLW-search-recipes)
> Status: Approved (2026-11-02)
> Branch: `my-food-manager/012-recipe-ratings`; commits start with `[my-food-manager/012]`
> ADR: `architecture/adr/004_recipe-ratings-and-status-writes.md` (Accepted 2026-11-02)

## 1. Summary
Al can give a recipe 1 to 5 stars from its detail, change it or remove it. The rating is shown, without interaction, on the rows of Recetas, the favorites of Perfil and the Plan. A new filter, Rating, narrows the list by stars, and Recetas and the favorites sort by rating from highest to lowest by default. Ratings are Al's own, saved to `reviews/al.yaml` in Drive (also from the device without a connection), and rating a recipe that is Por probar or Descartada makes it Probada.

## 2. Background & Context
- SCR-recipe-detail shows a heart (CMP-favorite-button) and share control but "no rating, comment or curated control". SCR-library-list sorts alphabetically with "no sort", seven filters (Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína, Estado) and a search that applies the filters first (FLW-filter-recipes, FLW-search-recipes).
- Favorites are the working precedent for a write: `review.setFavorite` is applied server-side against `reviews/al.yaml`, shown at once, queued offline, sent with the shared write key, with pending changes shown in CMP-pending-changes (FLW-toggle-favorite, FLW-enter-write-key).
- `reviews/al.yaml` (reviews schema 1) already holds `ratings`: recipe id → `{ stars, comment?, date }`, written by the food-manager skill. The app today keeps ratings untouched on write and does not show them.
- Recipes have a status (feature 011). The food-manager contract says a rating makes a recipe Probada; ADR 004 lets the app write `status: tried` for that.
- Trigger: user request on 2026-11-02; Product Vision §7 backlog #9 (Perfil), ratings part only.

## 3. Goals & Success Metrics
- G1: set, change and remove a rating in at most two taps from the detail.
- G2: the rating of a recipe is visible in every list that shows it, without opening the detail.
- G3: the best recipes come first and can be isolated by stars.
- Metric (manual, on a phone-sized and a desktop viewport, with a library that has rated, unrated and Por probar recipes): rate a recipe, reload, check the list, the filter and the order; do it again offline and check Drive after reconnecting.

## 4. Non-Goals / Out of Scope
- No person picker and no partner ratings; always Al's `reviews/al.yaml`, which the app never creates.
- No comments (shown, written or edited); an existing `comment` and unknown fields are preserved while the rating changes, and are lost only when the rating is removed.
- No half stars, no average, no sort control or sort choice beyond the default order.
- The app writes `status` only to `tried` as a result of a rating; removing a rating does not undo it; no "La probé" button.
- The grouped search results and the Plan recipe picker keep their current order, and the picker shows no rating.
- No change to favorites or to the Plan content.
- No real-time sync; last change wins.

## 5. User Stories & Acceptance Criteria

### US-1: Rate a recipe
**As** Al, **I want** to tap a star in the recipe detail, **so that** my opinion of the recipe is saved.
- AC-1.1: Given a recipe with no rating, when the detail opens, then five grey stars show.
- AC-1.2: Given no rating, when Al taps star 4, then stars 1 to 4 fill at once and the rating is 4.
- AC-1.3: Given a rating of 4, when Al taps star 2, then the rating becomes 2 at once.
- AC-1.4: Given a rating of 4, when Al taps star 4, then the rating is removed and the five stars turn grey.
- AC-1.5: Given a change, when the page is reloaded after it was saved, then the detail and the lists show the saved rating.

### US-2: Rating makes a recipe Probada
**As** Al, **I want** a rated recipe to count as tried, **so that** it appears in my everyday library.
- AC-2.1: Given a Por probar or Descartada recipe, when Al rates it, then its status becomes Probada at once on the device and in Drive after the change is saved.
- AC-2.2: Given a Probada recipe or one with no status, when Al rates it, then its status does not change.
- AC-2.3: Given Al removes a rating, then the status does not change.

### US-3: See the rating in the lists
**As** Al, **I want** to see the rating on each row, **so that** I choose without opening the recipe.
- AC-3.1: Given a rated recipe, when it appears in Recetas, in the favorites of Perfil or in a Plan slot, then its row shows the rating.
- AC-3.2: Given an unrated recipe, then its row shows no rating and no grey stars.
- AC-3.3: Tapping the rating on a row opens the detail like the rest of the row; it never changes the rating.

### US-4: Filter by rating
**As** Al, **I want** to filter by stars, **so that** I see only my best recipes.
- AC-4.1: Given the filter row, then Rating is the eighth filter, after Estado, with options "1+", "2+", "3+", "4+", "5" and "Sin rating", each with the number of recipes it would give with the other active filters.
- AC-4.2: Given "3+", then only recipes rated 3, 4 or 5 show; given "5", only recipes rated 5; given "Sin rating", only unrated recipes.
- AC-4.3: Given no Rating option, then rated and unrated recipes show.
- AC-4.4: Rating combines with the other filters and with the search like any other filter, and the favorites tab has the same filter.
- AC-4.5: Rating does not appear in the Plan picker.

### US-5: Best first
**As** Al, **I want** the list ordered by rating, **so that** the recipes I like most are on top.
- AC-5.1: Given Recetas or the favorites tab with no search applied, then recipes are ordered by stars from 5 to 1, then unrated recipes, and recipes with the same stars (or unrated) alphabetically by title (Spanish collation).
- AC-5.2: Given an applied search, then the groups Recetas, Proteína and Ingredientes keep their current internal order.
- AC-5.3: Given the Plan recipe picker, then its order does not change.

### US-6: Saved to Drive, also offline
**As** Al, **I want** a rating to reach Drive even without a connection, **so that** nothing is lost.
- AC-6.1: Given the device is offline, when Al rates a recipe, then the rating shows at once and the change appears in CMP-pending-changes.
- AC-6.2: Given a pending rating and a connection with the write key stored, then it is sent in order with the other pending changes.
- AC-6.3: Given no key on the device, then the write key dialog (CMP-write-key) opens at the first change, "Ahora no" leaves it pending, as for favorites.
- AC-6.4: Given several rating changes of one recipe while pending, then only the last value is sent; given it returns to the saved value, nothing is sent.

## 6. Functional Requirements
1. FR-1: A recipe's rating is `ratings[<recipe id>].stars` of `reviews/al.yaml`, an integer 1 to 5; a missing entry means no rating. An entry with a value outside 1 to 5 or not an integer is treated as no rating and is preserved in the file.
2. FR-2: The recipe detail shows a rating control of five stars: grey when there is no rating, otherwise filled up to the rating.
3. FR-3: Tapping star N sets the rating to N; tapping the star equal to the current rating removes it.
4. FR-4: A rating change shows at once in the detail and in every list row, and is saved through the operations outbox (FR-12).
5. FR-5: The rating is shown, display only, on rows of Recetas, the favorites of Perfil and the Plan; unrated recipes show nothing.
6. FR-6: Rating is an eighth filter after Estado, one value at a time, with the options in AC-4.1, removable with its "x", combined with the others by "all must match", and cleared by "Limpiar". It starts with no value.
7. FR-7: "N+" matches stars greater than or equal to N; "5" matches 5; "Sin rating" matches recipes with no rating. Option counts take the other active filters into account and ignore the search.
8. FR-8: Recetas and the favorites tab with no search order by stars descending, unrated last, ties by title in Spanish collation; the order is recomputed when ratings change.
9. FR-9: With an applied search, the result groups keep their current order. The Plan picker keeps its current order and shows no rating.
10. FR-10: Rating a recipe whose status is Por probar or Descartada sets its status to Probada on the device at once and, through ADR 004, in Drive.
11. FR-11: Removing a rating, or rating a Probada recipe or one with no status, leaves the status as it is.
12. FR-12: The change is the operation `review.setRating { recipe, value }` (value 1 to 5, or null to remove) in the existing outbox, applied in `POST /api/ops` per ADR 004: it writes only `ratings[recipe]` and `updated` of `reviews/al.yaml`, keeps any `comment` and unknown fields while setting, removes the whole entry on removal, and sets `date` to the day of the change (`-05:00`).
13. FR-13: For a set value, the server also sets `status: tried` and `updated` in the recipe's frontmatter when its status is `to-try` or `discarded`, and edits nothing else in the recipe; sending the same rating again retries that status write.
14. FR-14: Offline, rating changes wait in the outbox with the same pending indicator, write key rules and ordering as favorites. Several changes to one recipe collapse to the last value; one equal to the saved value is not sent.
15. FR-15: A rating for an unknown recipe id is rejected for that operation only.
16. FR-16: The rating on a row is not a control: tapping it opens the recipe like the rest of the row.
17. FR-17: The snapshot's reviews part carries Al's ratings as recipe id → stars, and `SNAPSHOT_SCHEMA_VERSION` goes to 4 only if the stored shape changes.

## 7. Data Model / Schema Changes
- **Drive:** none to the contract. `reviews/al.yaml` already defines `ratings`; recipe `status` already exists (recipes schema 4). The app now writes `ratings` and, under ADR 004, `status: tried`.
- **App schema mirror (`src/lib/schema`):** the reviews schema already parses `ratings` (`stars`, `comment?`, `date?`, unknown fields kept). The snapshot's reviews part adds ratings (FR-17). The write operation list adds `review.setRating`.
- **Device:** the stored library and the outbox hold the new operation; the optimistic status change is applied to the stored copy of the recipe.

## 8. API / Interface Contracts
- `POST /api/ops`: accepts `{ kind: "review.setRating", id, recipe, value }` with `value` an integer 1 to 5 or `null`. Per-operation result `applied`, `unchanged` or `rejected` with `INVALID_OP` (invalid value, unknown recipe). Errors at file level follow the favorites ones (`REVIEWS_MISSING`, `REVIEWS_INVALID`, `CONFLICT`). The write key header and format of errors are unchanged. Group order: pantry, reviews, recipe status, plan; not atomic across files (ADR 003, ADR 004).
- If the status write fails after the rating is saved, the operation reports `applied` with a warning that the status was not updated; the client keeps the operation as done and retries the status the next time that recipe is rated.
- `GET /api/snapshot`: reviews part adds `ratings` (FR-17). No other change.
- Domain: `rating` becomes an eighth `FilterKey` (label "Rating") with the options of AC-4.1, and a pure sort by rating is added to `src/lib/domain`.

## 9. UI/UX Requirements
- **Detail:** the rating control sits with the recipe's title area, near the heart and share controls, on small windows and in the modal and panel. On medium and large windows the rating, the favorite button and the share button share one row when they fit; when they do not, the rating takes one row and the favorite and share buttons take the next. Targets are at least 44 px; stars have accessible names ("1 estrella" to "5 estrellas") and the control announces the current value.
- **Rows (Recetas, favorites, Plan):** a compact display, one filled star with the number (for example "★ 4"), placed so it does not displace the heart or the title. Rows with no rating show nothing.
- **Filter chip:** the eighth chip, after Estado, with the same look, panel, "x" and disabled states as the others; labels "1+", "2+", "3+", "4+", "5" (with a star icon) and "Sin rating".
- **States:** empty, loading and error as today. No results uses "Ninguna receta coincide" with "Quitar filtros". Pending changes show in CMP-pending-changes; the write key dialog is as for favorites.
- **Reorder:** when a rating changes, the list reorders at once; the detail that is open stays open.

## 10. Edge Cases & Error Handling
- A recipe with a rating in Drive that no longer exists: the entry is ignored in the app and left in the file (same rule as favorites).
- `stars` not an integer 1 to 5 in Drive: shown as no rating; the entry is preserved untouched until Al sets a new rating, which replaces it.
- Rating a recipe that has a `comment`: the comment is kept.
- Removing a rating that has a `comment`: the whole entry, comment included, is removed.
- Two devices rate the same recipe: last write wins.
- Rating and status written by food-manager meanwhile: the `modifiedTime` check and the single retry apply; after a second conflict the operation stays pending.
- Rating a Descartada recipe opened from a link, the Plan or the favorites: it becomes Probada; if Estado is "Descartadas" in the list behind, the recipe leaves that list.
- Unrated recipes with filter "Sin rating" and Estado "Probadas": both apply.
- All recipes unrated: the order is alphabetical, as today; the options "1+" to "5" show 0 and are disabled.
- Reviews file missing or invalid: the change stays pending with an error notice, as for favorites; the app never creates the file.
- Offline or Drive unavailable: pending, shown, sent in order later.
- Search with fewer than 3 characters: the list is not grouped and the rating order and Rating filter apply.
- A rating tap while the previous change of that recipe is still being saved: the last tap wins.

## 11. Non-Functional Requirements
- Performance: sorting and filtering 100+ recipes stay instant on the device; the rating control reacts in the same frame as a favorite toggle.
- Offline: every read path works from the stored library; writes go through the outbox (tech_standards §11).
- Accessibility: the stars are operable by keyboard and screen reader, with visible focus; rating information is not carried by colour alone (stars carry the number or a text label).
- Security: the write is protected by the existing write key; the service account scope and the data sensitivity are unchanged.

## 12. Dependencies & Existing System Touchpoints
- **Contract:** `food/_system/schema.md` (reviews 1, recipes 4) and the food-manager skill, which also writes `ratings` and `status`.
- **Library domain:** snapshot builder and parser, snapshot version, stored library, outbox, `POST /api/ops` and the Drive layer (first code that writes a recipe file, ADR 004).
- **Recipes domain:** SCR-recipe-detail, CMP-recipe-filters, FLW-filter-recipes, FLW-search-recipes; **Profile:** SCR-profile favorites; **Plan:** SCR-plan slot rows; **Pantry domain:** CMP-pending-changes and CMP-write-key (reused).
- **Feature 011:** Estado interacts as described in US-2 and Edge Cases; 012 builds on the branch of 011, which is not merged yet.
- **Docs to update at merge:** functional spec (detail, lists, filters, library data rules, writes, glossary), UI kit registry (rating control, rating display, CMP-recipe-filters), Product Vision §7 (#9, ratings part), changelog.
- Technology: nothing outside tech_standards §2; the write scope is covered by ADR 004.

## 13. Assumptions & Open Questions
- Assumption: Al's ratings in Drive are valid for reviews schema 1 (`stars` integer 1 to 5), and existing recipe files have the standard frontmatter.
- Assumption: removing a rating that has a comment drops the comment (confirmed in the feature doc).
- Open: whether comments will be added later in Perfil (separate feature).
- Open: partner ratings and the person picker (Perfil feature).

## 14. Rollout & Testing Considerations
- Order: the reviews contract and the food-manager skill already support the data; the app is the only new writer of recipe `status` (ADR 004). Existing ratings written by the skill appear in the app on the first sync.
- Unit tests (vitest): rating normalization; the Rating filter and its counts; the sort (stars, unrated last, Spanish tie-break); `review.setRating` merge against real sample reviews files (create, change, remove, keep comment, unchanged); the frontmatter patch for `status` (no line, existing line, other statuses untouched) against real sample recipes; partial failure and retry; outbox collapse of repeated ratings; the optimistic status change.
- Manual: the metric in §3, online and offline, on both viewports.
- Gates before merge: lint, type-check, tests; functional spec and changelog committed on the branch.

## 15. Appendix
- **Rating:** Al's 1 to 5 stars for a recipe. **Sin rating:** a recipe with no `ratings` entry.
- Master doc sections used: `library`, `recipes`, `profile`, `plan`, `pantry` (pending changes, write key).
- Related: `009_favorites_prd.md`, `011_recipe-status-filter_prd.md`, ADR 001, ADR 003, ADR 004.

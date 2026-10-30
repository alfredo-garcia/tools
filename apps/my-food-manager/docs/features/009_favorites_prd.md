# PRD: Favorites

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; `tech_foundations` re-checked and approved 2026-10-30)
> Source feature doc: `009_favorites.md`
> Master doc referenced: `docs/functional-spec.md` (domains `library`, `plan`, `navigation`; screens SCR-recipe-list, SCR-recipe-detail, SCR-profile; components CMP-recipe-search, CMP-recipe-filters)
> Status: Approved (2026-10-30)
> Branch: `my-food-manager/009-favorites`; commits start with `[my-food-manager/009]`

## 1. Summary
Adds favorites to the recipe library. Every recipe row in Recetas shows a heart that tells whether the recipe is one of Al's favorites and toggles it with one tap. The recipe detail shows the same heart on its title row (small windows) or a labeled button under the photo (medium and large windows). Perfil replaces its "Próximamente" placeholder with a tab bar holding one tab, "Recetas favoritas", which lists only the favorites in the Recetas row format, with the same search and filters, the heart to remove, and a tap to open the detail. Changes are saved to `reviews/al.yaml` in Drive through the existing write path (operations, offline outbox, shared write key). It is for Al, mostly on the phone.

## 2. Background & Context
- The snapshot already carries the reviews files (`reviews{userId:{updated,favorites[],ratings{}}}`), but the app neither shows nor writes them. `food/_system/schema.md` reviews schema 1: `reviews/<user>.yaml` with `user`, `updated`, `favorites` (list of recipe ids) and `ratings`; every id must exist in `recipes`; only that user changes the file. `reviews/al.yaml` exists today with `favorites: []`, `ratings: {}` and comments that must be preserved.
- tech_standards §5 already lets the app write `reviews/<user>.yaml` through intent operations (example `review.setRating`), with read-modify-write, modified-time check and one retry (ADR 001). The write path exists for pantry and plan (`POST /api/ops`, outbox, write key dialog; features `my-food-manager/007` and `008`). No new library, service or ADR is needed: this feature adds one operation kind to that path.
- Recetas (`/`, SCR-recipe-list) lists recipes as rows (photo, title, category) with search (CMP-recipe-search) and filters (CMP-recipe-filters); a row opens the detail at `/recipes/<id>`, shown full screen on small windows, as a modal on medium and as a side panel on large (feature 004). The detail is also opened over the Plan as a modal (`RecipeDetail` with `overlay`).
- Perfil (`/profile`, SCR-profile) is a placeholder. Vision §7 lists the profile (person, favorites, ratings, comments, curated) as backlog #9; this feature delivers only its favorites part, for Al.
- `ui_kit_registry` already names `FavoriteButton` (`pressed`, `onToggle`, heart fills when pressed, 40-44 px hit area; status Beta, not yet built) and `ui_standards` reserves the lime accent for favorites.
- Trigger: user request on 2026-10-30.

## 3. Goals & Success Metrics
- G1: toggling a favorite takes one tap from the list, the detail or Perfil, and the new state shows in under 100 ms, with or without connection.
- G2: a change made online is in `reviews/al.yaml` within 5 seconds; one made offline, within 5 seconds of the connection returning.
- G3: the favorites tab shows exactly the recipes in Al's `favorites`, found with the same search and filters as Recetas.
- G4: no change is lost across offline periods, reloads or a missing or wrong key, unless it was rejected and reported.
- Metric (manual, real library and Drive): mark three recipes from the list, the detail and Perfil, one of them offline; after sync, `reviews/al.yaml` lists the three, keeps its comments and `ratings`, and a second device shows the same hearts after refresh.

## 4. Non-Goals / Out of Scope
- No person picker and no favorites for the household partner; favorites always belong to Al (`reviews/al.yaml`). The app never creates a reviews file.
- No ratings, comments or "curated" flag, shown or written.
- No heart in the Plan recipe picker, no favorites filter in Recetas, no "favorites" inspiration view, no ordering by favorite.
- No other tab in Perfil and no other Perfil content (person, ratings).
- No change to recipe files, to search or filter behavior in Recetas, or to the detail content besides the heart.
- No real-time sync, no conflict screen; last change wins.

## 5. User Stories & Acceptance Criteria

**US-1 Heart in the recipe list.** As Al, I want to see and change which recipes are favorites from the list.
1. Given the recipe list, then each row shows at its right a heart button: filled (lime accent) when the recipe is a favorite, outline when not, with the accessible name "Quitar de favoritos" or "Añadir a favoritos" and a pressed state.
2. Given I tap the heart, then the state flips at once, the recipe does not open, and the change is saved (US-5).
3. Given a search or filters applied, when I tap a heart, then the row stays in the list and the list does not reorder.
4. Given a long title, then it is truncated to leave the heart's space free.

**US-2 Heart in the detail.** As Al, I want to mark the recipe I am reading.
1. Given a small window (full-screen detail), then the title row shows the name at the left and the heart button at the right; the button's space is taken from the name's width, which wraps to as many lines as it needs.
2. Given a medium or large window (modal or side panel), then no heart appears next to the name; a button under the photo shows the heart and the text "Añadir a favoritos" when it is not a favorite, or "Quitar de favoritos" when it is, filled or outline accordingly.
3. Given I tap the heart or the button, then the state flips at once in the detail and in the list row behind it, and the change is saved.
4. Given I change the window size with the detail open, then the control passes from one placement to the other keeping the current state.

**US-3 Favorites tab in Perfil.** As Al, I want all my favorites in one place.
1. Given `/profile`, then a tab bar shows with a single tab, "Recetas favoritas", selected, replacing "Próximamente".
2. Given the tab, then it shows a search bar and the recipe filters as in Recetas, and below them the favorite recipes as rows in the Recetas format (photo, title, category) in the library's order, with the heart filled at the right.
3. Given a search or filters, then they apply only among the favorites, and counts and options in the filters are computed over the favorites.
4. Given I tap the heart of a row, then it turns outline and the row stays, dimmed, until I leave Perfil or change search or filters; tapping again restores it as a favorite.
5. Given I tap a row, then the recipe detail opens over Perfil (modal on medium and large, full screen on small), with its heart; closing it returns to Perfil with search, filters and scroll as they were.
6. Given there are no favorites, then the tab shows the empty state "Aún no tienes favoritas" with the hint "Toca el corazón de una receta para guardarla aquí." and the action "Ver recetas" (goes to Recetas).
7. Given favorites exist but search or filters match none, then it shows "Ninguna receta coincide" with the same actions as Recetas ("Borrar búsqueda", "Quitar filtros").

**US-4 Offline and sync indicator.** As Al, I want to mark favorites in the kitchen or the store without signal.
1. Given no connection, when I tap a heart, then the state flips at once, the change is stored on the device and the pending indicator shows "N cambios pendientes".
2. Given the connection returns, then changes are sent in order and the indicator disappears when all are saved.
3. Given the app is reloaded with changes pending, then hearts show the pending state and the changes are still sent later.

**US-5 Saving.** As Al, I want every change in Drive.
1. Given a connection and a valid key, when I toggle a heart, then `reviews/al.yaml` ends with the recipe in or out of `favorites`, `updated` is set, and every other field (including `ratings` and comments) is unchanged.
2. Given the same recipe toggled several times while pending, then Drive ends with the last state.
3. Given the server rejects a change as invalid (the recipe does not exist), then the heart returns to its saved state and a notice says "No se pudo guardar <receta>".
4. Given no stored key, then the first toggle applies on screen, stays pending, and the write key dialog opens as in Despensa; a rejected key asks again and changes stay pending.

## 6. Functional Requirements
1. FR-1: A single favorite control (`FavoriteButton`) is reused in the list row, the detail and Perfil, with props `pressed`, `onToggle`, an optional visible `label` and an accessible name that follows the state; hit area at least 44 px.
2. FR-2: A recipe is a favorite when its id is in `favorites` of Al's reviews file (`library.reviews.al`) with the pending favorite operations of the outbox applied on top. Ids that do not match a recipe are ignored on screen.
3. FR-3: The person is fixed to `al`. If `library.reviews.al` is absent, hearts are shown outline and toggling is rejected with the notice "No se pudo guardar <receta>" and no operation is sent.
4. FR-4: Each toggle creates one operation `review.setFavorite` with the recipe id and the new boolean, appended to the device outbox before anything is sent. Unsent operations for the same recipe collapse into the last one; one equal to the stored value is dropped.
5. FR-5: Sending follows the existing outbox rules (when the app opens, on reconnection, right after a change when online, backoff while visible, never discarded until applied, unchanged or rejected as invalid).
6. FR-6: The server applies `review.setFavorite` by reading the latest `reviews/al.yaml`, applying the operations in order and writing the file once; if the file changed in Drive between reading and writing it re-reads and re-applies once, and a second conflict returns an error and writes nothing (tech_standards §5, ADR 001).
7. FR-7: Applying sets the id in or out of `favorites`: on adds it at the end if absent; off removes it if present; no change is reported as unchanged and, when the whole batch changes nothing, the file is not written.
8. FR-8: When the file is written, `updated` is set to the current time with offset `-05:00` and only the `favorites` and `updated` lines change; `ratings`, comments, unknown fields and the layout of the file stay as they were. A file that is not reviews schema 1 or whose `user` is not `al` is refused (`REVIEWS_INVALID`).
9. FR-9: An operation is invalid when its recipe id is not a recipe of the library or its value is not a boolean; the rest of the batch is still applied. The app never mints ids.
10. FR-10: A batch may mix pantry, plan and review operations; they are grouped per file, each written and retried independently and not atomically across files (ADR 003). The success response carries the new reviews so the client refreshes without another request.
11. FR-11: Writes require `x-app-key` as for the other operations; reads stay open.
12. FR-12: List rows in Recetas show the heart as a control separate from the row link: tapping it never opens the recipe, and keyboard focus reaches the link and the heart as two stops.
13. FR-13: In the detail, the control placement depends on the detail mode: title row for the full-screen mode (small windows); under the photo, with its label, for modal and side panel modes. In the modal and panel modes the name is not repeated in the body, so no heart is shown next to it.
14. FR-14: The "Recetas favoritas" tab lists `recipes` whose id is a favorite, in the library's order, using the same row, `SearchInput`, search (CMP-recipe-search) and filter (CMP-recipe-filters) components and rules as Recetas, applied over that subset.
15. FR-15: In the favorites tab, a row whose heart was turned off while shown stays dimmed until search or filters change or the screen is left; its heart shows outline.
16. FR-16: Opening a recipe from Perfil shows the detail over Perfil without changing the address and without showing the Recetas list beside it, as the Plan does (`RecipeDetail` with `overlay` and `onClose`).
17. FR-17: Search text and filters of the favorites tab live in the page and are emptied when leaving Perfil or reloading.
18. FR-18: Pending and rejected state is visible on the screens that toggle hearts, as in Despensa: "N cambios pendientes" indicator and the notice for rejected changes.
19. FR-19: Pure logic (favorite set with pending overlay, favorite subset of recipes, operation merge, outbox collapse) lives in `src/lib/domain` and `src/lib/offline` with unit tests.

## 7. Data Model / Schema Changes
- **Drive data: no schema change.** `reviews/al.yaml` is reviews schema 1. The app writes only `favorites` (id added at the end or removed) and `updated`. It never creates the file, and never touches `ratings`, comments or unknown fields.
- **Client storage:** the outbox gains operations `{ id, kind: "review.setFavorite", recipe, value }`.
- **Snapshot:** unchanged (reviews are already included); the screen overlays the outbox on `library.reviews.al.favorites`.

## 8. API / Interface Contracts
**`POST /api/ops`** (existing). The request operation union gains `{ "id": string, "kind": "review.setFavorite", "recipe": string, "value": boolean }`, within the same 1 to 100 operations per batch.
- Success `200`: as today, with `results[]` for each operation and a new optional field `reviews` (the updated `{ user, updated, favorites }`) when the batch had review operations.
- Errors (format `{ "error": { "code", "message" } }`): the existing codes, plus `404 REVIEWS_MISSING` (no `reviews/al.yaml` in Drive, the app does not create it) and `422 REVIEWS_INVALID` (file not schema 1 or not Al's). A rejected operation uses `INVALID_OP` and does not fail the batch.
- Idempotent: each operation sets a value.

**Client:** the outbox exposes `enqueueFavorite(recipe, value, storedValue)`; a hook returns the favorite set with pending changes applied.

## 9. UI/UX Requirements
- **Heart:** outline in muted text colour when not a favorite; filled with the lime accent (`color.accent.lime`) when it is; never colour alone (fill vs outline plus accessible name and `aria-pressed`). Icon `Heart` from lucide-react.
- **List row (Recetas and Perfil):** heart at the right edge, vertically centered, 44 px target; title truncates before it.
- **Detail, small:** title row = `h1` name (flex, wraps) + heart button (fixed width, top-aligned with the first line).
- **Detail, medium and large:** a full-width button under the photo, with the heart icon and the text "Añadir a favoritos" or "Quitar de favoritos"; same shape language as existing secondary buttons; pressed state uses the lime tint.
- **Perfil:** `TmpSegmentedControl` (kind tabs) with the single tab "Recetas favoritas", then search, filters, list; the title of the screen stays "Perfil".
- **States:** empty favorites, no results, loading ("Cargando tus recetas…"), no library offline (same as Recetas), pending and rejected indicators.
- **Copy (Spanish):** "Añadir a favoritos", "Quitar de favoritos", "Recetas favoritas", "Aún no tienes favoritas", "Toca el corazón de una receta para guardarla aquí.", "Ver recetas", "No se pudo guardar <receta>".
- New or changed kit components to define with ux-designer: `FavoriteButton` (compact and labeled variants), a Perfil tabs bar, and a favorites row.

## 10. Edge Cases & Error Handling
- Recipe deleted in Drive but still in `favorites`: ignored on screen; not removed by the app.
- Toggling the same heart quickly several times: only the last value remains pending.
- The user switches from list to detail and back: hearts agree everywhere.
- Offline with no key: pending until the key is entered; dismissing the key dialog leaves them pending with the "Introducir clave" action.
- Drive unavailable or two conflicts: change stays pending and retries.
- Reviews file missing: toggles are refused with a notice; nothing is queued.
- Detail opened directly by address (`/recipes/<id>`): the heart works the same.
- Detail of a recipe that no longer exists: no heart.
- Window resized across breakpoints with the detail or Perfil open: state is kept.
- Unfavorited row on Perfil when the user opens its detail: the detail shows the current state.

## 11. Non-Functional Requirements
- Performance: toggling renders in under 100 ms; the favorites tab filters 100+ recipes without noticeable delay.
- Accessibility: buttons are labeled and expose `aria-pressed`; targets of at least 44 px; focus is kept on the control after a toggle; state not conveyed by colour alone.
- Security: same write key rules as FR-11; no personal data beyond recipe ids.
- Offline: all read paths work from the stored library; writes go through the outbox.

## 12. Dependencies & Existing System Touchpoints
- Recetas list and filters: SCR-recipe-list, CMP-recipe-search, CMP-recipe-filters (rows gain a heart; no behavior change).
- Recipe detail: SCR-recipe-detail, `DetailLayer` modes (title row vs under-photo placement).
- Perfil: SCR-profile replaced; main navigation unchanged.
- Write path: `POST /api/ops`, outbox, write key dialog, pending indicator (features `my-food-manager/007` and `008`); ADR 001, ADR 003 (per-file grouping).
- Kit: `FavoriteButton` (registry, Beta, to be built), `TmpSegmentedControl`, `SearchInput`, `EmptyState`, `Toast`.
- Blocks nothing; the Perfil person picker, ratings and comments (backlog #9, remaining) build on this tab bar.

## 13. Assumptions & Open Questions
Decided by the user in this session: favorites are Al's only (no picker) and Perfil gets a tab bar with the single tab "Recetas favoritas". Assumptions below fill gaps the request left; all confirmed by the user on 2026-10-30:
- A1: In the favorites tab, an unfavorited row stays dimmed until the view changes (same pattern as the shopping list in Despensa), so an accidental tap can be undone.
- A2: Opening a recipe from Perfil shows the detail over Perfil as a modal on medium and large windows (like the Plan), not with the Recetas list beside it, and closing returns to Perfil.
- A3: "Desktop" in the request means medium and large windows (640 px and above): there the button with text goes under the photo; only small windows put the heart on the title row.
- A4: The favorites tab keeps the library's order (same as Recetas), with no option to sort.
- A5: A change in a heart is not confirmed with a toast; the heart itself is the feedback (rejections do show a notice).
- A6: The pending-changes indicator and the key dialog are shown on Recetas, the detail and Perfil, as in Despensa.
- Open: none blocking.

## 14. Rollout & Testing Considerations
- No flag or migration. Merge to `main` deploys; `reviews/al.yaml` already exists.
- Unit tests: favorite set with pending overlay; favorite subset and its use with search and filters; `review.setFavorite` application (add, remove, unchanged, invalid recipe, missing file, preservation of `ratings`, comments and `updated`); outbox collapse and replay; ops request schema.
- Manual: list, detail (small, medium, large), Perfil tab; offline toggle then reconnect; wrong and missing write key; check `reviews/al.yaml` in Drive afterwards.

## 15. Appendix
- Glossary: favorite = a recipe id in `favorites` of the user's reviews file; pending overlay = outbox operations applied over the stored data.
- References: `food/_system/schema.md` (reviews), `docs/functional-spec.md` (SCR-recipe-list, SCR-recipe-detail, SCR-profile, CMP-recipe-search, CMP-recipe-filters), tech_standards §5 and §6, ADR 001 and 003.

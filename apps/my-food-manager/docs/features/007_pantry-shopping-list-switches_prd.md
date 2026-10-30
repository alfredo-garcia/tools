# PRD: Pantry and Shopping List Switches

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28; `tech_foundations` is "review needed" and waived for this PRD on 2026-10-29, see `SDLC.md`: this PRD is provisional until tech-lead re-checks)
> Source feature doc: `007_pantry-shopping-list-switches.md`
> Master doc referenced: `docs/functional-spec.md` (domains `library`, `navigation`; screen SCR-ingredients)
> Status: Approved (2026-10-30), provisional until tech-lead re-checks `tech_foundations`
> Branch: `my-food-manager/007-pantry-shopping-list-switches`; commits start with `[my-food-manager/007]`

## 1. Summary
Replaces the "Próximamente" placeholder of Despensa (`/ingredients`) with two tabs, "Despensa" and "Lista de compra". Every ingredient of the catalog has two independent switches, "Tengo" (is it at home) and "Comprar" (must it be bought). The tabs share a search bar and a family filter; the Despensa tab adds a "Tengo / No tengo / Todos" filter. Switches apply on screen at once and are saved to the pantry file in Drive through the first write path of the app: intent operations, an offline outbox, and a shared write key. It is for Al and his household partner, at home and at the store.

## 2. Background & Context
- SCR-ingredients is a placeholder (functional spec, domain `navigation`). The main navigation (feature `my-food-manager/006`) already routes Despensa to `/ingredients`.
- The snapshot already carries the ingredient catalog (`name`, `synonyms`, `family`, `staple`), the family vocabulary (labels) and the pantry (`have`, `to_buy`), so the read side needs no new data (`src/lib/schema`, `src/lib/domain/snapshot.ts`).
- The app is read-only today: the Drive client requests `drive.readonly`, the `food` folder is shared with the service account as Viewer, and there is no `/api/ops` nor outbox. The architecture for writing is already decided: tech_standards §5 and §9, ADR 001 (operations with an outbox, server-side merge) and ADR 002 (service account with Editor access).
- Search and family filtering reuse the behavior of the recipe list (functional spec: CMP-recipe-search, CMP-recipe-filters).
- `food/_system/schema.md`: pantry schema 1 is `updated`, `have`, `to_buy` (ingredient ids); staples are always available; no quantities. The food-manager skill, Claude and Telegram also write this file.
- Trigger: vision v2 stage 2, backlog #7, with the "to buy" view of #8 (the plan-driven generation stays out).

## 3. Goals & Success Metrics
- G1: switching "Tengo" or "Comprar" takes one tap and shows the new state in under 100 ms, with or without connection.
- G2: a change made online is in `pantry/pantry.yaml` in Drive within 5 seconds; a change made offline is there within 5 seconds of the connection returning.
- G3: an ingredient is found by 3 letters or by its family, and its state is readable at a glance.
- G4: no change is lost: after any sequence of online/offline periods, reloads and a missing or wrong key, every switch the user flipped ends up in Drive, unless it was rejected and reported.
- Metric (manual, real library and real Drive): toggle ingredients on two devices, one of them offline; after both sync, Drive and both screens agree, and the pantry file keeps its other contents.

## 4. Non-Goals / Out of Scope
- Anything but `have` and `to_buy` of the pantry is not written (no recipes, reviews, catalog, other files). The app never creates or deletes Drive files.
- No quantities, units, notes, expiry dates.
- No creating or editing ingredients; no ingredient detail screen.
- The switches do not affect each other (no "bought moves to have").
- The list is not generated from the plan or recipes (backlog #8); no "can cook now".
- No real-time sync, no conflict screen, no per-user pantry (the pantry is shared by the household).
- No bulk actions, no sort options, no multi-family filter, no grouping headings by family.
- No change to the recipe list, filters, search or detail.
- No write-key management screen (rotate, show, share): the key is entered, replaced when rejected, and nothing else.

## 5. User Stories & Acceptance Criteria

**US-1 Tabs.** As Al, I want to move between what I have and what I must buy.
1. Given `/ingredients`, then a tab selector shows at the top with "Despensa" and "Lista de compra"; "Despensa" is selected when the screen opens.
2. Given ingredients are marked "Comprar", then the "Lista de compra" tab shows their count (e.g. "Lista de compra · 2"); with none, no count.
3. Given I switch tab, then search text and filters of each tab are kept while the screen stays open, and are emptied when I leave the section or reload.

**US-2 Search.** As Al, I want to find an ingredient by a few letters in both tabs.
1. Given either tab, then a search bar shows under the tabs with the placeholder "Buscar ingrediente" and a clear "x" when there is text.
2. Given fewer than 3 characters after trimming, then nothing is filtered and no message appears.
3. Given 3 or more characters, when 1 second passes without typing (or Enter is pressed), then the list shows only ingredients whose name or synonym contains the text, ignoring case and accents; with several words, all must be found in the same name or synonym.
4. Given text in the bar, when I tap "x" or press Esc, then the text is erased at once, results go away, and focus returns to the bar.
5. Given an applied search in the Despensa tab, then the "Tengo / No tengo / Todos" filter is not applied to it and results show whatever the state; the family filter still applies.

**US-3 Family filter.** As Al, I want to narrow by type of ingredient.
1. Given either tab, then a "Familia" filter shows under the search bar and works like a recipe filter: one family at a time, chip with "x" once chosen.
2. Given the filter is open, then options are the families present among the ingredients that the tab and its other filters would show, in vocabulary order (families missing from the vocabulary last, alphabetically), each with its count; an option with 0 is disabled and the chosen one never is.
3. Given an ingredient with no family, then it belongs to "Otros".

**US-4 Despensa tab.** As Al, I want to see and change what I have and what I need.
1. Given the tab, then a "Tengo / No tengo / Todos" filter shows with "Tengo" selected, and the list shows the ingredients in the pantry's `have` (plus staples, see FR-9).
2. Given "No tengo" is selected, then the list shows the catalog ingredients that are not at home; with "Todos", the whole catalog.
3. Given a row, then it shows the ingredient name and two labeled switches, "Tengo" and "Comprar", each reflecting `have` and `to_buy`.
4. Given I turn "Tengo" on or off, then the switch changes at once and the row stays in the list until I change filter or search (it does not jump out of the list).
5. Given I turn "Comprar" on or off, then only that switch changes; "Tengo" is untouched, and vice versa.
6. Given a staple ingredient, then its "Tengo" switch is on and locked (cannot be turned off) with the hint "Básico, siempre disponible"; its "Comprar" switch works as any other.

**US-5 Lista de compra tab.** As Al, I want the list I carry to the store.
1. Given the tab, then it lists the ingredients with "Comprar" on, each with its name and a "Comprar" switch, and the family filter (no state filter).
2. Given I turn "Comprar" off, then the row stays, struck through and dimmed, with the switch off, until I leave the tab or reload; turning it on again restores it.
3. Given the list is empty, then it shows "Tu lista está vacía" with the hint "Activa Comprar en un ingrediente de Despensa." and the action "Ir a Despensa".

**US-6 Saving.** As Al, I want every switch saved to Drive, even offline.
1. Given a connection and a valid key, when I flip a switch, then the screen changes at once and the change is written to Drive; the other fields of the file are unchanged.
2. Given no connection, when I flip a switch, then the screen changes at once, the change is stored on the device, and an indicator shows "N cambios pendientes".
3. Given pending changes and the connection returns, then they are sent in the order they were made and the indicator disappears when all are saved.
4. Given the same ingredient and switch flipped several times while pending, then Drive ends with the last value.
5. Given the app is closed or reloaded with changes pending, then they are still shown and still sent later.
6. Given the server rejects a change as invalid, then that change is discarded, the switch returns to the saved value, and a notice says "No se pudo guardar <ingrediente>".
7. Given Drive is unavailable or the write conflicts twice, then the change stays pending and is retried; the user keeps working.

**US-7 Write key.** As the household, I want writing protected without logins.
1. Given a device with no stored key, when I flip a switch, then the change applies on screen and is kept pending, and a dialog asks for the "Clave de escritura".
2. Given I enter a key, then it is stored on the device, the pending changes are sent, and I am not asked again.
3. Given the server rejects the key, then changes stay pending and the dialog asks for the key again with the message "La clave no es correcta".
4. Given I dismiss the dialog, then changes stay pending and the indicator offers "Introducir clave".

**US-8 Offline reading.** As Al, I want the screens to work in the store.
1. Given no connection, then both tabs, search and filters work from the stored library, and the state shown includes pending changes.

## 6. Functional Requirements
1. FR-1: `/ingredients` shows the screen of this PRD in place of the placeholder; address and navigation entry are unchanged.
2. FR-2: The screen state (tab, applied search text, filters) lives in the page; nothing about it is persisted or placed in the address.
3. FR-3: Search applies like CMP-recipe-search: 3 or more trimmed characters, 1000 ms after the last keystroke, Enter applies at once, Esc and "x" clear it; normalization lowercases and removes accents ("ñ" stays distinct).
4. FR-4: Search matches the ingredient `name` and each of its `synonyms`; with several words, all must be found in the same name or the same synonym.
5. FR-5: The family filter has one value at a time; ingredients without `family` belong to "Otros"; labels come from the family vocabulary (`label`), or the id capitalized when missing.
6. FR-6: Displayed state of an ingredient = the stored pantry with the pending changes of the outbox applied on top.
7. FR-7: "Tengo" means the id is in `have`; "Comprar" means the id is in `to_buy`; the two are independent. An id may be in both or in neither.
8. FR-8: Despensa tab list = catalog ingredients filtered by the state filter ("Tengo": has "Tengo" on; "No tengo": not; "Todos": all), the family filter and, when a search is applied, the search instead of the state filter (US-2.5). A row whose state changed while visible stays until a filter, search or tab changes.
9. FR-9: Staples (`staple: true`) count as "Tengo" on and are never added to or removed from `have` by the app; their "Tengo" switch is locked on.
10. FR-10: Lista de compra tab list = catalog ingredients with "Comprar" on, filtered by the family filter and the search; an ingredient turned off while visible stays struck through until the tab is left or the screen reloads.
11. FR-11: The tab count = number of catalog ingredients with "Comprar" on, counting pending changes.
12. FR-12: Every list is ordered alphabetically by ingredient name (Spanish collation).
13. FR-13: Every switch change creates one operation, `pantry.setHave` or `pantry.setBuy`, with the ingredient id and the new boolean value, and appends it to the device outbox before anything is sent.
14. FR-14: The outbox is persisted on the device (surviving reloads) and keeps the order of operations. Operations for the same ingredient and kind that are still unsent are collapsed to the last one.
15. FR-15: The outbox is sent when the app opens, when the connection returns, right after a change (when online) and after every failed attempt with increasing waits (2 s, 5 s, 15 s, 60 s, then every 60 s) while the app is visible.
16. FR-16: Sending an operation never discards it until the server says it was applied, was already the stored value, or was rejected as invalid.
17. FR-17: After a batch is saved, the library is refreshed so the stored pantry matches Drive.
18. FR-18: The server applies a batch by reading the latest `pantry/pantry.yaml`, applying each operation in order, and writing the file once; if the file changed in Drive between reading and writing (modified-time check) it re-reads and re-applies once; a second conflict returns an error and nothing is written (tech_standards §5).
19. FR-19: Applying an operation sets the id in or out of the list: on adds it at the end if absent; off removes it if present. An operation that changes nothing is reported as already applied. If a whole batch changes nothing, the file is not written.
20. FR-20: When the file is written, `updated` is set to the current time, ISO 8601 with offset `-05:00` (tech_standards §5); every other field and the order of the remaining ids are preserved, including fields the app does not know.
21. FR-21: An operation is invalid when its ingredient id is not in the catalog (the app never mints ids), when its kind is unknown, or when its value is not a boolean; the rest of the batch is still applied.
22. FR-22: Writes require the header `x-app-key` equal to `APP_WRITE_KEY`; a missing or wrong key returns 401 and writes nothing; if `APP_WRITE_KEY` is not configured the server returns a configuration error and writes nothing. Reads stay open.
23. FR-23: The write key is never sent to the client except as typed by the user, never logged, and never part of the snapshot.
24. FR-24: The Drive client requests write access (`drive` scope, on the service account, which only sees the shared `food` folder) and only updates the existing pantry file; it never creates or deletes files.
25. FR-25: Pending and failed state is visible on the screen: "N cambios pendientes" while any are unsent, and a notice for each rejected change.
26. FR-26: All pure logic (list building, filters, search, operation merge, outbox collapse and replay order) is in `src/lib/domain` and `src/lib/offline` with unit tests; Drive and route handlers are thin.

## 7. Data Model / Schema Changes
- **Drive data: no schema change.** `pantry/pantry.yaml` keeps schema 1 (`updated`, `have`, `to_buy`). The app now writes `have`, `to_buy` and `updated` of this file (tech_standards §5 already lists the pantry as writable).
- **Client storage (new):** the outbox in the IndexedDB store of the offline cache (`idb-keyval`): an ordered list of operations `{ id, kind: "pantry.setHave" | "pantry.setBuy", ingredient, value, at }`, where `id` identifies the operation and `at` is the ISO time it was made.
- **Device preference (new):** the write key, stored in the browser's local storage on the device only (see §13).
- **Snapshot:** unchanged. The stored pantry is replaced by each sync as before; the screen overlays the outbox on it (FR-6).

## 8. API / Interface Contracts
**`POST /api/ops`** (route handler, Node runtime, `src/app/api/ops`)
- Headers: `x-app-key` (required), `Content-Type: application/json`.
- Body (zod-validated): `{ "ops": [ { "id": string, "kind": "pantry.setHave" | "pantry.setBuy", "ingredient": string, "value": boolean } ] }`, 1 to 100 operations.
- A batch holds 1 to 100 operations; the success body carries the new pantry so the client can refresh without another request.
- Success `200`: `{ "results": [ { "id": string, "status": "applied" | "unchanged" | "rejected", "error"?: { "code": string, "message": string } } ], "pantry": { "updated": string, "have": string[], "to_buy": string[] } }`. A rejected operation (code `INVALID_OP`) does not fail the batch.
- Errors (tech_standards §6 format `{ "error": { "code", "message" } }`):
  - `400 INVALID_BODY`: body fails validation.
  - `401 UNAUTHORIZED`: missing or wrong `x-app-key`.
  - `409 CONFLICT`: the file changed again after the one retry; nothing was written.
  - `403 DRIVE_FORBIDDEN`: the folder is not shared with write access.
  - `502 DRIVE_UNAVAILABLE`: Drive failed or rate limited.
  - `404 PANTRY_MISSING`: `pantry/pantry.yaml` does not exist (the app never creates it).
  - `500 CONFIG_MISSING`: `APP_WRITE_KEY` or the Drive configuration is missing.
- Idempotent: every operation sets a value, so sending a batch twice leaves the same result.

**Drive source (internal):** the `FoodSource` interface gains an operation that replaces the text of an existing file and fails with a conflict if the file's modified time is not the one expected; the Drive implementation and the local development one (`LOCAL_FOOD_DIR`, writes the mirror file) both provide it.

**Client:** the outbox module exposes: enqueue an operation, read the pending list, flush now, and subscribe to changes (pending count, key needed, rejected notices). The screen reads the library plus pending operations through one hook.

## 9. UI/UX Requirements
- **Screen** SCR-ingredients (replaces the placeholder), inside the existing frame (CMP-app-frame, main navigation, title "Despensa"). Top to bottom: tab selector; search bar; "Familia" filter; on Despensa tab, the "Tengo / No tengo / Todos" filter; pending indicator when needed; list.
- **Row:** ingredient name at the left; at the right the switches. Despensa tab: two switches, each with its label under it ("Tengo", "Comprar"), at least 44 px touch target. Lista tab: one "Comprar" switch.
- **Switch colors:** "Tengo" on in the success tone, "Comprar" on in the accent tone; off is neutral. State is never conveyed by color alone (position of the knob and the label).
- **Locked staple:** "Tengo" on, disabled-looking but readable, with the hint "Básico, siempre disponible" under the name.
- **Struck-through row (Lista tab):** name struck and dimmed, switch off.
- **Reused kit components:** `SearchInput`, `FilterChip`, `FilterOptions`, `EmptyState`, `Toast`, `Dialog`/`Sheet` (for the key). **New kit components to define with ux-designer:** `Switch` and `SegmentedControl` (used for the tabs and the state filter), plus a pending-changes indicator.
- **Copy (Spanish):** tabs "Despensa" and "Lista de compra"; placeholder "Buscar ingrediente"; filter names "Familia" and options "Tengo", "No tengo", "Todos"; "N cambios pendientes"; key dialog title "Clave de escritura", helper "La necesitas una vez por dispositivo para guardar cambios.", error "La clave no es correcta", button "Guardar clave"; notice "No se pudo guardar <ingrediente>"; empty list as in US-5.3.
- **States:**
  - Loading / no library / error: same as the recipe list (`EmptyState` with "Reintentar").
  - Despensa empty for the current filters: "Ningún ingrediente coincide" with "Quitar filtros" and, if there is an applied search, "Borrar búsqueda".
  - Lista empty: US-5.3. Lista empty with search or filter active: "Ningún ingrediente coincide" as above.
  - Pending: "N cambios pendientes" indicator; with no key, it offers "Introducir clave".
  - Offline: works as online; the sync badge pattern of the app already shows the connection state.
- **Accessibility:** switches use `role="switch"` with `aria-checked` and an accessible name "<Label> <ingrediente>"; the tab selector uses `role="tablist"`; keyboard operable; visible focus; the pending count is announced politely.
- Mobile-first; on medium and large windows the list stays a single column of readable width.

## 10. Edge Cases & Error Handling
- An id in `have` or `to_buy` that is not in the catalog: kept in the file untouched, not shown, and not counted.
- The same id in both `have` and `to_buy`: allowed; the row shows both switches on.
- Duplicated ids already in the file: the app treats them as one; when it writes, it keeps one occurrence.
- `pantry.yaml` missing or invalid in the snapshot: the screen shows both tabs empty with the standard empty states; writes return `PANTRY_MISSING` and stay pending (never created by the app).
- The pantry file changed in Drive by the food-manager skill, Claude or Telegram between the app's read and write: handled by FR-18; changes by others are preserved because the merge applies only the app's operations.
- Two devices flip the same switch while offline: both operations are applied in the order they reach the server; the last one wins (no conflict screen).
- Operations pending and a sync arrives: the screen keeps showing the stored state with the pending operations on top (FR-6); it never flickers to the old value.
- The same switch flipped on and off while pending: collapses to the last value; if it equals the stored value, Drive is not written (FR-19).
- Closing the dialog of the key, or entering a wrong key, never discards changes.
- An ingredient removed from the catalog while its operation is pending: the operation is rejected as invalid; notice shown.
- Browser cannot store data (private mode): switches work in memory and are sent while the app stays open; the existing notice says that pending changes would be lost if the app closes.
- Very rapid taps on the same switch: each is an operation, collapsed by FR-14.
- Batch larger than 100 operations: the client sends it in several batches in order.
- Tab hidden or app closed during sending: unsent operations stay in the outbox; a batch already received by the server is idempotent when resent.
- Search of only spaces or fewer than 3 characters: nothing is filtered, as in the recipe search.

## 11. Non-Functional Requirements
- Performance: a catalog of up to 500 ingredients renders and filters under 100 ms; switch feedback within 100 ms; one batch to Drive within 5 seconds in normal conditions (one file read and one file write).
- Offline: required for reading and for switching (vision §10); the outbox is the mechanism.
- Security: writes need `x-app-key`; the key is compared without leaking timing differences; the service account sees only the `food` folder; no secret in the client bundle, logs or snapshot (tech_standards §9). Data sensitivity is low.
- Accessibility: WCAG AA, 44 px targets, state not by color alone (ui_standards §8).
- Scale: 2 users; no rate limiting beyond Drive's own.
- Reliability: no lost updates for a household of 2 in normal use; Drive's modified-time check is not atomic (hl_architecture §11), accepted.

## 12. Dependencies & Existing System Touchpoints
- Replaces SCR-ingredients (domain `navigation`); `Nav` and `AppFrame` unchanged.
- Reads the snapshot (domain `library`): ingredient catalog, family vocabulary, pantry. Adds the first write path; touches `src/lib/drive` (write support, write scope), `src/lib/offline` (outbox), a new `src/app/api/ops`, and `src/lib/schema` (operation schemas).
- Reuses CMP-recipe-search behavior (`SearchInput`, `use-search-query`) and the filter components (`FilterChip`, `FilterOptions`) of features `my-food-manager/005` and `003`.
- Uses the library sync of feature `my-food-manager/001` (refresh after saving).
- Services: Google Drive API (service account with Editor access, ADR 002), Vercel env var `APP_WRITE_KEY` (tech_standards §9).
- **One-time setup by the user:** share the `food` folder with the service account as Editor (README currently says Viewer); create `APP_WRITE_KEY` in `.env.local` and in Vercel; the README is updated with these steps. Until done, the app keeps working read-only and changes stay pending.
- Blocks nothing; is a base for later writes (reviews, plan) through the same `/api/ops` and outbox.
- Contract with `food/_system/schema.md`: no change; the food-manager skill keeps writing the same file and is not affected by this PRD.

## 13. Assumptions & Open Questions
Decisions confirmed by the user on 2026-10-30: staples are listed with "Tengo" locked on; search ignores the state filter and also matches synonyms; "Todos" is offered besides "Tengo" and "No tengo"; each switch carries its own label; the outbox collapses repeated changes and retries with increasing waits; ids unknown to the catalog are kept in the file and hidden. Open for later:
- The household key is stored on the device in plain browser storage; acceptable for personal data (tech_standards §9), revisit if the app is ever shared beyond the household.
- Whether "bought" should one day move an ingredient from "Comprar" to "Tengo" (backlog #8).
- Deviation from tech_standards §9, which says the key is entered at first launch: this feature asks for it at the first change, so a household member who only reads is never asked. Confirmed by the user; tech-lead should reflect it in the standards when it re-checks `tech_foundations`.

## 14. Rollout & Testing Considerations
- Order of work, same branch: (1) write path: Drive write support and scope, `/api/ops`, operation merge, key check; (2) outbox: persistence, collapse, replay and retries; (3) screen.
- Unit tests required (tech_standards §8): operation merge against sample `pantry.yaml` files (adding, removing, unchanged, unknown id, duplicates, preserved comments and unknown fields, `updated` format), the outbox (collapse, order, replay after failure, idempotence), list building (state filter, search, family filter, staples, tab count), search normalization.
- Route tests with a fake `FoodSource`: 401 without key, 400 on bad body, 409 after a second conflict.
- Manual: toggle online, toggle offline then reconnect, two devices, wrong key, key dialog dismissed, food-manager skill editing the file meanwhile, on a phone-sized viewport and on desktop.
- No feature flag: the screen replaces the placeholder. Production needs the setup of §12 before the switches can save.

## 15. Appendix
- **Tengo / Comprar:** the two switches of an ingredient; "Tengo" = in `have`, "Comprar" = in `to_buy`.
- **Outbox:** the ordered list of changes made on the device and not yet confirmed by the server (ADR 001).
- **Staple:** an ingredient flagged `staple: true` in the catalog, assumed always available.
- **Family:** the ingredient class (`family` in the catalog, labels in `families.yaml`), shown as the "Familia" filter.
- References: functional spec domains `library` (SCR-library-list, snapshot) and `navigation` (SCR-ingredients), CMP-recipe-search, CMP-recipe-filters; tech_standards §5, §6, §9; ADR 001, ADR 002; `food/_system/schema.md` (pantry schema 1).

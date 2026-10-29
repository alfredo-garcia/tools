# PRD: Drive Sync & Offline Library

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28)
> Source feature doc: `001_drive-sync-offline-library.md`
> Master doc referenced: none yet (no functional spec exists; this is the first feature)
> Status: Approved (2026-10-28)
> Branch: `my-food-manager/001-drive-sync-offline-library`; commits start with `[my-food-manager/001]`

## 1. Summary
Creates the app's data path. A server-side gateway reads the Drive `food` folder and serves one normalized library snapshot. The browser stores that snapshot on the device, shows it instantly and offline, and refreshes it in the background. Installable PWA shell included. Read-only. For Al and his partner, who need the library in the supermarket without signal.

## 2. Background & Context
- Nothing exists yet. Source data is the Drive folder `food`, governed by `food/_system/schema.md` (recipes schema 3, ingredients 1, pantry 1, reviews 1, vocabularies in `_system` folders).
- Architecture: Drive gateway (`api/snapshot`, `api/photo`), IndexedDB snapshot cache, service worker (hl_architecture §2, §4; ADR 002). ADR 001's outbox is **not** part of this feature.
- Why first: every other backlog item reads the library.

## 3. Goals & Success Metrics
- G1: the full library is readable offline after one successful sync.
- G2: new/changed Drive files appear in the app within the refresh interval while the app is open, and on next open otherwise.
- Metrics (all checked manually on the real library): airplane-mode launch shows all synced recipes; cached launch renders the list in under 1 s; a recipe added in Drive shows up within 6 minutes with the app open.

## 4. Non-Goals / Out of Scope
- Any write to Drive, write key, change queue (ADR 001 outbox) or conflict handling.
- Browse grid, filters, search, recipe detail view (backlog #2, #3).
- Pantry, reviews or picks UI; they are only carried in the snapshot.
- Downloading all photos, resizing or transforming images.
- Database, extra backend, real-time sync, push notifications, background sync while the app is closed.
- Person picker UI (backlog #9).

## 5. User Stories & Acceptance Criteria

**US-1 First load.** As Al on a new device, I want the library to load on first open without any setup, so that I can start using the app immediately.
1. Given no stored library and a connection, when I open the app, then a loading state with progress is shown and, on success, the library is stored and shown.
2. Given no stored library and no connection, when I open the app, then an empty state says a first connection is needed and offers a retry action.
3. Given the first sync is taking place, then no key or login prompt appears.

**US-2 Instant and offline.** As Al in the supermarket, I want the library to show instantly even with no signal.
1. Given a stored library, when I open the app online or offline, then the recipe list renders from the stored copy within 1 s, before any network response.
2. Given airplane mode, when I open the app (including after closing and reopening it), then the app shell loads and the stored library is shown with an offline badge.
3. Given a stored library and a failing Drive request, then the stored library stays visible and a non-blocking error status is shown.

**US-3 Stay fresh.** As Al, I want new recipes added through Claude or Telegram to appear on their own.
1. Given the app is open and visible, when the refresh interval elapses, then a background sync runs and the list updates in place without losing scroll position.
2. Given I open the app, then a background sync starts immediately after the stored copy renders.
3. Given I pull to refresh (mobile) or press the refresh button (desktop), then a sync runs now and its result is shown.
4. Given a sync finds no changes in Drive, then the stored data is untouched and only "last synced" updates.
5. Given the app is hidden or offline, then no periodic sync request is made.

**US-4 Know the state.** As Al, I want to see how fresh my data is.
1. Given any screen, then the header shows one of: syncing, synced with time ("hace 3 min"), offline, or sync error.
2. Given the connection returns after being offline, then a sync runs within 5 s.

**US-5 Photos offline.** As Al, I want photos I have seen to still show offline.
1. Given a recipe photo was displayed online once, when offline, then it displays from the device.
2. Given a recipe without photo or an unseen photo while offline, then the category fallback tile shows, with no broken image.

**US-6 Install.** As Al, I want to add the app to my home screen.
1. Given the app is open on a supported browser, then it is installable and opens standalone with the app name and icon.
2. Given it is installed, when launched offline, then the app shell and stored library load.

## 6. Functional Requirements
1. FR-1: `GET /api/snapshot` returns the normalized library (§8) built from the Drive folder.
2. FR-2: The snapshot includes recipes (all fields of schema 3 plus body sections Steps, Notes, Variations), the ingredient catalog, pantry, every reviews file, and vocabularies (categories, tags, units, families).
3. FR-3: The endpoint supports conditional requests: it returns `304` without reading file contents when no relevant Drive file changed (ETag derived from file ids and modified times).
4. FR-4: The server never writes to Drive in this feature.
5. FR-5: A recipe that fails parsing or lacks `id`/`title` is excluded from the snapshot and listed in `warnings`; it never fails the whole snapshot. Unknown fields are preserved.
6. FR-6: `GET /api/photo/[recipeId]` streams the recipe's photo from Drive with long-lived cache headers; 404 if the recipe has no photo.
7. FR-7: The client stores the latest snapshot and its ETag in IndexedDB and renders from it first.
8. FR-8: A stored snapshot with a different `schemaVersion` than the app expects is discarded and refetched.
9. FR-9: Sync triggers: app open, every 5 minutes while the page is visible and online, pull-to-refresh/refresh button, and regaining connectivity.
10. FR-10: Concurrent triggers share one in-flight sync.
11. FR-11: A successful sync replaces the stored snapshot atomically; a failed one leaves it untouched.
12. FR-12: The service worker precaches the app shell and serves it offline, and caches `/api/photo/*` responses as they are viewed (cache-first). Photo cache capped at 200 entries, oldest evicted.
13. FR-13: The web app manifest provides name "My Food Manager", standalone display, theme colors from ui_standards, and a simple generated placeholder icon set (192/512 px).
14. FR-14: A sync status indicator (`SyncBadge`) is visible in the app header at all times; the offline state also announces via a polite live region.
15. FR-15: A minimal proof screen at `/` lists recipe titles (alphabetical) with their category, count and the sync status; no filters or search.
16. FR-16: The list of household people is derived from the reviews files present (one per file, display name from the `user` field capitalized).

## 7. Data Model / Schema Changes
No Drive schema changes. Client-side only:
- IndexedDB key `snapshot` → `{ schemaVersion, etag, syncedAt, data }`.
- Service worker caches: app shell, photos.

Normalized snapshot (client contract, mirrors Drive schema; zod schemas in `lib/schema`):
- `recipes[]`: `id`, `title`, `category`, `tags{family:[id]}`, `servings`, `time{prep,cook,rest}`, `difficulty`, `ingredients[{ing,qty,unit,note,group,optional,recipe}]`, `source`, `photo` (boolean), `curated`, `missing[]`, `doubts`, `updated`, `steps[]`, `notes`, `variations`.
- `ingredients{id:{name,synonyms,family,staple}}`, `pantry{updated,have[],to_buy[]}`, `reviews{userId:{updated,favorites[],ratings{}}}`, `vocab{categories,tags,units,families}`, `people[{id,name}]`.

## 8. API / Interface Contracts
- `GET /api/snapshot`
  - Request header: optional `If-None-Match: <etag>`.
  - 200: `{ schemaVersion: 1, etag, generatedAt, data: {…as §7…}, warnings: [{file, message}] }`, header `ETag`.
  - 304: no body.
  - Errors (tech_standards §6 format): `503 DRIVE_UNAVAILABLE` (Drive error or quota), `500 CONFIG_MISSING` (env vars absent), `502 DRIVE_FORBIDDEN` (folder not shared with the service account).
- `GET /api/photo/[recipeId]`: 200 image bytes with `Cache-Control: public, max-age=31536000, immutable` keyed by the Drive file's version in the URL query `?v=<modifiedTime>`; 404 `NO_PHOTO`; same 503 on Drive failure.
- Client sync module contract: `sync(reason: "open" | "interval" | "manual" | "online") → Promise<"updated" | "unchanged" | "failed">`; exposes state `{ status: "idle" | "syncing" | "offline" | "error", syncedAt?: string }`.

## 9. UI/UX Requirements
Surfaces: header `SyncBadge`, proof list screen, pull-to-refresh / refresh button, first-load and empty states. Use ui_standards tokens and registry components `AppShell`, `SyncBadge`, `EmptyState`, `Toast`, `Button`.
- **Loading (first sync):** `EmptyState`-style screen with spinner and "Cargando tus recetas…".
- **Empty, offline, no data:** "Necesitas conexión la primera vez" + `Button` "Reintentar".
- **Synced:** badge "Sincronizado · hace N min".
- **Offline:** warning-toned badge "Sin conexión" with the stored data visible.
- **Error:** warning-toned badge "No se pudo sincronizar" with a retry action; `Toast` on manual refresh failure.
- **Edge:** stored library exists but empty (no recipes) shows `EmptyState` "No hay recetas todavía".
- Desktop uses a refresh button in place of pull-to-refresh. Copy in Spanish.

## 10. Edge Cases & Error Handling
- First open offline with no cache: empty state per §9.
- Drive folder not shared / wrong id / revoked credential: snapshot returns the matching error; client keeps showing any stored data and surfaces the error status.
- Service account env vars missing or malformed JSON: `CONFIG_MISSING`, logged server-side without printing secrets.
- Drive rate limit or timeout mid-build: whole snapshot fails with 503 (never a partial snapshot); client keeps the old one.
- Malformed recipe file, bad YAML, missing frontmatter: skipped and reported in `warnings`; other recipes unaffected.
- Recipe with empty optional fields (`servings:` empty, `time` partial): accepted as-is, fields stay empty.
- A file changes between listing and download: the ETag is computed from the listing, so the next sync reconciles it.
- Recipe deleted in Drive: disappears at next sync; its photo cache entry remains until evicted.
- Photo fileId missing or image fetch fails: 404/503, UI falls back to the category tile.
- Client storage unavailable or full (private mode): app works in memory only, with a notice that offline mode is limited; sync still works.
- Two tabs/devices syncing at once: independent; each replaces its own copy.
- Clock changes or invalid `syncedAt`: shown as "hace un momento"-style fallback, never crashes.
- Back online after offline: sync within 5 s (US-4.2).
- Schema version bump: stored copy discarded, refetched; while offline, the old copy is kept and used.

## 11. Non-Functional Requirements
- **Performance:** cached launch renders the list < 1 s; warm conditional refresh (304) < 1 s; first cold sync of ~150 recipes completes in under 15 s on a normal connection. Snapshot is delivered gzip-compressed by the platform.
- **Security:** read-only endpoints, no secret in client bundle; service account scoped to the one folder (tech_standards §9). Endpoints are open, which is accepted for read-only low-sensitivity data (Vision §9/§10).
- **Accessibility:** ui_standards §8; sync status in a polite live region; 44px minimum targets.
- **Reliability:** an hour of Drive or Vercel downtime is tolerated through the offline copy.
- **Scale:** 2 users, 100+ recipes; no caching tier beyond in-memory per server instance.

## 12. Dependencies & Existing System Touchpoints
- Drive folder `food` and its schema contract (external, owned by the food-manager skill: read only).
- **Manual prerequisite (blocking):** Google Cloud service account created, folder shared with it as viewer/editor, and env vars `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID` set locally and on Vercel (ADR 002). Documented in README as part of this feature.
- Blocks every other backlog item. Blocked by nothing in code.
- Tech stack: Next.js route handlers, `@googleapis/drive`, `yaml`, `zod`, `swr`, `idb-keyval`, `serwist` (all in tech_standards §2). No new technology needed.
- Master doc: none yet; this feature creates the first entries (Drive gateway, library, sync status).

## 13. Assumptions & Open Questions
- Drive folder layout follows `food/_system/schema.md` exactly (`recipes/items/**.md`, `ingredients/items.yaml`, `pantry/pantry.yaml`, `reviews/<user>.yaml`, vocabularies under `_system`, photos under `recipes/_attachments/<id>.jpg`).
- The service account can be granted access to the folder (needs Google Cloud setup by Al).
- Photo files are JPEG named `<recipe id>.jpg`; other formats are ignored in this feature.
- Open: where exactly the vocabulary files live in Drive (`recipes/_system/categories.yaml`, `tags.yaml`, `ingredients/_system/families.yaml`, `_system/units.yaml`): verified against the local mirror; confirm Drive matches at implementation.
- Open: whether recipe body sections should be lazy-loaded once the library passes ~500 recipes; deferred.

## 14. Rollout & Testing Considerations
- Personal app: single production deployment; no flags. Verify on a real phone: install, airplane mode launch, refresh after adding a recipe via Drive.
- Unit tests (vitest): recipe/ingredient/pantry/reviews parsing against real sample files copied into test fixtures; malformed-file skipping; ETag derivation; snapshot atomic replace and schema-version discard; sync de-duplication and state transitions.
- Not required: end-to-end browser tests, live-Drive integration tests.

## 15. Appendix
- Glossary: **Snapshot**: the normalized library delivered by `/api/snapshot`. **Shell**: the app's HTML/JS/CSS needed to open offline. **Fallback tile**: category-colored tile used when a recipe has no photo.
- References: vision §5, §7 (#1), §10; tech_standards §1, §5, §6, §9; hl_architecture §2-§4; ADR 002; ui_standards §8-§9; ui_kit_registry (`AppShell`, `SyncBadge`, `EmptyState`, `Toast`, `Button`).

# Tech Standards: My Food Manager

> Project: `my-food-manager`
> Status: Approved (2026-10-28)
> Derived from: `product/product_vision.md` (approved 2026-10-28)
> Change process: ADR via tech-lead (see §12)

## 1. Stack
| Layer | Choice | Version policy | Why (vision driver) |
|---|---|---|---|
| Language | TypeScript, `strict: true` | Node 20 LTS (installed locally: 20.19) | §9 no stack preference; one language end to end keeps "a few hours until it works" realistic |
| Web frontend | Next.js (App Router) + React | Current major at project start; upgrade majors deliberately | §9 Vercel deploy; PWA and server routes in one deployable. *Alternative: Vite SPA + Vercel functions (close call; Next chosen for built-in API routes and Vercel fit)* |
| Mobile | n/a (responsive PWA installed to the home screen) | | Vision §9: web only |
| Backend / API | Next.js Route Handlers (Node runtime), a thin gateway to Google Drive | same as above | §5, §9: no database, one server credential; no separate backend |
| Database | None. Google Drive folder `food` is the source of truth; browser IndexedDB is the offline cache | | Vision §9 (data contract), §10 (2 users, 100+ recipes) |
| Auth | None, plus one shared write key (see §9) | | Vision §9: no logins |
| Hosting / runtime | Vercel Hobby (free) | | §9 $0 budget |
| Other services | Google Drive API v3 via a service account (the Drive folder is shared with the service account's email) | | §9 secret token on the server is acceptable |

## 2. Approved Libraries
| Purpose | Library |
|---|---|
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Drive API | `@googleapis/drive` (not the full `googleapis`) |
| YAML parsing/serialization | `yaml` |
| Validation | `zod` |
| Client data fetching | `swr` |
| Offline storage | `idb-keyval` (IndexedDB) |
| Service worker / PWA | `serwist` (Next.js integration) |
| Unit tests | `vitest` |
| Lint / format | ESLint (Next config) and Prettier |

**Not allowed / avoid:**
- Any database or ORM (Postgres, Supabase, Firebase, Prisma): Drive is the source of truth (Vision §9).
- NextAuth or any auth provider: no logins (Vision §9).
- Component kits with heavy runtime (MUI, Chakra, Ant): the UI is custom and visual; ux-designer defines the kit on Tailwind.
- `next-pwa` (unmaintained) and Workbox directly; use `serwist`.
- State managers (Redux, Zustand) until an ADR shows SWR + React state is insufficient.

## 3. Repository Structure
The app lives at the project root, `apps/my-food-manager/` inside the `tools` monorepo (a single deployable):
```
SDLC.md   package.json   next.config.ts
docs/                    # product, context, architecture, features, changelog
src/
  app/                   # routes and pages; app/api/** = Drive gateway handlers
  components/            # UI components (UI kit lives here)
  lib/
    drive/               # Drive client, file listing, read/write with modified-time check
    schema/              # zod schemas mirroring food/_system/schema.md
    domain/              # pure logic: filters, "can cook now", shopping list
    offline/             # IndexedDB cache, op outbox, sync
  sw.ts                  # service worker
public/                  # icons, manifest
prototypes/              # scratch (gitignored)
```

## 4. Coding Conventions
- Prettier defaults plus ESLint `next/core-web-vitals` and `@typescript-eslint/recommended`; no warnings left in merged code.
- Files `kebab-case.ts(x)`, React components `PascalCase`, hooks `useX`.
- Pure domain logic (no I/O, no React) lives in `src/lib/domain` and is the main unit-test target.
- Server code never imports from client-only modules, and vice versa; Drive credentials are read only in `src/lib/drive`.
- Errors in route handlers return the format in §6; never swallow Drive errors silently.
- Comments only where intent is non-obvious. User-facing copy is in Spanish; code, identifiers and docs are English.

## 5. Data & Persistence Conventions
- **Contract:** `food/_system/schema.md` in the Drive folder is authoritative (recipes schema 3, ingredients 1, pantry 1, reviews 1). `src/lib/schema` mirrors it with zod; unknown extra fields are preserved, never dropped, on write.
- IDs are recipe/ingredient slugs from the files; the app never mints ids.
- Timestamps are ISO 8601 with offset `-05:00`, as in the files; the app sets `updated` on every write.
- **The app writes only:** `pantry/pantry.yaml`, `reviews/<user>.yaml`, and `curated` on a recipe. It never edits other recipe fields, the ingredient catalog or vocabularies (food-manager owns them).
- Writes are intent operations (e.g. `pantry.setHave`, `review.setRating`), applied server-side as read-modify-write against the latest file, with a Drive `modifiedTime` check and one retry (ADR 001).
- No deletes of Drive files from the app.
- Offline cache: one IndexedDB store with the last snapshot and an ordered outbox of pending operations.

## 6. API & Integration Conventions
- REST-ish JSON route handlers under `src/app/api`: `GET /api/snapshot` (everything the UI needs, ETag-based), `GET /api/photo/[id]` (proxy with long cache headers), `POST /api/ops` (operations batch).
- All inputs validated with zod; errors return `{ "error": { "code": string, "message": string } }` with the proper HTTP status.
- Drive is wrapped in `src/lib/drive`; no other module calls the Drive API. Listing uses `modifiedTime` to skip unchanged files; per-instance in-memory cache is allowed, never required for correctness.
- No pagination: the snapshot is one document (100+ recipes, tens of KB of metadata; recipe bodies may load lazily).

## 7. UI Implementation
- Tailwind CSS with design tokens as CSS variables; light and dark themes; components in `src/components`; icons from lucide-react only.
- Mobile-first layouts; desktop is a responsive enhancement. Installable PWA (manifest + service worker via serwist).
- ux-designer's UI Standards and UI Kit Registry build on this section.

## 8. Testing Standards
- Required: unit tests (vitest) for every function in `src/lib/domain`, the zod schemas against real sample files, the operation-merge logic, and the outbox replay.
- Lint, type-check and unit tests pass before merge.
- Not required yet: end-to-end browser tests, Drive integration tests against the live folder, visual regression.

## 9. Security & Privacy Baseline
- Secrets live only in Vercel environment variables (`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`, `APP_WRITE_KEY`) and a gitignored `.env.local`; never committed, never sent to the client.
- The service account has access to the single `food` folder only.
- Write operations require header `x-app-key` matching `APP_WRITE_KEY`; each device stores the key once (entered at first launch). Reads are open. *Rationale: no logins, but a public URL with an open write endpoint to your Drive is cheap to prevent.*
- Data is low sensitivity (personal food data). Dependencies are kept current (`npm audit` reviewed before deploys).
- The "who am I" household choice is a client-side preference, not a security boundary.

## 10. Environments & Delivery
- Environments: local and production (Vercel); Vercel preview deployments per branch are fine (free).
- Base branch `main`. Feature branches follow `<project_id>/<id>-<slug>` (e.g. `my-food-manager/004-shopping-list`); feature commits start with `[<project_id>/<id>]` (e.g. `[my-food-manager/004] add list model`). Always qualify Feature IDs.
- Deploy: Vercel Git integration with the project root directory `apps/my-food-manager`; merge to `main` deploys to production.
- Required checks before merge (run locally, CI optional later): `npm run lint`, `npm run typecheck`, `npm test`.

## 11. Definition of Done (technical)
- [ ] Lint, type-check and tests pass.
- [ ] New domain logic has unit tests; schema changes are checked against sample Drive files.
- [ ] Works offline for read paths the feature touches; writes go through the outbox.
- [ ] No secret or personal data committed; no library outside §2.
- [ ] PRD acceptance criteria met on a phone-sized viewport and on desktop.
- [ ] After merge: document-manager updates the functional spec and changelog.

## 12. Changing These Standards
Any new technology, library outside §2, or rule change requires an ADR (`architecture/adr/`) approved by the user. Until then, it isn't allowed.

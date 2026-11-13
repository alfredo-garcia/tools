# Tests: Fitness Coach

> Project: `fitness-coach` · Test platform: `docs/context/tech_standards.md` §14

- `tests/unit/` (vitest): server-side and pure logic. Run with `npx vitest run`.
- `tests/e2e/` (Playwright): main flows in a mobile viewport against a production build, with `/api/snapshot` mocked at context level (`SnapshotApi`), so the Drive is never touched. Run with `npx playwright test`.
- `tests/fixtures/`: **synthetic** data only (a fake `fitness` folder and fake snapshots). Never copy real files from the knowledge base here: they hold health data.
- Every acceptance test carries `[fitness-coach/<id>] AC-n` in its title (tech_standards §14).

## Test contract for fitness-coach/001

The acceptance tests were written before the code. The implementation must provide these seams; changing one goes back through qa-engineer with the reason, never by editing a test to make it pass.

| Seam | Signature |
|---|---|
| `src/app/api/snapshot/route.ts` | `export async function GET(request: Request): Promise<Response>` (PRD §8) |
| `src/lib/drive/files.ts` | `export async function readKbFiles(): Promise<{ path: string; content: string }[]>` (`path` relative to the `fitness` folder; the only module that talks to Drive) |
| `src/lib/drive/snapshot.ts` | `export function buildSnapshot(files, now: Date): Snapshot` (pure; PRD §7) |
| `src/lib/offline/merge.ts` | `export function mergeSnapshot(previous: Snapshot \| null, incoming: Snapshot): Snapshot` (FR-4: single-file domains in `skipped` keep their previous value) |
| `src/lib/domain/age.ts` | `export function formatAge(from: Date, now: Date): string` |
| UI | Every element named in the UX Flow (`key-input`, `enter-button`, `sync-badge`, `refresh-button`, `summary-card`, `skipped-warning`, `nav-home`, `key-sheet`, `storage-toast`…) carries it as `data-testid`. Icons are `lucide-react` (tests look for `svg.lucide-<name>`). The PWA manifest is linked with `<link rel="manifest">` |

## Traceability: fitness-coach/001

| Criterion | Tests |
|---|---|
| AC-1 | e2e US-1 AC-1 |
| AC-2 | e2e AC-2 (service worker allowed, cold start offline) |
| AC-3 | e2e AC-3 |
| AC-4 | e2e AC-4; unit `formatAge` |
| AC-5 | e2e AC-5 (two tests: > 1 min and < 1 min) |
| AC-6 | e2e AC-6 |
| AC-7 | e2e AC-7 (real touch drag through CDP) |
| AC-8 | e2e AC-8; unit route 304 and ETag |
| AC-9 | e2e AC-9 |
| AC-10 | e2e AC-10; unit route 200 |
| AC-11 | e2e AC-11 (two tests); unit route 401 |
| AC-12 | e2e AC-12; unit route 401 |
| AC-13 | e2e AC-13 × 5 states × 3 screens; unit `formatAge` |
| AC-14 | e2e AC-14 (502 and > 15 s); unit route 502 |
| AC-15 | e2e AC-15 (two tests); unit `buildSnapshot` parse_error / schema_error |
| AC-16 | unit `buildSnapshot` (program null + skipped) and `mergeSnapshot` (previous program kept) |
| AC-17 | e2e AC-17 (manifest, icons, apple-touch-icon). **Manual:** add to the home screen on Android and iOS, check the "MC" icon and full screen |
| AC-18 | e2e AC-18 |
| AC-19 | e2e AC-19 |
| AC-20 | e2e AC-20 (mobile: no button; desktop: button refreshes) |
| FR-2, FR-3 | unit `buildSnapshot` |
| FR-17 | e2e FR-17 (three tests) |
| PRD §8 privacy | unit route: logs and error bodies without health data or the key |
| PRD §10 | unit: empty sessions, missing program, no active routines; e2e: storage unavailable, 409 client_outdated, browser data cleared |
| PRD §11 performance (< 1 s cached open, < 5 s refresh, < 300 KB) | **Manual** on the phone before the first deploy, together with the Drive integration check (tech_standards §14, §17) |

## Test changes after the tests were written

| Date | Test | Change | Why (qa-engineer) |
|---|---|---|---|
| 2026-11-12 | `unit/merge-snapshot.test.ts` | `_dropped` destructuring → copy + `delete` | ESLint unused-variable warning; same behavior |
| 2026-11-13 | `unit/snapshot-build.test.ts` | Non-null assertions (`!`) on `find(...)`, `s.program` and `s.vocabularies.<name>` | Type-only: with the real `Snapshot` type, strict TypeScript flags possibly-undefined access. At runtime an undefined value still makes the test fail; no assertion changed |
| 2026-11-13 | `unit/merge-snapshot.test.ts` (AC-16, first case) | `pausedRoutines: 0` in both `makeSnapshot` calls | Test-data error: `makeSnapshot` adds 1 paused routine by default, so "3 active" gave 4 routines while the test expects 3. The assertion (`toHaveLength(3)`) is unchanged |
| 2026-11-13 | `e2e` AC-2 | New assertion: after the online sync no service-worker cache holds a `/api/` URL (and the caches are not empty) | Stronger: proves the high-risk rule of tech_standards §17 (§5/§10) and PRD §11; T6 review |
| 2026-11-13 | `e2e` AC-9 | Waits for the held request to reach the mock before reading `during` | Race in the test: the badge shows "Sincronizando…" a moment before the request is counted, so `during` could be one short. The assertion (`count` unchanged by other triggers) is the same |
| 2026-11-13 | `playwright.config.ts` | `workers: 4` | With 12–16 parallel workers, tests timed out waiting for the first render under CPU load; no assertion or timeout changed |

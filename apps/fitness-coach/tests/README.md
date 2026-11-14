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

## Test contract for fitness-coach/002

Written before the code (qa-engineer Mode C). Same rule: a seam changes only through qa-engineer.

| Seam | Signature |
|---|---|
| `src/lib/domain/routines.ts` | `RoutineLike`; `routineExerciseCount(r)`, `sortRoutines(list)`, `groupRoutines(list, { day, type }) → { active, paused }`, `filterCounts(list, { day, type }) → { day, type }`, `daysAria(days?)`, `formatDose(item, routineRest?, laterality?)` (pure, no React) |
| UI | UX Flow 002 names as `data-testid`: `routine-card`, `day-filter-<all\|mon…sun>`, `type-filter-<all\|category>`, `clear-filters-button`, `block-section-<block id>`, `exercise-row`, `guidelines-section`, `progression-section`, `start-routine-button`, `guided-mode-toast`, `back-button`, `back-to-list-button`. Card titles are `h3`; the detail title is the page's `h1`; `DayChips` is `role="img"` with `aria-label` "Días: L · J". The list scrolls the window (AC-15). From 640 px the detail is a `role="dialog"` |
| Fixtures | `tests/fixtures/routines.ts` (`routinesSnapshot`, `detailSnapshot`, `longListSnapshot`), synthetic |

## Traceability: fitness-coach/002

| AC | Test |
|---|---|
| AC-1 … AC-19 | `e2e/002-my-routines.spec.ts`, one test per AC titled `[fitness-coach/002] AC-n` (AC-14 has two) |
| FR-2, FR-3, FR-5 logic | `src/lib/domain/routines.test.ts` (order, filters, counts, day labels, dose formats) |
| UX Flow 2.2 (modal from 640 px) | `e2e/002-my-routines.spec.ts`, "pantalla ancha" |
| Independent review (2026-11-14) | `e2e/002-my-routines.spec.ts`, "revisión independiente": detail with no stored routine, Back after a reload, AC-15 from 640 px, focus kept in the modal, FR-8 detail offline from the service worker |

## Test changes after the tests were written

| Date | Test | Change | Why (qa-engineer) |
|---|---|---|---|
| 2026-11-12 | `unit/merge-snapshot.test.ts` | `_dropped` destructuring → copy + `delete` | ESLint unused-variable warning; same behavior |
| 2026-11-13 | `unit/snapshot-build.test.ts` | Non-null assertions (`!`) on `find(...)`, `s.program` and `s.vocabularies.<name>` | Type-only: with the real `Snapshot` type, strict TypeScript flags possibly-undefined access. At runtime an undefined value still makes the test fail; no assertion changed |
| 2026-11-13 | `unit/merge-snapshot.test.ts` (AC-16, first case) | `pausedRoutines: 0` in both `makeSnapshot` calls | Test-data error: `makeSnapshot` adds 1 paused routine by default, so "3 active" gave 4 routines while the test expects 3. The assertion (`toHaveLength(3)`) is unchanged |
| 2026-11-13 | `e2e` AC-2 | New assertion: after the online sync no service-worker cache holds a `/api/` URL (and the caches are not empty) | Stronger: proves the high-risk rule of tech_standards §17 (§5/§10) and PRD §11; T6 review |
| 2026-11-13 | `e2e` AC-9 | Waits for the held request to reach the mock before reading `during` | Race in the test: the badge shows "Sincronizando…" a moment before the request is counted, so `during` could be one short. The assertion (`count` unchanged by other triggers) is the same |
| 2026-11-13 | `playwright.config.ts` | `workers: 4` | With 12–16 parallel workers, tests timed out waiting for the first render under CPU load; no assertion or timeout changed |
| 2026-11-14 | `e2e/001` AC-18 | Only Ejercicios is still checked for "Próximamente"; Rutinas keeps the navigation checks | Superseded behavior: PRD 002 replaces the provisional Rutinas screen (SCR-routines-list), and `e2e/002` covers the new one. Approved by Al, 2026-11-14 |
| 2026-11-14 | `e2e/002` AC-1, AC-6 | Expected order "Fuerza de pierna" before "Natación técnica" | Test-data error: both are Monday routines, and FR-2 orders by title after the first day; the prototype's sample order was not the rule. Same assertions |
| 2026-11-14 | `e2e/002` AC-16 | Moves the clock 2 min forward before `toForeground` | Setup error: 001's FR-6b only refreshes on return after more than 1 min. The assertions are the same |
| 2026-11-14 | `fixtures/routines.ts` | `as unknown as SnapshotDoc["vocabularies"]` on the vocabularies | Type-only: the fixture type was inferred from `makeSnapshot`'s single category |

## Verification record: fitness-coach/001 (qa-engineer, Mode D)

**Verdict: Verified (2026-11-13), automated scope.** Three manual checks remain, and they must pass before the first production deploy (see below).

- Commit `b6a4dcfa`, Node 22.23.5. `npm run check` green; `npm test`: unit 8 files / 62 tests passed, e2e 34/34 passed.
- Stability: e2e 34/34 in four more full runs and 102/102 with `--repeat-each=3` (4 workers). Earlier timeouts with 12–16 workers came from CPU load and a race in AC-9's own test; both are fixed and recorded above. Nothing is quarantined.
- Traceability: every AC-1…AC-20 has at least one test tagged `[fitness-coach/001] AC-n`. FR-2, FR-3, FR-4 and FR-17 and PRD §8/§10 are covered as listed in the table above.
- Nothing is skipped, `.only`, `fixme` or `test.fail`. Compared with the approved tests (`e370ad7d`), after normalising formatting the only differences are the five changes in "Test changes". Three of them strengthen or fix a test, two are type-only. No assertion was removed or loosened. Unit tests were added in `src/**` (Drive walk, sync reducer, fetch, empty YAML values).

| Manual check | Status |
|---|---|
| AC-17 on the phone: add to the home screen on Android and iOS, "MC" icon, full screen | Pending: needs the deployed app |
| PRD §11 performance: cached open < 1 s, refresh < 5 s on 4G, snapshot < 300 KB | Partial: the snapshot of the real KB is 52 KB (T1). Timings pending on the phone |
| Drive integration against a copy of the `fitness` folder (tech_standards §14) | Pending: needs the service account and env vars (impl plan §5) |

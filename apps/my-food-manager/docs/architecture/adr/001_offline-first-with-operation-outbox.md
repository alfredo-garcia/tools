# ADR 001: Offline-first with an operation outbox

> Project: `my-food-manager`
> Status: Accepted (2026-10-28)
> Triggered by: Vision §5, §10 (offline caching always; household of 2; coexistence with food-manager)

## Context
The app must read recipes and the shopping list offline and let pantry/review changes happen offline. Two phones and a skill write the same Drive files. Overwriting whole files from a stale cache would clobber other writers' changes.

## Options Considered
- **Online only, with a read cache.** Simplest, but fails the store use case for changes (ticking items, pantry).
- **Offline queue of whole-file writes.** Easy to build, but a stale device overwrites everything else.
- **Offline queue of small intent operations, applied server-side to the latest file.** More logic (merge per operation), but conflicts shrink to the same field. Fits 2 users.
- **Full sync engine / CRDT.** Overkill for the scale.

## Decision
IndexedDB holds the last snapshot and an ordered outbox of intent operations (e.g. set ingredient `have`, set rating). On reconnect the outbox is sent to `POST /api/ops`; the server reads the latest Drive file, applies each operation, checks `modifiedTime`, writes, and retries once. Conflicts are last-write-wins per field.

## Consequences
Defines `lib/offline`, `api/ops` and tech_standards §5/§6. Adds merge logic that needs unit tests. Watch for lost updates in practice; if seen, revisit the CRDT deferral in hl_architecture §9.

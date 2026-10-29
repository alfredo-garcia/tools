# Changelog: Drive Sync & Offline Library

> Project: `my-food-manager`
> Merged: commit `c9a7537a` into `main`, confirmed by user on 2026-10-29
> Source PRD: `001_drive-sync-offline-library_prd.md`
> Source UX Flow: none (the feature only shipped a minimal proof screen; UI taken from PRD §9 and the implementation)
> Master doc file(s) touched: `docs/functional-spec.md` (created; domain `library` inline)
> Date applied: 2026-10-29
> Reviewed and approved by: user

## Summary

First feature merged. It creates the master functional documentation and documents how the library moves from Drive to the device, stays available offline and shows its sync status.

## Added

- **Domain `library`**, in `docs/functional-spec.md`.
- **SCR-library-list** — recipe list proof screen with loading, offline, error and empty states.
- **FLW-first-sync** — first load on a new device.
- **FLW-library-refresh** — freshness rules and manual refresh.
- **CMP-sync-badge**, **CMP-recipe-photo**, **CMP-app-shell**.
- Shared entity **Library snapshot** and the cross-cutting rules for read-only, offline-first and freshness.

## Modified

None. This is the initial creation of the master doc.

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| Refresh button on desktop, pull-to-refresh on mobile (§9) | Refresh button is available at every size; pull-to-refresh also works on touch | Shipped that way; approved with this changelog |
| Error state offers a retry action (§9) | Retrying is done with the always-available refresh button, plus a notice when a manual refresh fails | Shipped that way; approved with this changelog |

## Open Questions / Follow-Ups

1. Test against the real Drive folder. The vocabulary file paths are only verified against the local mirror, and the service account has not been created yet.
2. `ui_kit_registry.md` lists `Toast` at `components/overlays/Toast`, but the code has it at `components/feedback/Toast`. Fix the registry.
3. Lazy-load recipe bodies once the library passes about 500 recipes (deferred in the PRD).
4. Not yet verified on a real phone: installing to the home screen and pull-to-refresh.
5. Technical deviations, kept out of the master doc: `swr` was replaced by an in-house sync store, the Drive scope is `drive.readonly` (write features will need a wider one), the build uses webpack for the service worker, and `LOCAL_FOOD_DIR` is a development-only data source.

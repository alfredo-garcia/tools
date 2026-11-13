/** [fitness-coach/001] Sync state reducer (FR-9, FR-12, FR-6b). */
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../tests/fixtures/snapshot";
import type { Snapshot } from "@/lib/schema/snapshot";
import { initialState, isStale, syncReducer, type SyncState } from "./state";

const snap = makeSnapshot() as unknown as Snapshot;
const stored = {
  snapshot: snap,
  etag: '"e"',
  lastSyncedAt: "2026-11-12T17:00:00.000Z",
  accessKey: "k",
};
const ready = (): SyncState =>
  syncReducer(initialState, { type: "loaded", stored, storageAvailable: true, online: true });

describe("[fitness-coach/001] syncReducer", () => {
  it("FR-5: with a stored copy the app is ready before any request", () => {
    expect(ready().phase).toBe("ready");
    expect(ready().snapshot).toBe(snap);
  });

  it("FR-10/FR-11: without a copy it is the first open", () => {
    const empty = { snapshot: null, etag: null, lastSyncedAt: null, accessKey: null };
    const s = syncReducer(initialState, {
      type: "loaded",
      stored: empty,
      storageAvailable: true,
      online: false,
    });
    expect(s.phase).toBe("no_data");
  });

  it("FR-9: offline at start-up shows offline", () => {
    const s = syncReducer(initialState, {
      type: "loaded",
      stored,
      storageAvailable: true,
      online: false,
    });
    expect(s.status).toBe("offline");
  });

  it("FR-12: the first rejection opens the key sheet; later ones don't reopen it", () => {
    let s = syncReducer(ready(), { type: "sync_failed", status: "invalid_key" });
    expect(s).toMatchObject({ status: "invalid_key", keySheetOpen: true, snapshot: snap });
    s = syncReducer(s, { type: "key_sheet", open: false });
    s = syncReducer(s, { type: "sync_started" });
    s = syncReducer(s, { type: "sync_failed", status: "invalid_key" });
    expect(s.keySheetOpen).toBe(false);
  });

  it("FR-12: an accepted key closes the sheet and replaces the key", () => {
    let s = syncReducer(ready(), { type: "sync_failed", status: "invalid_key" });
    s = syncReducer(s, {
      type: "sync_ok",
      snapshot: snap,
      etag: '"e2"',
      accessKey: "nueva",
      at: "t",
    });
    expect(s).toMatchObject({
      status: "synced",
      keySheetOpen: false,
      keyRejected: false,
      accessKey: "nueva",
    });
  });

  it("FR-13: a failed update keeps the copy", () => {
    const s = syncReducer(ready(), { type: "sync_failed", status: "error" });
    expect(s.snapshot).toBe(snap);
    expect(s.lastSyncedAt).toBe(stored.lastSyncedAt);
  });

  it("FR-7: 304 only moves the sync time", () => {
    const s = syncReducer(ready(), {
      type: "sync_not_modified",
      at: "2026-11-12T18:00:00.000Z",
      accessKey: "k",
    });
    expect(s).toMatchObject({
      snapshot: snap,
      etag: '"e"',
      lastSyncedAt: "2026-11-12T18:00:00.000Z",
      status: "synced",
    });
  });

  it("going offline during an update keeps 'syncing'", () => {
    const s = syncReducer(syncReducer(ready(), { type: "sync_started" }), { type: "went_offline" });
    expect(s.status).toBe("syncing");
  });
});

describe("[fitness-coach/001] isStale (FR-6b)", () => {
  const t = Date.parse("2026-11-12T17:00:00.000Z");
  it("more than 1 minute is stale; 1 minute or less is not", () => {
    expect(isStale("2026-11-12T17:00:00.000Z", t + 61_000)).toBe(true);
    expect(isStale("2026-11-12T17:00:00.000Z", t + 30_000)).toBe(false);
    expect(isStale(null, t)).toBe(true);
  });
});

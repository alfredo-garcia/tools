/**
 * Sync state (FR-9) as a pure reducer. The provider runs the effects; this file only decides.
 */
import type { Snapshot } from "@/lib/schema/snapshot";

export type SyncStatus = "synced" | "offline" | "syncing" | "error" | "invalid_key";

/** FR-6b: back in the foreground, refresh only if the last good sync is older than this. */
export const FOREGROUND_REFRESH_MS = 60_000;

export type SyncState = {
  /** loading: reading IndexedDB; no_data: first open (Welcome / FirstOpenOffline); ready: has a copy */
  phase: "loading" | "no_data" | "ready";
  snapshot: Snapshot | null;
  etag: string | null;
  lastSyncedAt: string | null;
  accessKey: string | null;
  status: SyncStatus;
  storageAvailable: boolean;
  keySheetOpen: boolean;
  /** The stored key was rejected and no update has succeeded since. */
  keyRejected: boolean;
};

export const initialState: SyncState = {
  phase: "loading",
  snapshot: null,
  etag: null,
  lastSyncedAt: null,
  accessKey: null,
  status: "offline",
  storageAvailable: true,
  keySheetOpen: false,
  keyRejected: false,
};

export type SyncAction =
  | {
      type: "loaded";
      stored: Pick<SyncState, "snapshot" | "etag" | "lastSyncedAt" | "accessKey">;
      storageAvailable: boolean;
      online: boolean;
    }
  | { type: "sync_started" }
  | {
      type: "sync_ok";
      snapshot: Snapshot;
      etag: string | null;
      accessKey: string;
      at: string;
    }
  | { type: "sync_not_modified"; at: string; accessKey: string }
  | { type: "sync_failed"; status: "offline" | "error" | "invalid_key" }
  | { type: "went_offline" }
  | { type: "key_sheet"; open: boolean };

export function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case "loaded": {
      const hasCopy = action.stored.snapshot !== null;
      return {
        ...state,
        ...action.stored,
        phase: hasCopy ? "ready" : "no_data",
        storageAvailable: action.storageAvailable,
        status: action.online ? "synced" : "offline",
      };
    }
    case "sync_started":
      return { ...state, status: "syncing" };
    case "sync_ok":
      return {
        ...state,
        phase: "ready",
        snapshot: action.snapshot,
        etag: action.etag,
        accessKey: action.accessKey,
        lastSyncedAt: action.at,
        status: "synced",
        keySheetOpen: false,
        keyRejected: false,
      };
    case "sync_not_modified":
      return {
        ...state,
        lastSyncedAt: action.at,
        accessKey: action.accessKey,
        status: "synced",
        keySheetOpen: false,
        keyRejected: false,
      };
    case "sync_failed":
      return {
        ...state,
        status: action.status,
        keyRejected: state.keyRejected || action.status === "invalid_key",
        // FR-12: the sheet opens by itself only the first time the key is rejected
        keySheetOpen:
          action.status === "invalid_key" && !state.keyRejected ? true : state.keySheetOpen,
      };
    case "went_offline":
      return state.status === "syncing" ? state : { ...state, status: "offline" };
    case "key_sheet":
      return { ...state, keySheetOpen: action.open };
  }
}

/** FR-6b */
export function isStale(lastSyncedAt: string | null, now: number): boolean {
  if (!lastSyncedAt) return true;
  return now - Date.parse(lastSyncedAt) > FOREGROUND_REFRESH_MS;
}

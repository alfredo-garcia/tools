/**
 * Device storage (tech_standards §9, PRD §7 "Estado en el dispositivo"): snapshot, etag,
 * last_synced_at and access_key in IndexedDB through idb-keyval. Nothing else in feature 001.
 *
 * The database is opened lazily inside a try: in private mode or with IndexedDB blocked,
 * `indexedDB.open` can throw synchronously, and the app must keep working with the network only.
 */
import { createStore, delMany, getMany, setMany, type UseStore } from "idb-keyval";
import type { Snapshot } from "@/lib/schema/snapshot";

export type Stored = {
  snapshot: Snapshot | null;
  etag: string | null;
  lastSyncedAt: string | null;
  accessKey: string | null;
};

const KEYS = ["snapshot", "etag", "last_synced_at", "access_key"] as const;
const PROBE = "__probe";

let store: UseStore | null = null;
function db(): UseStore {
  store ??= createStore("my-coach", "kv");
  return store;
}

/** Write test at start-up: false when the browser can't store anything. */
export async function probeStorage(): Promise<boolean> {
  try {
    await setMany([[PROBE, 1]], db());
    await delMany([PROBE], db());
    return true;
  } catch {
    store = null;
    return false;
  }
}

export async function loadStored(): Promise<Stored> {
  const empty: Stored = { snapshot: null, etag: null, lastSyncedAt: null, accessKey: null };
  try {
    const [snapshot, etag, lastSyncedAt, accessKey] = await getMany([...KEYS], db());
    // A copy is only usable with its key and sync time; anything partial counts as no copy.
    if (!snapshot || !accessKey || !lastSyncedAt) return empty;
    return { snapshot, etag: etag ?? null, lastSyncedAt, accessKey };
  } catch {
    return empty;
  }
}

/**
 * Replaces the stored copy in one IndexedDB transaction, so an interrupted update never leaves it
 * half written (PRD §10). Returns false if the browser refused the write.
 */
export async function saveStored(next: Stored): Promise<boolean> {
  try {
    await setMany(
      [
        ["snapshot", next.snapshot],
        ["etag", next.etag],
        ["last_synced_at", next.lastSyncedAt],
        ["access_key", next.accessKey],
      ],
      db(),
    );
    return true;
  } catch {
    return false;
  }
}

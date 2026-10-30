import {
  SNAPSHOT_SCHEMA_VERSION,
  snapshotResponseSchema,
  type Library,
  type Plan,
  type SnapshotResponse,
  type Warning,
} from "@/lib/schema";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";
export type SyncReason = "open" | "interval" | "manual" | "online";
export type SyncResult = "updated" | "unchanged" | "failed";

export interface LibraryState {
  /** True once the stored copy has been read (or found missing). */
  hydrated: boolean;
  status: SyncStatus;
  /** ISO time of the last successful sync (client clock). */
  syncedAt?: string;
  library: Library | null;
  warnings: Warning[];
  /** False when the device storage is unavailable: the app then works in memory only. */
  storageOk: boolean;
}

interface Stored {
  schemaVersion: number;
  etag: string;
  syncedAt: string;
  data: Library;
  warnings: Warning[];
}

export interface Storage {
  get(): Promise<Stored | undefined>;
  set(value: Stored): Promise<void>;
}

export interface Deps {
  fetch: typeof fetch;
  storage: Storage;
  now: () => Date;
  isOnline: () => boolean;
}

export function createLibraryStore(deps: Deps) {
  let state: LibraryState = {
    hydrated: false,
    status: "idle",
    library: null,
    warnings: [],
    storageOk: true,
  };
  let etag: string | undefined;
  /** A stored copy with an older schema stays usable but must be replaced by the next fetch. */
  let forceRefetch = false;
  let inflight: Promise<SyncResult> | undefined;
  const listeners = new Set<() => void>();

  const set = (patch: Partial<LibraryState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };

  async function hydrate(): Promise<void> {
    try {
      const stored = await deps.storage.get();
      if (stored) {
        forceRefetch = stored.schemaVersion !== SNAPSHOT_SCHEMA_VERSION;
        etag = stored.etag;
        set({
          hydrated: true,
          library: stored.data,
          syncedAt: stored.syncedAt,
          warnings: stored.warnings ?? [],
          status: deps.isOnline() ? "idle" : "offline",
        });
        return;
      }
      set({ hydrated: true, status: deps.isOnline() ? "idle" : "offline" });
    } catch {
      set({ hydrated: true, storageOk: false, status: deps.isOnline() ? "idle" : "offline" });
    }
  }

  async function persist(value: Stored) {
    try {
      await deps.storage.set(value);
    } catch {
      set({ storageOk: false });
    }
  }

  async function run(): Promise<SyncResult> {
    if (!deps.isOnline()) {
      set({ status: "offline" });
      return "failed";
    }
    set({ status: "syncing" });
    let res: Response;
    try {
      res = await deps.fetch("/api/snapshot", {
        cache: "no-store",
        headers: etag && !forceRefetch ? { "If-None-Match": etag } : {},
      });
    } catch {
      set({ status: deps.isOnline() ? "error" : "offline" });
      return "failed";
    }

    if (res.status === 304 && state.library && etag) {
      const syncedAt = deps.now().toISOString();
      set({ status: "idle", syncedAt });
      await persist({
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        etag,
        syncedAt,
        data: state.library,
        warnings: state.warnings,
      });
      return "unchanged";
    }
    if (!res.ok) {
      set({ status: "error" });
      return "failed";
    }

    let body: SnapshotResponse;
    try {
      const parsed = snapshotResponseSchema.parse(await res.json());
      body = parsed as unknown as SnapshotResponse;
    } catch {
      set({ status: "error" });
      return "failed";
    }
    if (body.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
      // The server speaks a newer contract than this app build.
      set({ status: "error" });
      return "failed";
    }

    const syncedAt = deps.now().toISOString();
    etag = body.etag;
    forceRefetch = false;
    // The stored copy is replaced only after a complete, valid snapshot arrived.
    set({ status: "idle", syncedAt, library: body.data, warnings: body.warnings });
    await persist({
      schemaVersion: body.schemaVersion,
      etag: body.etag,
      syncedAt,
      data: body.data,
      warnings: body.warnings,
    });
    return "updated";
  }

  /** Concurrent triggers share one in-flight sync. */
  function sync(_reason: SyncReason): Promise<SyncResult> {
    void _reason;
    inflight ??= run().finally(() => {
      inflight = undefined;
    });
    return inflight;
  }

  /** Replaces the stored pantry with the one the server just saved, so the screen never shows the old value. */
  function setPantry(pantry: Pick<Library["pantry"], "have" | "to_buy"> & { updated?: string }) {
    if (!state.library || !etag) return;
    const library = { ...state.library, pantry: { ...state.library.pantry, ...pantry } };
    set({ library });
    void persist({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      etag,
      syncedAt: state.syncedAt ?? deps.now().toISOString(),
      data: library,
      warnings: state.warnings,
    });
  }

  /** Replaces the stored plan with the one the server just saved. */
  function setPlan(plan: Plan) {
    if (!state.library || !etag) return;
    const library = { ...state.library, plan };
    set({ library });
    void persist({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      etag,
      syncedAt: state.syncedAt ?? deps.now().toISOString(),
      data: library,
      warnings: state.warnings,
    });
  }

  function markOffline() {
    set({ status: "offline" });
  }

  return {
    getState: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    hydrate,
    sync,
    setPantry,
    setPlan,
    markOffline,
  };
}

export type LibraryStore = ReturnType<typeof createLibraryStore>;

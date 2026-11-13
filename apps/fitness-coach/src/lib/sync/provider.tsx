"use client";
/**
 * Runs the sync layer (FR-5–FR-13) for the whole app: loads the stored copy first, then refreshes
 * it on open, back in the foreground (> 1 min), when the connection returns and on demand, with
 * at most one update in flight. Lives in the root layout so it survives navigation.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mergeSnapshot } from "@/lib/offline/merge";
import { loadStored, probeStorage, saveStored } from "@/lib/offline/store";
import { fetchSnapshot, type FetchResult } from "./fetch";
import { initialState, isStale, syncReducer, type SyncState } from "./state";

export type KeyResult = "ok" | "invalid_key" | "offline" | "error";

type SyncApi = {
  state: SyncState;
  /** FR-6d/e: always refreshes, unless one is already in flight (FR-8). */
  refresh: () => void;
  /** Welcome and KeySheet: validates a key by downloading the snapshot (FR-10, FR-12). */
  submitKey: (key: string) => Promise<KeyResult>;
  setKeySheetOpen: (open: boolean) => void;
};

const SyncContext = createContext<SyncApi | null>(null);

const RELOAD_GUARD = "__my_coach_409_reload";
const RELOAD_GUARD_MS = 30_000;

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/** 409 client_outdated: reload to get the new version, but never in a loop. */
function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD) ?? 0);
    if (Date.now() - last < RELOAD_GUARD_MS && last <= Date.now()) return false;
    sessionStorage.setItem(RELOAD_GUARD, String(Date.now()));
  } catch {
    // no sessionStorage: reload anyway
  }
  window.location.reload();
  return true;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(syncReducer, initialState);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);
  const inFlight = useRef<Promise<unknown> | null>(null);

  /** Applies a server answer obtained with `key` and stores the result. */
  const apply = useCallback(async (result: FetchResult, key: string): Promise<KeyResult> => {
    const s = stateRef.current;
    const at = new Date().toISOString();
    switch (result.kind) {
      case "ok": {
        const snapshot = mergeSnapshot(s.snapshot, result.snapshot);
        await saveStored({ snapshot, etag: result.etag, lastSyncedAt: at, accessKey: key });
        dispatch({ type: "sync_ok", snapshot, etag: result.etag, accessKey: key, at });
        return "ok";
      }
      case "not_modified":
        if (!s.snapshot) return "error";
        await saveStored({ snapshot: s.snapshot, etag: s.etag, lastSyncedAt: at, accessKey: key });
        dispatch({ type: "sync_not_modified", at, accessKey: key });
        return "ok";
      case "client_outdated":
        if (reloadForNewVersion()) return "error";
        if (s.phase === "ready") dispatch({ type: "sync_failed", status: "error" });
        return "error";
      case "invalid_key":
      case "offline":
      case "error":
        return result.kind;
    }
  }, []);

  const sync = useCallback(() => {
    const s = stateRef.current;
    if (inFlight.current || s.phase !== "ready" || !s.accessKey) return; // FR-8
    if (!isOnline()) {
      dispatch({ type: "went_offline" });
      return;
    }
    dispatch({ type: "sync_started" });
    const key = s.accessKey;
    const run = (async () => {
      try {
        const result = await fetchSnapshot({ key, etag: s.etag });
        const outcome = await apply(result, key);
        if (outcome !== "ok" && result.kind !== "client_outdated") {
          dispatch({
            type: "sync_failed",
            status: outcome === "invalid_key" ? "invalid_key" : outcome,
          });
        }
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
  }, [apply]);

  const submitKey = useCallback(
    async (key: string): Promise<KeyResult> => {
      while (inFlight.current) await inFlight.current.catch(() => undefined);
      const s = stateRef.current;
      const run = (async () => {
        const result = await fetchSnapshot({ key, etag: s.phase === "ready" ? s.etag : null });
        return apply(result, key);
      })();
      inFlight.current = run;
      try {
        return await run;
      } finally {
        inFlight.current = null;
      }
    },
    [apply],
  );

  // Start-up: the stored copy first (FR-5), then the first update (FR-6a)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storageAvailable = await probeStorage();
      const stored = storageAvailable
        ? await loadStored()
        : { snapshot: null, etag: null, lastSyncedAt: null, accessKey: null };
      if (cancelled) return;
      dispatch({ type: "loaded", stored, storageAvailable, online: isOnline() });
      stateRef.current = {
        ...stateRef.current,
        ...stored,
        phase: stored.snapshot ? "ready" : "no_data",
      };
      if (stored.snapshot) sync();
    })();
    return () => {
      cancelled = true;
    };
  }, [sync]);

  // Triggers FR-6b and FR-6c
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (isStale(stateRef.current.lastSyncedAt, Date.now())) sync();
    };
    const onOnline = () => sync();
    const onOffline = () => dispatch({ type: "went_offline" });
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [sync]);

  const setKeySheetOpen = useCallback((open: boolean) => dispatch({ type: "key_sheet", open }), []);

  const api = useMemo(
    () => ({ state, refresh: sync, submitKey, setKeySheetOpen }),
    [state, sync, submitKey, setKeySheetOpen],
  );
  return <SyncContext.Provider value={api}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncApi {
  const api = useContext(SyncContext);
  if (!api) throw new Error("useSync outside SyncProvider");
  return api;
}

/** Current time, refreshed every `intervalMs`, so relative ages ("hace 5 min") stay right. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

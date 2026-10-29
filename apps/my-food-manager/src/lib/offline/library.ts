import { del, get, set } from "idb-keyval";
import { createLibraryStore, type LibraryStore } from "./store";

const KEY = "snapshot";
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let store: LibraryStore | undefined;

/** Browser singleton; created lazily so server rendering never touches IndexedDB. */
export function getLibraryStore(): LibraryStore {
  store ??= createLibraryStore({
    fetch: (...args) => fetch(...args),
    storage: {
      get: () => get(KEY),
      set: (value) => set(KEY, value),
    },
    now: () => new Date(),
    isOnline: () => navigator.onLine,
  });
  return store;
}

export async function clearStoredLibrary() {
  await del(KEY);
}

/** Wires the sync triggers (open, interval, reconnect, tab visible). Returns a cleanup. */
export function startSync(s: LibraryStore = getLibraryStore()): () => void {
  let stopped = false;
  void s.hydrate().then(() => {
    if (!stopped) void s.sync("open");
  });

  const interval = setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) void s.sync("interval");
  }, REFRESH_INTERVAL_MS);

  const onOnline = () => void s.sync("online");
  const onOffline = () => s.markOffline();
  const onVisible = () => {
    if (document.visibilityState !== "visible" || !navigator.onLine) return;
    const at = s.getState().syncedAt;
    if (!at || Date.now() - new Date(at).getTime() > REFRESH_INTERVAL_MS) void s.sync("interval");
  };
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    stopped = true;
    clearInterval(interval);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

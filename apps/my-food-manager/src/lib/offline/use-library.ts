"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getLibraryStore, startSync } from "./library";
import type { LibraryState } from "./store";

const SERVER_STATE: LibraryState = {
  hydrated: false,
  status: "idle",
  library: null,
  warnings: [],
  storageOk: true,
};

export function useLibrary(): LibraryState & { refresh: () => Promise<unknown> } {
  const store = getLibraryStore();
  const state = useSyncExternalStore(store.subscribe, store.getState, () => SERVER_STATE);
  return { ...state, refresh: () => store.sync("manual") };
}

/** Mount once near the root: hydrates the stored copy and runs the sync triggers. */
export function useStartSync() {
  useEffect(() => startSync(), []);
}

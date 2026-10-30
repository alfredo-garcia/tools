import { del, get, set } from "idb-keyval";
import { createOutbox, type Outbox } from "./outbox";
import { getLibraryStore } from "./library";

const STORE_KEY = "outbox";
const WRITE_KEY = "write-key";

let outbox: Outbox | undefined;

/** Browser singleton; created lazily so server rendering never touches IndexedDB or localStorage. */
export function getOutbox(): Outbox {
  outbox ??= createOutbox({
    fetch: (...args) => fetch(...args),
    storage: { get: () => get(STORE_KEY), set: (value) => set(STORE_KEY, value) },
    keyStore: {
      get: () => {
        try {
          return window.localStorage.getItem(WRITE_KEY);
        } catch {
          return memoryKey;
        }
      },
      set: (key) => {
        memoryKey = key;
        try {
          window.localStorage.setItem(WRITE_KEY, key);
        } catch {
          // Storage blocked: the key lasts until reload.
        }
      },
    },
    isOnline: () => navigator.onLine,
    isVisible: () => document.visibilityState === "visible",
    newId: () => crypto.randomUUID(),
    onSaved: ({ pantry, plan }) => {
      const library = getLibraryStore();
      if (pantry) library.setPantry(pantry);
      if (plan) library.setPlan(plan);
      void library.sync("manual");
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  });
  return outbox;
}

let memoryKey: string | null = null;

export async function clearStoredOutbox() {
  await del(STORE_KEY);
}

/** Loads pending changes and wires the triggers that send them: open, reconnect, visible again. */
export function startOutbox(o: Outbox = getOutbox()): () => void {
  void o.hydrate();
  const trigger = () => void o.flush();
  const onVisible = () => {
    if (document.visibilityState === "visible") trigger();
  };
  window.addEventListener("online", trigger);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("online", trigger);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

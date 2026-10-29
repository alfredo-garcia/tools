"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "sidebar-expanded";
const listeners = new Set<() => void>();

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
};

function read(): boolean | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "true" ? true : value === "false" ? false : null;
  } catch {
    return null;
  }
}

/** The sidebar choice kept on this device; `null` until the user makes one (or if storage is unavailable). */
export function useSidebarPreference(): [boolean | null, (expanded: boolean) => void] {
  const stored = useSyncExternalStore(subscribe, read, () => null);
  const set = useCallback((expanded: boolean) => {
    try {
      window.localStorage.setItem(KEY, String(expanded));
    } catch {
      // Storage blocked: the choice lasts only until reload.
    }
    listeners.forEach((notify) => notify());
  }, []);
  return [stored, set];
}

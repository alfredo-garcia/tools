"use client";
import { useSyncExternalStore } from "react";

/** Breakpoints from ui_standards §4. */
export const MEDIUM_UP = "(min-width: 640px)";

/** True when the media query matches; false on the server and during hydration. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

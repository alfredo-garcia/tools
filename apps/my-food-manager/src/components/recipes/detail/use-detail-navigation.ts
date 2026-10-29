"use client";

import { useCallback, useEffect } from "react";

/** Detail entries the user pushed inside the app; 0 means the detail was opened directly. */
let inAppEntries = 0;

export const detailHref = (recipeId: string) => `/recipes/${encodeURIComponent(recipeId)}`;

/**
 * Recipe id of a `/recipes/<id>` address, undefined for any other path. The detail is a client
 * overlay driven by the address, opened with the History API so no request is needed (offline).
 */
export function recipeIdFromPath(pathname: string): string | undefined {
  const match = /^\/recipes\/([^/]+)\/?$/.exec(pathname);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Opens a recipe detail as a new history entry. */
export function openRecipe(recipeId: string) {
  inAppEntries += 1;
  window.history.pushState(null, "", detailHref(recipeId));
}

/** Closes the detail: one step back inside the app, or the list when opened directly (never leaves the app). */
export function useCloseDetail() {
  useEffect(() => {
    // Any back/forward step (device gesture, button or history.back) consumes one entry.
    const onPop = () => {
      inAppEntries = Math.max(0, inAppEntries - 1);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return useCallback(() => {
    if (inAppEntries > 0) window.history.back();
    else window.history.replaceState(null, "", "/");
  }, []);
}

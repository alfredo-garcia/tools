"use client";

import { useSyncExternalStore } from "react";
import { layoutForWidth, type Layout } from "@/lib/domain/layout";

const subscribe = (notify: () => void) => {
  window.addEventListener("resize", notify);
  return () => window.removeEventListener("resize", notify);
};

/** Current layout by window width; "small" while rendering on the server. */
export function useLayout(): Layout {
  return useSyncExternalStore(
    subscribe,
    () => layoutForWidth(window.innerWidth),
    () => "small",
  );
}

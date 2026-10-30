"use client";

import { useEffect } from "react";
import { useStartSync } from "@/lib/offline/use-library";
import { useStartOutbox } from "@/lib/offline/use-outbox";

/** Mounts the library sync, the outbox of pending changes and the service worker once. */
export function SyncStarter() {
  useStartSync();
  useStartOutbox();
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Without a service worker the app still works online; offline shell is unavailable.
      });
    }
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { useStartSync } from "@/lib/offline/use-library";

/** Mounts the library sync (stored copy, open/interval/reconnect triggers) and the service worker once. */
export function SyncStarter() {
  useStartSync();
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Without a service worker the app still works online; offline shell is unavailable.
      });
    }
  }, []);
  return null;
}

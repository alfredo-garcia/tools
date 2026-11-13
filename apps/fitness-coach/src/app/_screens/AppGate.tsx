"use client";
/**
 * Chooses between the first-open screens and the app (UX Flow §3). With a stored copy the
 * routes render; without one, Welcome (with network) or FirstOpenOffline (without).
 */
import { useState, type ReactNode } from "react";
import { useSync } from "@/lib/sync/provider";
import { FirstOpenOffline } from "./FirstOpenOffline";
import { KeySheet } from "./KeySheet";
import { StorageToast } from "./StorageToast";
import { Welcome } from "./Welcome";

export function AppGate({ children }: { children: ReactNode }) {
  const { state } = useSync();
  const [offlineScreen, setOfflineScreen] = useState<boolean | null>(null);

  if (state.phase === "loading") return null;
  if (state.phase === "no_data") {
    const showOffline = offlineScreen ?? !navigator.onLine;
    return showOffline ? (
      <FirstOpenOffline onRetry={() => setOfflineScreen(!navigator.onLine)} />
    ) : (
      <Welcome onOffline={() => setOfflineScreen(true)} />
    );
  }
  return (
    <>
      {children}
      <KeySheet />
      <StorageToast />
    </>
  );
}

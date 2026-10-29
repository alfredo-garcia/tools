"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, WifiOff } from "lucide-react";
import { timeAgo } from "@/lib/domain/time";
import type { SyncStatus } from "@/lib/offline/store";

/** Re-renders periodically so "hace N min" stays current. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function SyncBadge({ status, syncedAt }: { status: SyncStatus; syncedAt?: string }) {
  const now = useNow();
  const ago = syncedAt ? timeAgo(syncedAt, now) : undefined;

  let tone = "bg-accent-lime/15 text-accent-lime";
  let icon = <Check className="size-3.5" aria-hidden />;
  let label = ago ? `Sincronizado · ${ago}` : "Sincronizado";

  if (status === "syncing") {
    tone = "bg-surface-2 text-text-muted";
    icon = <Loader2 className="size-3.5 animate-spin" aria-hidden />;
    label = "Sincronizando…";
  } else if (status === "offline") {
    tone = "bg-warning-500/20 text-warning-500";
    icon = <WifiOff className="size-3.5" aria-hidden />;
    label = ago ? `Sin conexión · ${ago}` : "Sin conexión";
  } else if (status === "error") {
    tone = "bg-warning-500/20 text-warning-500";
    icon = <AlertTriangle className="size-3.5" aria-hidden />;
    label = "No se pudo sincronizar";
  } else if (!syncedAt) {
    tone = "bg-surface-2 text-text-muted";
    label = "Sin sincronizar";
  }

  return (
    // Polite live region: connection and sync changes are announced to screen readers.
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}
    >
      {icon}
      {label}
    </span>
  );
}

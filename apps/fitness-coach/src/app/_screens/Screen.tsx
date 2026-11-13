"use client";
/** AppFrame + AppShell + SyncBadge, shared by Home, Routines and Exercises (UX Flow 2.3–2.5). */
import type { ReactNode } from "react";
import { SyncBadge } from "@/components/feedback/SyncBadge";
import { AppFrame } from "@/components/layout/AppFrame";
import { AppShell } from "@/components/layout/AppShell";
import type { Destination } from "@/components/navigation/Nav";
import { useSync } from "@/lib/sync/provider";

type Props = { current: Destination; title: string; children: ReactNode };

export function Screen({ current, title, children }: Props) {
  const { state, refresh, setKeySheetOpen } = useSync();
  return (
    <AppFrame current={current}>
      <AppShell
        title={title}
        onRefresh={refresh}
        badge={
          <SyncBadge
            status={state.status}
            syncedAt={state.lastSyncedAt}
            onInvalidKey={() => setKeySheetOpen(true)}
            data-testid="sync-badge"
          />
        }
      >
        {children}
      </AppShell>
    </AppFrame>
  );
}

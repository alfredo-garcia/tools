"use client";
/** UX Flow 2.3: provisional Home (FR-16, FR-17). */
import { TmpSummaryCard } from "@/components/common/TmpSummaryCard";
import { useSync } from "@/lib/sync/provider";
import { Screen } from "./Screen";

export function Home() {
  const { state } = useSync();
  const routines = state.snapshot?.routines ?? [];
  return (
    <Screen current="home" title="My Coach">
      <p className="mb-lg text-display">Hola, Al</p>
      <TmpSummaryCard
        exercises={state.snapshot?.exercises.length ?? 0}
        activeRoutines={routines.filter((r) => r.status === "active").length}
        pausedRoutines={routines.filter((r) => r.status === "paused").length}
        skipped={state.snapshot?.skipped.length ?? 0}
        lastSyncedAt={state.lastSyncedAt}
      />
    </Screen>
  );
}

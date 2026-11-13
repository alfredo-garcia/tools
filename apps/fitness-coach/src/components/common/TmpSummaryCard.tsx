"use client";
// TEMP (fitness-coach/001, UX Flow §5): summary card of the provisional Home. Probably replaced
// by "Hoy te toca" (#2).
import { Info } from "lucide-react";
import { formatAge } from "@/lib/domain/age";
import { useNow } from "@/components/common/useNow";

type Props = {
  exercises: number;
  activeRoutines: number;
  pausedRoutines: number;
  skipped: number;
  lastSyncedAt: string | null;
};

export function TmpSummaryCard({
  exercises,
  activeRoutines,
  pausedRoutines,
  skipped,
  lastSyncedAt,
}: Props) {
  const now = useNow(30_000, [lastSyncedAt]);
  return (
    <section data-testid="summary-card" className="rounded-md bg-surface-1 p-lg shadow-elevation-1">
      <p className="text-heading-2 tabular-nums">
        {exercises} ejercicios · {activeRoutines} rutinas activas
      </p>
      {pausedRoutines > 0 && (
        <p className="mt-xs text-body text-text-muted">
          {pausedRoutines === 1 ? "1 pausada" : `${pausedRoutines} pausadas`}
        </p>
      )}
      {skipped > 0 && (
        <p
          data-testid="skipped-warning"
          className="mt-sm flex items-center gap-xs text-caption text-text-muted"
        >
          <Info aria-hidden className="size-(--icon-sm) shrink-0" />
          {skipped === 1 ? "1 fichero no se pudo leer" : `${skipped} ficheros no se pudieron leer`}
        </p>
      )}
      {lastSyncedAt && (
        <p className="mt-md border-t border-border pt-sm text-caption text-text-muted">
          Actualizado {formatAge(new Date(lastSyncedAt), new Date(now))}
        </p>
      )}
    </section>
  );
}

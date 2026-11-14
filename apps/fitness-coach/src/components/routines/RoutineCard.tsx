import { Clock } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { categoryTint } from "@/components/common/tint";
import { Chip } from "@/components/inputs/Chip";
import { DayChips } from "@/components/routines/DayChips";
import type { Weekday } from "@/lib/domain/routines";

export type RoutineSummary = {
  title: string;
  category: string;
  categoryLabel: string;
  emoji?: string;
  durationMin?: number | null;
  exerciseCount: number;
  days?: readonly Weekday[] | null;
};

type Props = {
  routine: RoutineSummary;
  status?: "pending" | "partial" | "paused";
  /** Only `link` exists so far: the whole card opens the detail (fitness-coach/002). */
  variant: "link";
  onOpen: () => void;
};

/**
 * Kit `RoutineCard` (variant `link`): category chip, title on one line, duration, exercise count
 * and `DayChips`, over the category tint. The brief description is optional and not used yet.
 */
export function RoutineCard({ routine, status, onOpen }: Props) {
  const n = routine.exerciseCount;
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="routine-card"
      style={categoryTint(routine.category)}
      className="flex min-w-0 flex-col items-start gap-sm rounded-md border border-border p-md text-left text-text shadow-elevation-1"
    >
      <span className="flex flex-wrap items-center gap-sm">
        <Chip>
          {routine.emoji && <span aria-hidden>{routine.emoji}</span>}
          {routine.categoryLabel}
        </Chip>
        {status === "paused" && <StatusBadge status="paused" />}
      </span>
      <h3 className="w-full truncate text-heading-2">{routine.title}</h3>
      <span className="flex flex-wrap items-center gap-x-md gap-y-xs text-caption text-text-muted tabular-nums">
        {typeof routine.durationMin === "number" && (
          <span className="inline-flex items-center gap-xs">
            <Clock aria-hidden className="size-(--icon-sm)" />~{routine.durationMin} min
          </span>
        )}
        <span>
          {n} {n === 1 ? "ejercicio" : "ejercicios"}
        </span>
      </span>
      <DayChips days={routine.days} />
    </button>
  );
}

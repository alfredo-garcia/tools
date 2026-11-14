import { Clock, TriangleAlert } from "lucide-react";
import { CollapsibleSection } from "@/components/common/CollapsibleSection";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DoseLabel } from "@/components/exercises/DoseLabel";
import { ExerciseFigure, type Figure } from "@/components/exercises/ExerciseFigure";
import { Chip } from "@/components/inputs/Chip";
import { DayChips } from "@/components/routines/DayChips";
import { routineExerciseCount, type DoseItem } from "@/lib/domain/routines";
import type { Snapshot } from "@/lib/schema/snapshot";

type Routine = Snapshot["routines"][number];
type Exercise = Snapshot["exercises"][number];
type Item = DoseItem & {
  variant?: string | null;
  resistance?: string | null;
  note?: string | null;
  missing_exercise?: boolean;
};
type Block = {
  id: string;
  label?: string | null;
  note?: string | null;
  duration_min?: number | null;
  items: Item[];
};
type Labels = Record<string, { label: string }> | undefined;

type Props = {
  routine: Routine;
  exercises: ReadonlyMap<string, Exercise>;
  categories: Labels;
  resistances: Labels;
  emoji?: string;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

function variantLabel(exercise: Exercise | undefined, variant: string): string {
  const variants = (exercise as { variants?: Record<string, { label?: unknown }> } | undefined)
    ?.variants;
  return str(variants?.[variant]?.label) ?? variant;
}

/**
 * Kit `RoutineDetail`: header, one open `CollapsibleSection` per block with its exercise rows, and
 * "Pautas" / "Progresión" folded at the end. Rows are not interactive in fitness-coach/002.
 */
export function RoutineDetail({ routine, exercises, categories, resistances, emoji }: Props) {
  const r = routine as Routine & { duration_min?: number | null; rest?: number | null };
  const n = routineExerciseCount(routine);
  const blocks = routine.blocks as unknown as Block[];
  return (
    <div className="flex flex-col gap-md">
      <header className="flex flex-col gap-2.5">
        <span className="flex flex-wrap items-center gap-sm">
          <Chip>
            {emoji && <span aria-hidden>{emoji}</span>}
            {categories?.[routine.category]?.label ?? routine.category}
          </Chip>
          {routine.status === "paused" && <StatusBadge status="paused" />}
        </span>
        <h1 className="text-heading-1">{routine.title}</h1>
        <span className="flex flex-wrap items-center gap-x-md gap-y-xs text-caption text-text-muted tabular-nums">
          {typeof r.duration_min === "number" && (
            <span className="inline-flex items-center gap-xs">
              <Clock aria-hidden className="size-(--icon-sm)" />~{r.duration_min} min
            </span>
          )}
          <span>
            {n} {n === 1 ? "ejercicio" : "ejercicios"}
          </span>
        </span>
        <DayChips days={routine.days} />
      </header>

      <div>
        {blocks.map((b) => (
          <CollapsibleSection
            key={b.id}
            defaultOpen
            data-testid={`block-section-${b.id}`}
            title={<span className="text-block-label uppercase">{str(b.label) ?? b.id}</span>}
            subtitle={
              typeof b.duration_min === "number" ? (
                <span className="text-caption text-text-muted tabular-nums">
                  {b.duration_min} min
                </span>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-sm">
              {str(b.note) && <p className="mb-xs text-caption text-text-muted">{b.note}</p>}
              {b.items.length === 0 && <p className="text-caption text-text-muted">0 ejercicios</p>}
              {b.items.map((item, i) => {
                const exercise = item.missing_exercise ? undefined : exercises.get(item.ex);
                const extra = [
                  str(item.variant) && variantLabel(exercise, item.variant!),
                  str(item.resistance) &&
                    (resistances?.[item.resistance!]?.label ?? item.resistance),
                ].filter(Boolean);
                return (
                  <div
                    key={`${item.ex}-${i}`}
                    data-testid="exercise-row"
                    className="flex min-h-16 items-start gap-3 rounded-sm border border-border bg-surface-1 p-3"
                  >
                    <ExerciseFigure
                      figure={(exercise as { figure?: Figure } | undefined)?.figure}
                      pose="end"
                      region={exercise?.region}
                      size="sm"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-label">{exercise?.title ?? item.ex}</span>
                      {!exercise && (
                        <span className="flex items-center gap-xs text-caption text-text-muted">
                          <TriangleAlert
                            aria-hidden
                            className="size-(--icon-sm) text-warning-500"
                          />
                          Ejercicio no encontrado
                        </span>
                      )}
                      <DoseLabel
                        item={item}
                        exercise={exercise as { laterality?: string } | undefined}
                        routineRest={r.rest}
                      />
                      {extra.length > 0 && (
                        <span className="text-caption text-text-muted">{extra.join(" · ")}</span>
                      )}
                      {str(item.note) && (
                        <span className="text-caption text-text-muted">{item.note}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        ))}
        {str(routine.sections.guidelines) && (
          <CollapsibleSection
            data-testid="guidelines-section"
            title={<span className="text-heading-2">Pautas</span>}
          >
            <p className="text-caption leading-normal whitespace-pre-line text-text-muted">
              {routine.sections.guidelines}
            </p>
          </CollapsibleSection>
        )}
        {str(routine.sections.progression) && (
          <CollapsibleSection
            data-testid="progression-section"
            title={<span className="text-heading-2">Progresión</span>}
          >
            <p className="text-caption leading-normal whitespace-pre-line text-text-muted">
              {routine.sections.progression}
            </p>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

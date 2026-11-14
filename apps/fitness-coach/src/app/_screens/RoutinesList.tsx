"use client";
/** UX Flow 002 2.1: Rutinas (PRD 002 FR-1, FR-2, FR-3). */
import { ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";
import { CATEGORY_EMOJI } from "@/components/common/tint";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { FilterChip } from "@/components/inputs/FilterChip";
import { FilterOptions } from "@/components/inputs/FilterOptions";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { RoutineCard } from "@/components/routines/RoutineCard";
import {
  DAY_INITIALS,
  filterCounts,
  groupRoutines,
  routineExerciseCount,
  type DayFilter,
  type RoutineFilters,
} from "@/lib/domain/routines";
import { WEEKDAYS } from "@/lib/schema/kb";
import type { Snapshot } from "@/lib/schema/snapshot";
import { useSync } from "@/lib/sync/provider";
import { Screen } from "./Screen";
import { routinesUi } from "./routinesUi";

type Routine = Snapshot["routines"][number];

const DAY_NAMES: Record<(typeof WEEKDAYS)[number], string> = {
  mon: "lunes",
  tue: "martes",
  wed: "miércoles",
  thu: "jueves",
  fri: "viernes",
  sat: "sábado",
  sun: "domingo",
};

type Props = {
  /** Drawn behind the detail modal (from 640 px): inert, and it does not consume the scroll. */
  background?: boolean;
};

export function RoutinesList({ background = false }: Props) {
  const router = useRouter();
  const { state } = useSync();
  const routines = useMemo(() => state.snapshot?.routines ?? [], [state.snapshot]);
  const categories = state.snapshot?.vocabularies.categories;
  const [filters, setFiltersState] = useState<RoutineFilters>(routinesUi.filters);

  const setFilters = (next: RoutineFilters) => {
    routinesUi.setFilters(next);
    setFiltersState(next);
  };

  // Back from the detail: same scroll as before (AC-15)
  useLayoutEffect(() => {
    const y = background ? routinesUi.peekScroll() : routinesUi.takeScroll();
    if (y === null) return;
    window.scrollTo(0, y);
    const raf = requestAnimationFrame(() => window.scrollTo(0, y));
    return () => cancelAnimationFrame(raf);
  }, [background]);

  const { active, paused } = useMemo(() => groupRoutines(routines, filters), [routines, filters]);
  const counts = useMemo(() => filterCounts(routines, filters), [routines, filters]);

  const open = (r: Routine) => {
    routinesUi.saveScroll(window.scrollY);
    routinesUi.select(r.id);
    router.push("/routines/detail", { scroll: false });
  };

  const card = (r: Routine) => (
    <RoutineCard
      key={r.id}
      variant="link"
      status={r.status === "paused" ? "paused" : undefined}
      onOpen={() => open(r)}
      routine={{
        title: r.title,
        category: r.category,
        categoryLabel: categories?.[r.category]?.label ?? r.category,
        emoji: categories?.[r.category] ? CATEGORY_EMOJI[r.category] : undefined,
        durationMin: (r as { duration_min?: number | null }).duration_min,
        exerciseCount: routineExerciseCount(r),
        days: r.days,
      }}
    />
  );

  return (
    <div inert={background} aria-hidden={background || undefined}>
      <Screen current="routines" title="Rutinas">
        {routines.length === 0 ? (
          <EmptyState icon={ListChecks} title="Todavía no hay rutinas" />
        ) : (
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-3">
              <FilterOptions label="Día">
                {(["all", ...WEEKDAYS] as DayFilter[]).map((d) => (
                  <FilterChip
                    key={d}
                    selected={filters.day === d}
                    onSelect={() => setFilters({ ...filters, day: d })}
                    count={counts.day[d]}
                    aria-label={d === "all" ? "Todos los días" : DAY_NAMES[d]}
                    data-testid={`day-filter-${d}`}
                  >
                    {d === "all" ? "Todos" : DAY_INITIALS[d]}
                  </FilterChip>
                ))}
              </FilterOptions>
              <FilterOptions label="Tipo">
                {Object.keys(counts.type).map((t) => (
                  <FilterChip
                    key={t}
                    selected={filters.type === t}
                    onSelect={() => setFilters({ ...filters, type: t })}
                    count={counts.type[t]}
                    data-testid={`type-filter-${t}`}
                  >
                    {t === "all"
                      ? "Todos"
                      : categories?.[t]
                        ? `${CATEGORY_EMOJI[t] ?? ""} ${categories[t].label}`.trim()
                        : t}
                  </FilterChip>
                ))}
              </FilterOptions>
            </div>

            {active.length === 0 && paused.length === 0 && (
              <EmptyState
                icon={ListChecks}
                title="Ninguna rutina con estos filtros"
                action={
                  <Button
                    variant="secondary"
                    onClick={() => setFilters({ day: "all", type: "all" })}
                    data-testid="clear-filters-button"
                  >
                    Quitar filtros
                  </Button>
                }
              />
            )}

            {active.length > 0 && (
              <div className="grid grid-cols-1 gap-3 medium:grid-cols-2">{active.map(card)}</div>
            )}

            {paused.length > 0 && (
              <div className="flex flex-col gap-3 pt-sm">
                <SectionHeader title="Pausadas" />
                <div className="grid grid-cols-1 gap-3 medium:grid-cols-2">{paused.map(card)}</div>
              </div>
            )}
          </div>
        )}
      </Screen>
    </div>
  );
}

/**
 * Pure logic of "Mis rutinas" (PRD 002 FR-2, FR-3, FR-5; UX Flow 002 2.1, 2.2). No React, no I/O.
 */
import { WEEKDAYS } from "@/lib/schema/kb";

export type Weekday = (typeof WEEKDAYS)[number];

export type DoseItem = {
  ex: string;
  sets?: number | null;
  reps?: number | null;
  time?: number | null;
  hold?: number | null;
  duration_min?: number | null;
  rest?: number | null;
};

/** The fields of a snapshot routine this module reads. */
export type RoutineLike = {
  id: string;
  title: string;
  category: string;
  status: "active" | "paused";
  days?: readonly Weekday[] | null;
  blocks: readonly { id: string; items: readonly { ex: string }[] }[];
};

export type DayFilter = "all" | Weekday;
export type RoutineFilters = { day: DayFilter; type: string };

/** Spanish initials, Monday first (ui_kit_registry `DayChips`). */
export const DAY_INITIALS: Record<Weekday, string> = {
  mon: "L",
  tue: "M",
  wed: "X",
  thu: "J",
  fri: "V",
  sat: "S",
  sun: "D",
};

export function routineExerciseCount(routine: RoutineLike): number {
  return routine.blocks.reduce((n, b) => n + b.items.length, 0);
}

function firstDay(routine: RoutineLike): number {
  const idx = (routine.days ?? []).map((d) => WEEKDAYS.indexOf(d)).filter((i) => i >= 0);
  return idx.length > 0 ? Math.min(...idx) : WEEKDAYS.length;
}

/** First weekday of the routine (Monday first; no fixed day last), then title in Spanish. */
export function sortRoutines<R extends RoutineLike>(list: readonly R[]): R[] {
  return [...list].sort(
    (a, b) => firstDay(a) - firstDay(b) || a.title.localeCompare(b.title, "es"),
  );
}

function matches(routine: RoutineLike, { day, type }: RoutineFilters): boolean {
  const okDay = day === "all" || (routine.days ?? []).includes(day);
  const okType = type === "all" || routine.category === type;
  return okDay && okType;
}

/** Routines that pass both filters (AND), sorted, split into active and paused (FR-1, FR-3). */
export function groupRoutines<R extends RoutineLike>(
  list: readonly R[],
  filters: RoutineFilters,
): { active: R[]; paused: R[] } {
  const shown = sortRoutines(list.filter((r) => matches(r, filters)));
  return {
    active: shown.filter((r) => r.status === "active"),
    paused: shown.filter((r) => r.status === "paused"),
  };
}

/**
 * How many routines each filter option would leave, with the other filter as it is. `type` lists
 * only the categories some routine has, in first-seen order of the sorted list (FR-3).
 */
export function filterCounts(
  list: readonly RoutineLike[],
  filters: RoutineFilters,
): { day: Record<DayFilter, number>; type: Record<string, number> } {
  const count = (f: RoutineFilters) => list.filter((r) => matches(r, f)).length;
  const day = { all: count({ ...filters, day: "all" }) } as Record<DayFilter, number>;
  for (const d of WEEKDAYS) day[d] = count({ ...filters, day: d });
  const type: Record<string, number> = { all: count({ ...filters, type: "all" }) };
  for (const r of list) {
    if (!(r.category in type)) type[r.category] = count({ ...filters, type: r.category });
  }
  return { day, type };
}

/** Accessible name of `DayChips`: "Días: L · J", or "Sin día fijo". */
export function daysAria(days: readonly Weekday[] | null | undefined): string {
  const set = new Set(days ?? []);
  const initials = WEEKDAYS.filter((d) => set.has(d)).map((d) => DAY_INITIALS[d]);
  return initials.length > 0 ? `Días: ${initials.join(" · ")}` : "Sin día fijo";
}

const has = (n: number | null | undefined): n is number => typeof n === "number";

/**
 * Compact dose (ui_kit_registry `DoseLabel`): "3 × 12", "2 × 30 s", "aguantar 20 s", "10 min",
 * "3 × 10 · aguanta 10 s", "3 × 70 s por lado", plus " · descanso N s" (the item's rest, else the
 * routine's).
 */
export function formatDose(
  item: DoseItem,
  routineRest?: number | null,
  laterality?: string | null,
): string {
  const side = laterality === "unilateral" ? " por lado" : "";
  const sets = has(item.sets) ? `${item.sets} × ` : "";
  let main = "";
  if (has(item.reps)) {
    main = `${sets}${item.reps}${side}`;
    if (has(item.hold)) main += ` · aguanta ${item.hold} s`;
  } else if (has(item.time)) {
    main = `${sets}${item.time} s${side}`;
  } else if (has(item.hold)) {
    main = `${sets}aguantar ${item.hold} s${side}`;
  } else if (has(item.duration_min)) {
    main = `${item.duration_min} min`;
  } else if (has(item.sets)) {
    main = `${item.sets} series`;
  }
  if (!main) return "";
  const rest = has(item.rest) ? item.rest : routineRest;
  return has(rest) ? `${main} · descanso ${rest} s` : main;
}

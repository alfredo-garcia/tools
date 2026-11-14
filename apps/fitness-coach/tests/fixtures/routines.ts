/**
 * [fitness-coach/002] Synthetic snapshot with varied routines for the "Mis rutinas" e2e tests.
 * Built on `makeSnapshot` (fixtures/snapshot.ts). Never real data.
 */
import { makeSnapshot, type SnapshotDoc } from "./snapshot";

const STAMP = "2026-10-01T10:00:00-05:00";

type Item = Record<string, unknown> & { ex: string };
type Block = Record<string, unknown> & { id: string; items: Item[] };

export function routine(
  id: string,
  fields: {
    title: string;
    category: string;
    days?: string[];
    status?: "active" | "paused";
    duration_min?: number;
    rest?: number;
    blocks: Block[];
    sections?: { guidelines?: string; progression?: string };
  },
) {
  return {
    id,
    domain: "routines",
    created: STAMP,
    updated: STAMP,
    user: "al",
    status: fields.status ?? "active",
    title: fields.title,
    category: fields.category,
    ...(fields.days ? { days: fields.days } : {}),
    ...(fields.duration_min !== undefined ? { duration_min: fields.duration_min } : {}),
    ...(fields.rest !== undefined ? { rest: fields.rest } : {}),
    blocks: fields.blocks,
    sections: fields.sections ?? {},
  };
}

function exercise(id: string, title: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    domain: "exercises",
    created: STAMP,
    updated: STAMP,
    title,
    region: "lower-body",
    zones: [],
    muscles: { primary: [], secondary: [] },
    goals: ["strength"],
    measure: "reps",
    laterality: "bilateral",
    equipment: [],
    stresses: [],
    sections: { execution: "Texto inventado." },
    ...extra,
  };
}

const items = (n: number, prefix: string): Item[] =>
  Array.from({ length: n }, (_, i) => ({ ex: `${prefix}-${i + 1}`, sets: 2, reps: 10 }));

/** Exercises referenced by the generic routines below. */
function genericExercises() {
  const out = [];
  for (const prefix of ["pierna", "nado", "core", "express", "bici"]) {
    for (let i = 1; i <= 8; i++) out.push(exercise(`${prefix}-${i}`, `Ejercicio ${prefix} ${i}`));
  }
  return out;
}

/**
 * Four active routines and one paused (as in the prototype). Listed order (FR-2): Fuerza de
 * pierna, Natación técnica (both Monday, by title), Esterilla de core, Express; then Cardio.
 * - Natación técnica · swim-day · L X V · ~60 min · 6 ejercicios
 * - Fuerza de pierna · strength · L J · ~40 min · 7 ejercicios (2 bloques: 3 + 4)
 * - Esterilla de core · mobility · M J S · ~25 min · 8 ejercicios
 * - Express de 10 minutos · express · sin días · sin duración · 4 ejercicios
 * - Cardio suave en bici · cardio · M S · ~30 min · 3 ejercicios · pausada
 */
export function routinesSnapshot(): SnapshotDoc {
  const base = makeSnapshot({ exercises: 0, activeRoutines: 0, pausedRoutines: 0 });
  const routines = [
    routine("natacion-tecnica", {
      title: "Natación técnica",
      category: "swim-day",
      days: ["mon", "wed", "fri"],
      duration_min: 60,
      blocks: [{ id: "pool", items: items(6, "nado") }],
    }),
    routine("fuerza-pierna", {
      title: "Fuerza de pierna",
      category: "strength",
      days: ["mon", "thu"],
      duration_min: 40,
      blocks: [
        { id: "warm-up", items: items(3, "pierna") },
        { id: "strength", items: items(4, "core") },
      ],
    }),
    routine("esterilla-core", {
      title: "Esterilla de core",
      category: "mobility",
      days: ["tue", "thu", "sat"],
      duration_min: 25,
      blocks: [{ id: "mat", items: items(8, "core") }],
    }),
    routine("express-10", {
      title: "Express de 10 minutos",
      category: "express",
      blocks: [{ id: "main", items: items(4, "express") }],
    }),
    routine("cardio-bici", {
      title: "Cardio suave en bici",
      category: "cardio",
      status: "paused",
      days: ["tue", "sat"],
      duration_min: 30,
      blocks: [{ id: "bike", items: items(3, "bici") }],
    }),
  ];
  return {
    ...base,
    exercises: genericExercises() as unknown as SnapshotDoc["exercises"],
    routines: routines as unknown as SnapshotDoc["routines"],
    vocabularies: {
      ...(base.vocabularies as Record<string, unknown>),
      categories: {
        "swim-day": { label: "Natación" },
        strength: { label: "Fuerza" },
        mobility: { label: "Movilidad" },
        express: { label: "Express" },
        cardio: { label: "Cardio" },
      },
    } as unknown as SnapshotDoc["vocabularies"],
  };
}

/**
 * One routine whose detail exercises every dose format, a variant, a resistance, an unknown
 * variant, a missing exercise, block label / note / duration, and both sections.
 */
export function detailSnapshot(
  opts: { sections?: boolean; extraBlocks?: number } = {},
): SnapshotDoc {
  const base = routinesSnapshot();
  const { sections = true, extraBlocks = 0 } = opts;
  const detail = routine("detalle", {
    title: "Rutina de detalle",
    category: "strength",
    days: ["mon", "thu"],
    duration_min: 40,
    blocks: [
      {
        id: "warm-up",
        label: "Calentamiento",
        note: "Sin prisa.",
        duration_min: 8,
        items: [
          { ex: "sentadilla", sets: 3, reps: 12 },
          { ex: "movilidad", sets: 2, time: 30 },
          { ex: "plancha", hold: 20 },
          { ex: "bici-estatica", duration_min: 10 },
        ],
      },
      {
        id: "strength",
        items: [
          { ex: "patada", sets: 3, reps: 12, variant: "rodillas", resistance: "green" },
          { ex: "patada", sets: 2, reps: 8, variant: "inventada", resistance: "morada" },
          { ex: "plancha-lateral", sets: 2, time: 30, missing_exercise: true },
        ],
      },
      ...Array.from({ length: extraBlocks }, (_, i) => ({
        id: `extra-${i + 1}`,
        label: `Bloque extra ${i + 1}`,
        items: [{ ex: "sentadilla", sets: 2, reps: 10 }],
      })),
    ],
    sections: sections
      ? { guidelines: "Pauta inventada.", progression: "Progresión inventada." }
      : {},
  });
  return {
    ...base,
    exercises: [
      ...base.exercises,
      exercise("sentadilla", "Sentadilla a caja"),
      exercise("movilidad", "Movilidad de cadera", { measure: "time" }),
      exercise("plancha", "Plancha", { measure: "time", region: "core" }),
      exercise("bici-estatica", "Bici estática", { measure: "duration", region: "full-body" }),
      exercise("patada", "Patada de glúteo", {
        variants: { rodillas: { label: "Rodillas" } },
      }),
    ] as unknown as SnapshotDoc["exercises"],
    routines: [...base.routines, detail] as unknown as SnapshotDoc["routines"],
    vocabularies: {
      ...base.vocabularies,
      resistances: { green: { label: "banda verde" } },
    } as unknown as SnapshotDoc["vocabularies"],
  };
}

/** Many active routines, so the list scrolls (AC-15). */
export function longListSnapshot(n = 14): SnapshotDoc {
  const base = routinesSnapshot();
  const more = Array.from({ length: n }, (_, i) =>
    routine(`relleno-${String(i + 1).padStart(2, "0")}`, {
      title: `Rutina de relleno ${String(i + 1).padStart(2, "0")}`,
      category: "strength",
      days: ["sun"],
      blocks: [{ id: "main", items: items(1, "pierna") }],
    }),
  );
  return {
    ...base,
    routines: [...base.routines, ...more] as unknown as SnapshotDoc["routines"],
  };
}

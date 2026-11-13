/**
 * Synthetic `Snapshot` documents (PRD §7) for e2e tests, where `/api/snapshot` is mocked.
 * Objects carry the fields that schema.md marks as required, so a client that validates the
 * snapshot accepts them. Never real data.
 */

type Opts = {
  exercises?: number;
  activeRoutines?: number;
  pausedRoutines?: number;
  skipped?: { path: string; reason: "parse_error" | "schema_error" }[];
  generatedAt?: string;
};

export function makeSnapshot(opts: Opts = {}) {
  const {
    exercises = 29,
    activeRoutines = 7,
    pausedRoutines = 1,
    skipped = [],
    generatedAt = "2026-11-12T12:00:00-05:00",
  } = opts;

  const exerciseList = Array.from({ length: exercises }, (_, i) => ({
    id: `ejercicio-${i + 1}`,
    domain: "exercises",
    created: "2026-10-01T10:00:00-05:00",
    updated: "2026-10-01T10:00:00-05:00",
    title: `Ejercicio ${i + 1}`,
    region: "core",
    zones: ["abdomen"],
    muscles: { primary: ["rectus-abdominis"], secondary: [] },
    goals: ["stability"],
    measure: "reps",
    laterality: "bilateral",
    level: "beginner",
    equipment: [],
    stresses: [],
    sections: { execution: "Texto inventado." },
  }));

  const routine = (i: number, status: "active" | "paused") => ({
    id: `rutina-${status}-${i + 1}`,
    domain: "routines",
    created: "2026-10-01T10:00:00-05:00",
    updated: "2026-10-01T10:00:00-05:00",
    title: `Rutina ${status} ${i + 1}`,
    category: "strength",
    days: ["mon"],
    user: "al",
    status,
    blocks: [{ id: "strength", items: [{ ex: "ejercicio-1", sets: 3, reps: 10 }] }],
    sections: { guidelines: "Pauta inventada." },
  });

  return {
    format: 1,
    generated_at: generatedAt,
    exercises: exerciseList,
    routines: [
      ...Array.from({ length: activeRoutines }, (_, i) => routine(i, "active")),
      ...Array.from({ length: pausedRoutines }, (_, i) => routine(i, "paused")),
    ],
    program: {
      phase: { label: "Fase inventada", since: "2026-10-01", goal: "Objetivo inventado" },
      constraints: { avoid_stresses: [], avoid_text: [], rules: [] },
      schedule: { sessions_per_week: [3, 5], week: { mon: ["rutina-active-1"] } },
    },
    sessions: [],
    vocabularies: {
      regions: { core: { label: "Core" } },
      zones: { abdomen: { label: "Abdomen" } },
      muscles: { "rectus-abdominis": { label: "Recto abdominal" } },
      goals: { stability: { label: "Estabilidad" } },
      patterns: {},
      positions: {},
      equipment: {},
      resistances: {},
      stresses: {},
      levels: { beginner: { label: "Inicial" } },
      categories: { strength: { label: "Fuerza" } },
    },
    skipped,
  };
}

export type SnapshotDoc = ReturnType<typeof makeSnapshot>;

/**
 * [fitness-coach/001] Snapshot construction (FR-2, FR-3, FR-4; AC-15, AC-16 server side).
 *
 * Seam required from the implementation (test contract, see tests/README.md):
 *   src/lib/drive/snapshot.ts
 *     export function buildSnapshot(files: { path: string; content: string }[], now: Date): Snapshot
 *   `path` is relative to the `fitness` folder; `Snapshot` is PRD §7.
 */
process.env.TZ = "America/Bogota";

import { describe, expect, it } from "vitest";
import { buildSnapshot } from "@/lib/drive/snapshot";
import {
  BROKEN_YAML_ROUTINE,
  HEALTH_MARKERS,
  NOW,
  SCHEMA_INVALID_ROUTINE,
  kbFiles,
  programFile,
  withFile,
} from "../fixtures/kb";

const ids = (xs: { id: string }[]) => xs.map((x) => x.id).sort();

describe("[fitness-coach/001] buildSnapshot", () => {
  it("[fitness-coach/001] FR-2: format 1, generated_at and every exercise", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    expect(s.format).toBe(1);
    expect(typeof s.generated_at).toBe("string");
    expect(Number.isNaN(Date.parse(s.generated_at))).toBe(false);
    expect(ids(s.exercises)).toEqual([
      "plancha-sintetica",
      "remo-sintetico",
      "sentadilla-sintetica",
    ]);
    expect(s.skipped).toEqual([]);
  });

  it("[fitness-coach/001] FR-2: only active and paused routines; draft and archived are left out", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    expect(ids(s.routines)).toEqual([
      "expres-sintetica",
      "fuerza-sintetica",
      "movilidad-sintetica",
    ]);
  });

  it("[fitness-coach/001] FR-2: exercise sections are extracted from the Markdown body", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    const plancha = s.exercises.find((e: { id: string }) => e.id === "plancha-sintetica")!;
    expect(plancha.sections.execution).toContain("Texto de ejecución inventado.");
    expect(plancha.sections.common_mistakes).toContain("Error inventado.");
    expect(plancha.sections.progression).toContain("Progresión inventada.");
    expect(plancha.sections.notes).toContain("Nota inventada.");
  });

  it("[fitness-coach/001] FR-2 / PRD §7: unknown frontmatter fields are kept as they are", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    const plancha = s.exercises.find((e: { id: string }) => e.id === "plancha-sintetica")!;
    expect(plancha.custom_unknown_field).toBe("conservar");
  });

  it("[fitness-coach/001] PRD §7: routine sections include guidelines and progression, never History", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    const fuerza = s.routines.find((r: { id: string }) => r.id === "fuerza-sintetica")!;
    expect(fuerza.sections.guidelines).toContain("Pauta inventada.");
    expect(fuerza.sections.progression).toContain("Progresión inventada.");
    expect(JSON.stringify(s)).not.toContain(HEALTH_MARKERS.routineHistory);
  });

  it("[fitness-coach/001] PRD §7: an item pointing to a missing exercise is kept with missing_exercise: true", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    const expres = s.routines.find((r: { id: string }) => r.id === "expres-sintetica")!;
    const items = expres.blocks[0].items;
    expect(items).toHaveLength(2);
    expect(items[0].missing_exercise ?? false).toBe(false);
    expect(items[1]).toMatchObject({ ex: "ejercicio-que-no-existe", missing_exercise: true });
  });

  it("[fitness-coach/001] FR-3: program has phase, constraints and schedule, never journal", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    expect(s.program!.phase.label).toBe("Fase sintética");
    expect(s.program!.constraints.avoid_stresses).toEqual(["spinal-flexion"]);
    expect(s.program!.schedule.week.mon).toEqual(["fuerza-sintetica"]);
    expect(s.program).not.toHaveProperty("journal");
    expect(JSON.stringify(s)).not.toContain(HEALTH_MARKERS.journalText);
  });

  it("[fitness-coach/001] FR-1: sessions of the last 14 days only (boundary included)", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    expect(s.sessions.map((x: { date: string }) => x.date)).toEqual(["2026-10-29", "2026-11-09"]);
  });

  it("[fitness-coach/001] FR-2: every vocabulary, keyed by id, with its label", () => {
    const s = buildSnapshot(kbFiles(), NOW);
    expect(Object.keys(s.vocabularies).sort()).toEqual(
      [
        "categories",
        "equipment",
        "goals",
        "levels",
        "muscles",
        "patterns",
        "positions",
        "regions",
        "resistances",
        "stresses",
        "zones",
      ].sort(),
    );
    expect(s.vocabularies.regions!.core.label).toBe("Core");
    expect(s.vocabularies.categories!.strength.label).toBe("Fuerza");
  });

  it("[fitness-coach/001] FR-4: an empty sessions file gives sessions: [] without error", () => {
    const files = withFile(kbFiles(), "sessions/al.yaml", "# only comments\nuser: al\nsessions:\n");
    const s = buildSnapshot(files, NOW);
    expect(s.sessions).toEqual([]);
    expect(s.skipped).toEqual([]);
  });

  it("[fitness-coach/001] AC-15: a routine with broken YAML is skipped as parse_error, without its content", () => {
    const s = buildSnapshot([...kbFiles(), BROKEN_YAML_ROUTINE], NOW);
    expect(s.skipped).toEqual([{ path: BROKEN_YAML_ROUTINE.path, reason: "parse_error" }]);
    expect(ids(s.routines)).toEqual([
      "expres-sintetica",
      "fuerza-sintetica",
      "movilidad-sintetica",
    ]);
    expect(JSON.stringify(s)).not.toContain(HEALTH_MARKERS.brokenRoutineTitle);
  });

  it("[fitness-coach/001] AC-15: a routine that breaks the schema is skipped as schema_error; the rest is kept", () => {
    const s = buildSnapshot([...kbFiles(), SCHEMA_INVALID_ROUTINE], NOW);
    expect(s.skipped).toEqual([{ path: SCHEMA_INVALID_ROUTINE.path, reason: "schema_error" }]);
    expect(s.exercises).toHaveLength(3);
    expect(s.routines).toHaveLength(3);
    expect(JSON.stringify(s)).not.toContain(HEALTH_MARKERS.brokenRoutineTitle);
  });

  it("[fitness-coach/001] AC-16: an unreadable program gives program: null and counts 1 skipped file", () => {
    const files = withFile(kbFiles(), programFile.path, "phase: [roto\n");
    const s = buildSnapshot(files, NOW);
    expect(s.program).toBeNull();
    expect(s.skipped).toEqual([{ path: "program/al.yaml", reason: "parse_error" }]);
    expect(s.exercises).toHaveLength(3);
    expect(s.routines).toHaveLength(3);
  });

  it("[fitness-coach/001] PRD §10: a missing program file gives program: null and counts as skipped", () => {
    const files = withFile(kbFiles(), programFile.path, null);
    const s = buildSnapshot(files, NOW);
    expect(s.program).toBeNull();
    expect(s.skipped).toHaveLength(1);
    expect(s.skipped[0].path).toBe("program/al.yaml");
  });

  it("[fitness-coach/001] PRD §10: no active routines is not an error", () => {
    const files = kbFiles().filter(
      (f) => !f.path.startsWith("routines/items/") || f.content.includes("status: draft"),
    );
    const s = buildSnapshot(files, NOW);
    expect(s.routines).toEqual([]);
    expect(s.skipped).toEqual([]);
  });
});

/**
 * Builds the snapshot (PRD §7) from the files of the `fitness` folder. Pure: no Drive, no logs.
 * A file that can't be parsed or breaks the schema is left out and listed in `skipped` with its
 * path and a reason code only, never its content (FR-4).
 */
import { parse } from "yaml";
import type { z } from "zod";
import {
  exerciseFrontmatterSchema,
  programSchema,
  routineFrontmatterSchema,
  sessionsFileSchema,
  vocabularySchema,
  WEEKDAYS,
} from "@/lib/schema/kb";
import {
  PROGRAM_FILE,
  SESSIONS_FILE,
  SNAPSHOT_FORMAT,
  VOCABULARY_FILES,
  type Exercise,
  type ExerciseSections,
  type Program,
  type Routine,
  type RoutineSections,
  type Session,
  type Skipped,
  type Snapshot,
  type VocabularyName,
} from "@/lib/schema/snapshot";
import { splitItem } from "./markdown";

export type KbFile = { path: string; content: string };

/** Sessions of the last N days are included (date >= today - N, local day). */
export const SESSION_WINDOW_DAYS = 14;

const EXERCISE_SECTIONS: Record<string, keyof ExerciseSections> = {
  Execution: "execution",
  "Common mistakes": "common_mistakes",
  Progression: "progression",
  Notes: "notes",
};
/** `## History` is deliberately absent: it never leaves the server. */
const ROUTINE_SECTIONS: Record<string, keyof RoutineSections> = {
  Guidelines: "guidelines",
  Progression: "progression",
};

type Result<T> = { ok: true; value: T } | { ok: false; reason: Skipped["reason"] };

function parseYaml(text: string): Result<unknown> {
  try {
    return { ok: true, value: parse(text) };
  } catch {
    return { ok: false, reason: "parse_error" };
  }
}

function validate<S extends z.ZodType>(schema: S, value: unknown): Result<z.infer<S>> {
  const r = schema.safeParse(value);
  return r.success ? { ok: true, value: r.data } : { ok: false, reason: "schema_error" };
}

function pickSections<K extends string>(
  sections: Map<string, string>,
  map: Record<string, K>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const [heading, key] of Object.entries(map)) {
    const text = sections.get(heading);
    if (text !== undefined) out[key] = text;
  }
  return out;
}

function readItem<S extends z.ZodType>(
  content: string,
  schema: S,
): Result<{ fm: z.infer<S>; sections: Map<string, string> }> {
  const split = splitItem(content);
  if (!split) return { ok: false, reason: "parse_error" };
  const yaml = parseYaml(split.frontmatter);
  if (!yaml.ok) return yaml;
  const fm = validate(schema, yaml.value);
  if (!fm.ok) return fm;
  return { ok: true, value: { fm: fm.value, sections: split.sections } };
}

/**
 * Local calendar date (YYYY-MM-DD) of `d` shifted by `days`. On Vercel the local zone is UTC, so
 * the 14-day cutoff can be one day off from Bogotá in the evening; harmless for this window.
 */
function localDate(d: Date, days = 0): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function buildSnapshot(files: KbFile[], now: Date): Snapshot {
  const skipped: Skipped[] = [];
  const byPath = new Map(files.map((f) => [f.path, f.content]));
  const skip = (path: string, reason: Skipped["reason"]) => skipped.push({ path, reason });

  // Exercises
  const exercises: Exercise[] = [];
  for (const f of files) {
    if (!/^exercises\/items\/[^/]+\/[^/]+\.md$/.test(f.path)) continue;
    const r = readItem(f.content, exerciseFrontmatterSchema);
    if (!r.ok) {
      skip(f.path, r.reason);
      continue;
    }
    const sections = pickSections(r.value.sections, EXERCISE_SECTIONS);
    if (sections.execution === undefined) {
      skip(f.path, "schema_error"); // `## Execution` is required by exercises 1
      continue;
    }
    exercises.push({ ...r.value.fm, sections: sections as ExerciseSections });
  }
  const exerciseIds = new Set(exercises.map((e) => e.id));

  // Routines: only active and paused
  const routines: Routine[] = [];
  for (const f of files) {
    if (!/^routines\/items\/[^/]+\/[^/]+\.md$/.test(f.path)) continue;
    // draft and archived routines are never shown, so they never count as skipped either
    if (/^status:[ \t]*["']?(draft|archived)\b/m.test(splitItem(f.content)?.frontmatter ?? "")) {
      continue;
    }
    const r = readItem(f.content, routineFrontmatterSchema);
    if (!r.ok) {
      skip(f.path, r.reason);
      continue;
    }
    const { fm } = r.value;
    if (fm.status !== "active" && fm.status !== "paused") continue;
    routines.push({
      ...fm,
      status: fm.status,
      blocks: fm.blocks.map((b) => ({
        ...b,
        items: b.items.map((it) =>
          exerciseIds.has(it.ex) ? it : { ...it, missing_exercise: true },
        ),
      })),
      sections: pickSections(r.value.sections, ROUTINE_SECTIONS),
    });
  }

  // Single-file domains: a missing file counts as skipped too (PRD §10)
  const readYamlFile = <S extends z.ZodType>(path: string, schema: S): z.infer<S> | null => {
    const content = byPath.get(path);
    if (content === undefined) {
      skip(path, "parse_error");
      return null;
    }
    const yaml = parseYaml(content);
    if (!yaml.ok) {
      skip(path, yaml.reason);
      return null;
    }
    const v = validate(schema, yaml.value);
    if (!v.ok) {
      skip(path, v.reason);
      return null;
    }
    return v.value;
  };

  const vocabularies: Snapshot["vocabularies"] = {};
  for (const [name, path] of Object.entries(VOCABULARY_FILES) as [VocabularyName, string][]) {
    const v = readYamlFile(path, vocabularySchema);
    if (v) vocabularies[name] = v;
  }

  const rawProgram = readYamlFile(PROGRAM_FILE, programSchema);
  // Only phase, constraints and schedule; `journal` never leaves the server (FR-3)
  const program: Program | null = rawProgram
    ? {
        phase: rawProgram.phase,
        constraints: rawProgram.constraints,
        schedule: {
          ...rawProgram.schedule,
          week: Object.fromEntries(
            WEEKDAYS.map((d) => [d, rawProgram.schedule.week?.[d] ?? []]),
          ) as Program["schedule"]["week"],
        },
      }
    : null;

  const sessionsFile = readYamlFile(SESSIONS_FILE, sessionsFileSchema);
  const since = localDate(now, -SESSION_WINDOW_DAYS);
  const sessions: Session[] = (sessionsFile?.sessions ?? []).filter((s) => s.date >= since);

  const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
  return {
    format: SNAPSHOT_FORMAT,
    generated_at: now.toISOString(),
    exercises: exercises.sort(byId),
    routines: routines.sort(byId),
    program,
    sessions,
    vocabularies,
    skipped: skipped.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

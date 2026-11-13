/**
 * The snapshot document (PRD §7): what GET /api/snapshot returns and what the client stores.
 */
import type { z } from "zod";
import type {
  exerciseFrontmatterSchema,
  programSchema,
  routineFrontmatterSchema,
  sessionSchema,
  vocabularySchema,
} from "./kb";

export const SNAPSHOT_FORMAT = 1;

export type SkipReason = "parse_error" | "schema_error";
export type Skipped = { path: string; reason: SkipReason };

export type ExerciseSections = {
  execution: string;
  common_mistakes?: string;
  progression?: string;
  notes?: string;
};
export type RoutineSections = { guidelines?: string; progression?: string };

export type Exercise = z.infer<typeof exerciseFrontmatterSchema> & { sections: ExerciseSections };
export type Routine = z.infer<typeof routineFrontmatterSchema> & {
  status: "active" | "paused";
  sections: RoutineSections;
};
export type Program = Pick<z.infer<typeof programSchema>, "phase" | "constraints" | "schedule">;
export type Session = z.infer<typeof sessionSchema>;
export type Vocabulary = z.infer<typeof vocabularySchema>;

/** Vocabulary name → file, relative to the `fitness` folder. */
export const VOCABULARY_FILES = {
  regions: "_system/regions.yaml",
  zones: "_system/zones.yaml",
  muscles: "_system/muscles.yaml",
  goals: "_system/goals.yaml",
  patterns: "_system/patterns.yaml",
  positions: "_system/positions.yaml",
  equipment: "_system/equipment.yaml",
  resistances: "_system/resistances.yaml",
  stresses: "_system/stresses.yaml",
  levels: "_system/levels.yaml",
  categories: "routines/_system/categories.yaml",
} as const;
export type VocabularyName = keyof typeof VOCABULARY_FILES;

export const PROGRAM_FILE = "program/al.yaml";
export const SESSIONS_FILE = "sessions/al.yaml";

export type Snapshot = {
  format: typeof SNAPSHOT_FORMAT;
  generated_at: string;
  exercises: Exercise[];
  routines: Routine[];
  program: Program | null;
  sessions: Session[];
  vocabularies: Partial<Record<VocabularyName, Vocabulary>>;
  skipped: Skipped[];
};

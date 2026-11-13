/**
 * zod mirror of fitness/_system/schema.md (exercises 1, routines 3, program 1, sessions 1).
 * Objects are loose: unknown fields are kept as they are (tech_standards §9).
 * Only the fields the contract marks as required are required here; optional fields accept
 * `null`, because an empty YAML key (`stresses:`) parses to null and schema.md allows "empty".
 */
import { z } from "zod";

const id = z.string().min(1);
const ids = z.array(id);

/** Weekday keys used by routines (`days`) and the program (`schedule.week`). */
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const weekday = z.enum(WEEKDAYS);

export const vocabularyEntrySchema = z.looseObject({ label: z.string() });
export const vocabularySchema = z.record(z.string(), vocabularyEntrySchema);

/** Core frontmatter shared by collection items (personal-knowledge-base v2). */
const core = {
  id,
  domain: z.string(),
  created: z.string(),
  updated: z.string(),
};

export const exerciseFrontmatterSchema = z.looseObject({
  ...core,
  domain: z.literal("exercises"),
  title: z.string(),
  region: id,
  goals: ids,
  measure: z.enum(["reps", "time", "duration"]),
  zones: ids.nullish(),
  muscles: z.looseObject({ primary: ids.nullish(), secondary: ids.nullish() }).nullish(),
  equipment: ids.nullish(),
  stresses: ids.nullish(),
});

export const routineItemSchema = z.looseObject({ ex: id });

export const routineBlockSchema = z.looseObject({
  id,
  items: z.array(routineItemSchema),
});

export const routineStatus = z.enum(["active", "paused", "draft", "archived"]);

export const routineFrontmatterSchema = z.looseObject({
  ...core,
  domain: z.literal("routines"),
  title: z.string(),
  category: id,
  user: z.string(),
  status: routineStatus,
  blocks: z.array(routineBlockSchema),
  days: z.array(weekday).nullish(),
});

export const programSchema = z.looseObject({
  // program 1 lists no required field; the three blocks the app reads must be objects, and
  // anything inside them may be empty (`sun:` parses to null).
  phase: z.looseObject({ label: z.string().nullish() }),
  constraints: z.looseObject({
    avoid_stresses: ids.nullish(),
    avoid_text: z.array(z.string()).nullish(),
    rules: z.array(z.string()).nullish(),
  }),
  schedule: z.looseObject({
    week: z.partialRecord(weekday, ids.nullish()).nullish(),
  }),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const sessionSchema = z.looseObject({
  date: isoDate,
  status: z.enum(["completed", "partial", "skipped"]),
  routine: z.string().nullish(),
});

export const sessionsFileSchema = z.looseObject({
  sessions: z.array(sessionSchema).nullish(),
});

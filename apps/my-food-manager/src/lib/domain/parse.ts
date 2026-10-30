import { parse as parseYaml } from "yaml";
import { z } from "zod";
import {
  ingredientCatalogEntrySchema,
  pantryFileSchema,
  recipeSchema,
  reviewsSchema,
  type IngredientCatalogEntry,
  type Pantry,
  type Plan,
  type PlanDish,
  type Recipe,
  type Reviews,
} from "@/lib/schema";

export class ParseError extends Error {}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function yaml(text: string): unknown {
  try {
    return parseYaml(text);
  } catch (e) {
    throw new ParseError(`YAML inválido: ${(e as Error).message.split("\n")[0]}`);
  }
}

/** Splits `## Heading` sections of the recipe body. */
function sections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let current: string | null = null;
  const buf: string[] = [];
  const flush = () => {
    if (current) out[current] = buf.join("\n").trim();
    buf.length = 0;
  };
  for (const line of body.split(/\r?\n/)) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = m[1].toLowerCase();
    } else buf.push(line);
  }
  flush();
  return out;
}

/** Numbered list items; continuation lines are appended to the previous step. */
function numbered(text: string): string[] {
  const steps: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (m) steps.push(m[1].trim());
    else if (line.trim() && steps.length) steps[steps.length - 1] += " " + line.trim();
  }
  return steps;
}

export function parseRecipe(markdown: string): Recipe {
  const m = FRONTMATTER.exec(markdown);
  if (!m) throw new ParseError("Falta el frontmatter");
  const data = recipeSchema.safeParse(yaml(m[1]));
  if (!data.success)
    throw new ParseError(`Receta inválida: ${data.error.issues[0]?.path.join(".")}`);
  const sec = sections(m[2]);
  return {
    ...data.data,
    steps: numbered(sec["steps"] ?? ""),
    notes: sec["notes"] ?? "",
    variations: sec["variations"] ?? "",
  };
}

export function parseIngredients(text: string): Record<string, IngredientCatalogEntry> {
  const raw = yaml(text);
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, IngredientCatalogEntry> = {};
  for (const [id, value] of Object.entries(raw)) {
    const r = ingredientCatalogEntrySchema.safeParse(value);
    if (r.success) out[id] = r.data;
  }
  return out;
}

/** Pantry schema 2: `items` maps each ingredient id to `{ have, to_buy }`. */
export function parsePantry(text: string): Pantry {
  const r = pantryFileSchema.safeParse(yaml(text) ?? {});
  if (!r.success) throw new ParseError("Despensa inválida: falta `items` (esquema 2)");
  const have: string[] = [];
  const toBuy: string[] = [];
  for (const [id, entry] of Object.entries(r.data.items)) {
    if (entry?.have === true) have.push(id);
    if (entry?.to_buy === true) toBuy.push(id);
  }
  return { updated: r.data.updated, have, to_buy: toBuy };
}

export function parseReviews(text: string): Reviews {
  const r = reviewsSchema.safeParse(yaml(text) ?? {});
  if (!r.success) throw new ParseError("Valoraciones inválidas");
  return r.data;
}

export function parseVocab(text: string): Record<string, unknown> {
  const raw = yaml(text);
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

const planFileSchema = z.looseObject({
  updated: z.unknown().optional(),
  days: z
    .record(z.string(), z.unknown())
    .nullish()
    .transform((v) => v ?? {}),
});

/** `plan.yaml` as the snapshot carries it: meals with recipe and text dishes; labels, notes and servings stay in the file only. */
export function parsePlan(text: string): Plan {
  const r = planFileSchema.safeParse(yaml(text) ?? {});
  if (!r.success) throw new ParseError("Plan inválido: se esperaba `days`");
  const days: Plan["days"] = {};
  for (const [date, meals] of Object.entries(r.data.days)) {
    if (!Array.isArray(meals)) continue;
    const list: Plan["days"][string] = [];
    for (const meal of meals) {
      const m = meal as { slot?: unknown; dishes?: unknown } | null;
      if (!m || typeof m.slot !== "string" || !Array.isArray(m.dishes)) continue;
      const dishes: PlanDish[] = [];
      for (const d of m.dishes as Record<string, unknown>[]) {
        if (d && typeof d.recipe === "string") dishes.push({ recipe: d.recipe });
        else if (d && typeof d.text === "string") dishes.push({ text: d.text });
      }
      list.push({ slot: m.slot, dishes });
    }
    if (list.length) days[date] = list;
  }
  const updated = r.data.updated;
  return { updated: typeof updated === "string" ? updated : undefined, days };
}

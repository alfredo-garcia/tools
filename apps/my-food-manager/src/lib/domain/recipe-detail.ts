import type { IngredientCatalogEntry, Library, Recipe } from "@/lib/schema";

type IngredientLine = Recipe["ingredients"][number];

export const MISSING = "-";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
};

/** Servings units are not in units.yaml; the schema fixes them to these three. */
const SERVINGS_UNIT_LABEL: Record<string, string> = {
  people: "personas",
  units: "unidades",
  portions: "porciones",
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  web: "Web",
  book: "Libro",
  "google-doc": "Google Doc",
  own: "Propia",
  family: "Familiar",
};

const UNMEASURED_UNITS = new Set(["to-taste", "as-needed", "pinch"]);

/** Mass and volume units read better abbreviated than with their vocabulary label ("gramos"). */
const SHORT_UNIT: Record<string, string> = { g: "g", kg: "kg", ml: "ml", l: "l" };

export const findRecipe = (library: Library, id: string): Recipe | undefined =>
  library.recipes.find((r) => r.id === id);

/** prep + cook + rest, missing parts as 0; undefined when the recipe has no time data at all. */
export function totalMinutes(time: Recipe["time"]): number | undefined {
  if (!time) return undefined;
  const { prep, cook, rest } = time;
  if (prep === undefined && cook === undefined && rest === undefined) return undefined;
  return (prep ?? 0) + (cook ?? 0) + (rest ?? 0);
}

/** "25 min" under an hour, "1 h 30 min" or "2 h" from an hour up. */
export function formatMinutes(min: number | undefined): string {
  if (min === undefined) return MISSING;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Spanish decimal comma, at most 2 decimals, no fraction glyphs. */
export function formatNumber(n: number): string {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

export const difficultyLabel = (d: Recipe["difficulty"]): string =>
  d ? (DIFFICULTY_LABEL[d] ?? d) : MISSING;

export function servingsLabel(servings: Recipe["servings"]): string {
  if (!servings || servings.qty === undefined) return MISSING;
  const unit = servings.unit ? (SERVINGS_UNIT_LABEL[servings.unit] ?? servings.unit) : "";
  return `${formatNumber(servings.qty)} ${unit}`.trim();
}

const vocabLabel = (entry: unknown): string | undefined =>
  (entry as { label?: string } | undefined)?.label;

const pluralize = (label: string) => (/[aeiou]$/i.test(label) ? `${label}s` : `${label}es`);

/** Unit text for a measured quantity: abbreviated for mass/volume, vocabulary label (pluralized) otherwise. */
function measuredUnit(library: Library, unit: string, qty: number): string {
  if (SHORT_UNIT[unit]) return SHORT_UNIT[unit];
  const label = vocabLabel(library.vocab.units[unit]) ?? unit;
  return label && qty !== 1 ? pluralize(label) : label;
}

/** Labels of a tag family's values for a recipe; unknown ids fall back to the raw id. */
export function tagLabels(library: Library, family: string, ids: string[] | undefined): string[] {
  const values = (library.vocab.tags[family] as { values?: Record<string, string> } | undefined)
    ?.values;
  return (ids ?? []).map((id) => values?.[id] ?? id);
}

export const INFO_TAG_FAMILIES = [
  { key: "technique", label: "Técnica" },
  { key: "cuisine", label: "Cocina" },
  { key: "diet", label: "Dieta" },
  { key: "protein", label: "Proteína" },
  { key: "occasion", label: "Ocasión" },
] as const;

/** "salsa-holandesa" -> "Salsa holandesa". */
export function groupTitle(slug: string): string {
  const text = slug.replace(/-/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface IngredientGroup {
  /** Undefined for the ungrouped (main) lines, which have no heading. */
  group?: string;
  lines: IngredientLine[];
}

/** Ungrouped lines first, then named groups in order of first appearance. */
export function groupIngredients(lines: IngredientLine[]): IngredientGroup[] {
  const main: IngredientLine[] = [];
  const named = new Map<string, IngredientLine[]>();
  for (const line of lines) {
    const group = line.group?.trim();
    if (!group) main.push(line);
    else named.set(group, [...(named.get(group) ?? []), line]);
  }
  return [
    ...(main.length ? [{ lines: main }] : []),
    ...[...named].map(([group, groupLines]) => ({ group, lines: groupLines })),
  ];
}

export interface IngredientView {
  /** Quantity column text; "" for unmeasured units, "-" when a measurable line has no quantity. */
  quantity: string;
  name: string;
  /** Muted trailing text: unit label for unmeasured lines, then the note. */
  detail: string;
  optional: boolean;
  /** Recipe id to link to; only set when that recipe exists in the library. */
  linkedRecipeId?: string;
}

export function ingredientView(
  line: IngredientLine,
  library: Library,
  catalog: Record<string, IngredientCatalogEntry> = library.ingredients,
): IngredientView {
  const unit = line.unit ?? "";
  const unmeasured = UNMEASURED_UNITS.has(unit);
  const unitLabel = vocabLabel(library.vocab.units[unit]) ?? unit;

  let quantity = "";
  if (!unmeasured) {
    quantity = line.qty === undefined ? MISSING : formatNumber(line.qty);
    const measured = line.qty === undefined || !unit ? "" : measuredUnit(library, unit, line.qty);
    if (measured) quantity += ` ${measured}`;
  } else if (line.qty !== undefined) {
    quantity = formatNumber(line.qty);
  }

  return {
    quantity,
    name: catalog[line.ing]?.name ?? line.ing,
    detail: [unmeasured ? unitLabel : "", line.note].filter(Boolean).join(" · "),
    optional: line.optional === true,
    linkedRecipeId:
      line.recipe && library.recipes.some((r) => r.id === line.recipe) ? line.recipe : undefined,
  };
}

export interface NotesView {
  notes: string[];
  variations: string;
  source?: { text: string; url?: string };
}

/** Bullet lines of the Notes section ("- text"); a non-bullet paragraph is kept as one item. */
function bullets(text: string): string[] {
  return text
    .split(/\n(?=\s*[-*]\s)/)
    .map((p) =>
      p
        .replace(/^\s*[-*]\s+/, "")
        .replace(/\s*\n\s*/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/** Undefined when there is nothing to show, so the whole section is not rendered. */
export function notesView(recipe: Recipe): NotesView | undefined {
  const notes = bullets(recipe.notes);
  const variations = recipe.variations.trim();
  const s = recipe.source;
  const typeLabel = s?.type ? (SOURCE_TYPE_LABEL[s.type] ?? s.type) : undefined;
  const text = [typeLabel, s?.author].filter(Boolean).join(" · ");
  const source = s && (text || s.url) ? { text, url: s.url } : undefined;
  if (!notes.length && !variations && !source) return undefined;
  return { notes, variations, source };
}

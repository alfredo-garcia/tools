import type { Library, Recipe } from "@/lib/schema";

export type FilterKey = "category" | "time" | "diet" | "cuisine" | "difficulty" | "protein";

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "category", label: "Categoría" },
  { key: "time", label: "Tiempo" },
  { key: "diet", label: "Dieta" },
  { key: "cuisine", label: "Cocina" },
  { key: "difficulty", label: "Dificultad" },
  { key: "protein", label: "Proteína" },
];

export type FilterState = Partial<Record<FilterKey, string>>;

export interface FilterOption {
  value: string;
  label: string;
  /** Recipes that would show if this option were chosen, given the other active filters. */
  count: number;
}

const TIME_BUCKETS: { value: string; label: string; test: (min: number) => boolean }[] = [
  { value: "15", label: "Hasta 15 min", test: (m) => m <= 15 },
  { value: "30", label: "Hasta 30 min", test: (m) => m <= 30 },
  { value: "60", label: "Hasta 1 h", test: (m) => m <= 60 },
  { value: "over60", label: "Más de 1 h", test: (m) => m > 60 },
];

const DIFFICULTIES = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Media" },
  { value: "hard", label: "Difícil" },
];

/** prep + cook + rest, missing parts as 0; undefined when the recipe has no time data at all. */
export function totalMinutes(time: Recipe["time"]): number | undefined {
  if (!time) return undefined;
  const { prep, cook, rest } = time;
  if (prep === undefined && cook === undefined && rest === undefined) return undefined;
  return (prep ?? 0) + (cook ?? 0) + (rest ?? 0);
}

/** Values the recipe has for a filter key (a recipe can have several per tag family). */
function recipeValues(recipe: Recipe, key: FilterKey): string[] {
  switch (key) {
    case "category":
      return [recipe.category || "unclassified"];
    case "difficulty":
      return recipe.difficulty ? [recipe.difficulty] : [];
    case "time": {
      const min = totalMinutes(recipe.time);
      return min === undefined ? [] : TIME_BUCKETS.filter((b) => b.test(min)).map((b) => b.value);
    }
    default:
      return recipe.tags[key] ?? [];
  }
}

export function matchesFilters(recipe: Recipe, state: FilterState, except?: FilterKey): boolean {
  return FILTERS.every(({ key }) => {
    const wanted = state[key];
    return key === except || !wanted || recipeValues(recipe, key).includes(wanted);
  });
}

export function filterRecipes(recipes: Recipe[], state: FilterState): Recipe[] {
  return recipes.filter((r) => matchesFilters(r, state));
}

export const activeFilterCount = (state: FilterState) =>
  FILTERS.filter(({ key }) => state[key]).length;

/** Vocabulary order first, then values only found in recipes. */
function ordered(vocabIds: string[], present: Set<string>): string[] {
  const known = vocabIds.filter((id) => present.has(id));
  const rest = [...present].filter((id) => !vocabIds.includes(id)).sort();
  return [...known, ...rest];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function labelOf(vocab: unknown, id: string): string {
  const entry = (vocab as Record<string, unknown> | undefined)?.[id];
  const label =
    typeof entry === "string" ? entry : (entry as { label?: string } | undefined)?.label;
  return capitalize(label ?? id);
}

/** Options for one filter: every value present in the library, with counts against the other filters. */
export function filterOptions(
  library: Pick<Library, "recipes" | "vocab">,
  key: FilterKey,
  state: FilterState,
): FilterOption[] {
  const { recipes, vocab } = library;
  const present = new Set(recipes.flatMap((r) => recipeValues(r, key)));
  const counts = new Map<string, number>();
  for (const r of recipes)
    if (matchesFilters(r, state, key))
      for (const v of recipeValues(r, key)) counts.set(v, (counts.get(v) ?? 0) + 1);

  let ids: string[];
  let label: (id: string) => string;
  if (key === "time") {
    ids = TIME_BUCKETS.map((b) => b.value).filter((v) => present.has(v));
    label = (id) => TIME_BUCKETS.find((b) => b.value === id)!.label;
  } else if (key === "difficulty") {
    ids = DIFFICULTIES.map((d) => d.value).filter((v) => present.has(v));
    label = (id) => DIFFICULTIES.find((d) => d.value === id)!.label;
  } else if (key === "category") {
    ids = ordered(Object.keys(vocab.categories), present);
    label = (id) => labelOf(vocab.categories, id);
  } else {
    const family = (vocab.tags as Record<string, { values?: Record<string, string> }>)[key];
    ids = ordered(Object.keys(family?.values ?? {}), present);
    label = (id) => labelOf(family?.values, id);
  }
  return ids.map((value) => ({ value, label: label(value), count: counts.get(value) ?? 0 }));
}

/** Label for the value currently selected in a filter (raw value if it no longer exists). */
export function selectedLabel(options: FilterOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

import { filterRecipes, type FilterState } from "@/lib/domain/filters";
import type { Library, Recipe } from "@/lib/schema";

export const SEARCH_MIN_CHARS = 3;
export const SEARCH_DEBOUNCE_MS = 1000;

export type SearchGroupKey = "recipes" | "protein" | "ingredients";

export interface SearchGroup {
  key: SearchGroupKey;
  label: string;
  recipes: Recipe[];
}

export interface SearchResult {
  groups: SearchGroup[];
  /** Distinct recipes across all groups. */
  total: number;
}

const GROUP_LABELS: Record<SearchGroupKey, string> = {
  recipes: "Recetas",
  protein: "Proteína",
  ingredients: "Ingredientes",
};

/** Lowercase and strip combining accents; "ñ" is kept as its own letter. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ñ/g, "\u0001")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\u0001/g, "ñ");
}

/** The text that takes effect: trimmed, or "" when it has fewer than the minimum characters. */
export function appliedQuery(typed: string): string {
  const trimmed = typed.trim();
  return trimmed.length >= SEARCH_MIN_CHARS ? trimmed : "";
}

const words = (text: string) => normalize(text).split(/\s+/).filter(Boolean);

const containsAll = (value: string, wanted: string[]) => {
  const haystack = normalize(value);
  return wanted.every((w) => haystack.includes(w));
};

function proteinLabel(vocab: Library["vocab"], id: string): string {
  const family = (vocab.tags as Record<string, { values?: Record<string, unknown> }>).protein;
  const entry = family?.values?.[id];
  const label =
    typeof entry === "string" ? entry : (entry as { label?: string } | undefined)?.label;
  return label ?? id;
}

function ingredientName(library: Pick<Library, "ingredients">, id: string): string {
  return library.ingredients[id]?.name ?? id.replace(/-/g, " ");
}

/**
 * Recipes matching the filters, grouped by where the text was found: title, protein, ingredient.
 * Every word must be found in the same place; a recipe is listed in every group it matches.
 * Groups with no recipes are left out; recipes keep the order of the input.
 */
export function searchRecipes(
  library: Pick<Library, "recipes" | "vocab" | "ingredients">,
  applied: string,
  filters: FilterState,
): SearchResult {
  const wanted = words(applied);
  const candidates = filterRecipes(library.recipes, filters);
  if (wanted.length === 0) return { groups: [], total: 0 };

  const matchers: Record<SearchGroupKey, (r: Recipe) => boolean> = {
    recipes: (r) => containsAll(r.title, wanted),
    protein: (r) =>
      (r.tags.protein ?? []).some(
        (id) => containsAll(proteinLabel(library.vocab, id), wanted) || containsAll(id, wanted),
      ),
    ingredients: (r) =>
      r.ingredients.some((line) => containsAll(ingredientName(library, line.ing), wanted)),
  };

  const groups = (Object.keys(matchers) as SearchGroupKey[])
    .map((key) => ({ key, label: GROUP_LABELS[key], recipes: candidates.filter(matchers[key]) }))
    .filter((g) => g.recipes.length > 0);
  const total = new Set(groups.flatMap((g) => g.recipes.map((r) => r.id))).size;
  return { groups, total };
}

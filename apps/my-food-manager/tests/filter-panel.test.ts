import { describe, expect, it } from "vitest";
import {
  FILTERS,
  activeFilterCount,
  filterOptions,
  filterRecipes,
  withFavorites,
} from "@/lib/domain/filters";
import { searchRecipes } from "@/lib/domain/search";
import type { Library, Recipe } from "@/lib/schema";

// my-food-manager/016: Favoritos filter (US-2).
const recipe = (id: string, category = "mains"): Recipe =>
  ({
    id,
    title: `Plato ${id}`,
    category,
    tags: {},
    ingredients: [],
    curated: false,
    missing: [],
    steps: [],
    notes: "",
    variations: "",
  }) as unknown as Recipe;

const vocab = {
  categories: { mains: { label: "Principales" }, desserts: { label: "Postres" } },
  tags: {},
  units: {},
  families: {},
};
const base = [recipe("a"), recipe("b"), recipe("c", "desserts")];
const ids = (rs: Recipe[]) => rs.map((r) => r.id);

describe("Favoritos filter", () => {
  const recipes = withFavorites(base, new Set(["a", "c"]));
  const library = { recipes, vocab } as unknown as Library;

  it("is the ninth filter, after Rating", () => {
    expect(FILTERS.at(-1)).toEqual({ key: "favorite", label: "Favoritos" });
    expect(FILTERS[7].key).toBe("rating");
  });

  it("keeps only favorites, or only the others", () => {
    expect(ids(filterRecipes(recipes, { favorite: "yes" }))).toEqual(["a", "c"]);
    expect(ids(filterRecipes(recipes, { favorite: "no" }))).toEqual(["b"]);
  });

  it("offers two fixed options with counts against the other filters", () => {
    expect(filterOptions(library, "favorite", {})).toEqual([
      { value: "yes", label: "Favoritos", count: 2 },
      { value: "no", label: "No favoritos", count: 1 },
    ]);
    expect(
      filterOptions(library, "favorite", { category: "desserts" }).map((o) => o.count),
    ).toEqual([1, 0]);
  });

  it("gives Favoritos 0 when nothing is a favorite", () => {
    const none = { recipes: withFavorites(base, new Set()), vocab } as unknown as Library;
    expect(filterOptions(none, "favorite", {}).map((o) => o.count)).toEqual([0, 3]);
  });

  it("counts as an active filter and combines with search", () => {
    expect(activeFilterCount({ favorite: "yes", status: "tried" })).toBe(2);
    expect(searchRecipes(library, "Plato b", { favorite: "yes" }).total).toBe(0);
    expect(searchRecipes(library, "Plato b", { favorite: "no" }).total).toBe(1);
  });

  it("does not change the recipes it is given", () => {
    expect("favorite" in base[0]).toBe(false);
  });
});

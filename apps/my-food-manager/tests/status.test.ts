import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTER_STATE,
  FILTERS,
  STATUS_OPTIONS,
  activeFilterCount,
  filterOptions,
  filterRecipes,
  recipeStatus,
  withoutDiscarded,
} from "@/lib/domain/filters";
import { searchRecipes } from "@/lib/domain/search";
import { SNAPSHOT_SCHEMA_VERSION, recipeSchema, type Library, type Recipe } from "@/lib/schema";

const recipe = (id: string, status?: Recipe["status"], category = "mains"): Recipe =>
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
    status,
  }) as unknown as Recipe;

const vocab = {
  categories: { mains: { label: "Principales" }, desserts: { label: "Postres" } },
  tags: {},
  units: {},
  families: {},
};

const recipes = [
  recipe("a", "tried"),
  recipe("b"),
  recipe("c", "to-try"),
  recipe("d", "to-try", "desserts"),
  recipe("e", "discarded"),
];
const library = { recipes, vocab } as unknown as Library;
const ids = (list: Recipe[]) => list.map((r) => r.id);

describe("recipe status in the schema", () => {
  const parse = (extra: Record<string, unknown>) =>
    recipeSchema.parse({ id: "x", title: "X", ...extra });

  it("keeps the three known values", () => {
    for (const s of ["to-try", "tried", "discarded"] as const)
      expect(parse({ status: s }).status).toBe(s);
  });

  it("reads missing, empty and unknown values as undefined (tried)", () => {
    expect(parse({}).status).toBeUndefined();
    expect(parse({ status: null }).status).toBeUndefined();
    expect(parse({ status: "" }).status).toBeUndefined();
    expect(parse({ status: "maybe" }).status).toBeUndefined();
    expect(recipeStatus(parse({ status: "maybe" }) as Recipe)).toBe("tried");
  });

  it("forces stored libraries from before status to be fetched again", () => {
    expect(SNAPSHOT_SCHEMA_VERSION).toBe(3);
  });
});

describe("Estado filter", () => {
  it("is the seventh filter, before Rating, and starts on Probadas", () => {
    expect(FILTERS.map((f) => f.key)).toEqual([
      "category",
      "time",
      "diet",
      "cuisine",
      "difficulty",
      "protein",
      "status",
      "rating",
    ]);
    expect(FILTERS[6].label).toBe("Estado");
    expect(DEFAULT_FILTER_STATE).toEqual({ status: "tried" });
  });

  it("Probadas includes recipes without status", () => {
    expect(ids(filterRecipes(recipes, { status: "tried" }))).toEqual(["a", "b"]);
  });

  it("Por probar and Descartadas show only their own", () => {
    expect(ids(filterRecipes(recipes, { status: "to-try" }))).toEqual(["c", "d"]);
    expect(ids(filterRecipes(recipes, { status: "discarded" }))).toEqual(["e"]);
  });

  it("no status condition shows every recipe", () => {
    expect(ids(filterRecipes(recipes, {}))).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("combines with the other filters", () => {
    expect(ids(filterRecipes(recipes, { status: "to-try", category: "desserts" }))).toEqual(["d"]);
  });

  it("counts Estado as an active filter", () => {
    expect(activeFilterCount(DEFAULT_FILTER_STATE)).toBe(1);
    expect(activeFilterCount({ status: "tried", category: "mains" })).toBe(2);
  });

  it("always offers the three options in order, with counts against the other filters", () => {
    expect(STATUS_OPTIONS.map((s) => s.label)).toEqual(["Probadas", "Por probar", "Descartadas"]);
    expect(filterOptions(library, "status", {})).toEqual([
      { value: "tried", label: "Probadas", count: 2 },
      { value: "to-try", label: "Por probar", count: 2 },
      { value: "discarded", label: "Descartadas", count: 1 },
    ]);
    expect(filterOptions(library, "status", { category: "desserts" }).map((o) => o.count)).toEqual([
      0, 1, 0,
    ]);
  });

  it("keeps a zero-count option in a library without that status", () => {
    const only = { recipes: [recipe("a")], vocab } as unknown as Library;
    expect(filterOptions(only, "status", {}).map((o) => o.count)).toEqual([1, 0, 0]);
  });

  it("other filters' counts take Estado into account", () => {
    const cats = filterOptions(library, "category", DEFAULT_FILTER_STATE);
    expect(cats.find((o) => o.value === "mains")?.count).toBe(2);
    expect(cats.find((o) => o.value === "desserts")?.count).toBe(0);
  });
});

describe("search with Estado", () => {
  it("leaves out recipes the status hides, and finds them again without it", () => {
    const hidden = searchRecipes(library, "Plato e", { status: "tried" });
    expect(hidden.total).toBe(0);
    const all = searchRecipes(library, "Plato e", {});
    expect(all.total).toBe(1);
  });
});

describe("plan picker", () => {
  it("excludes only the discarded recipes", () => {
    expect(ids(withoutDiscarded(recipes))).toEqual(["a", "b", "c", "d"]);
  });
});

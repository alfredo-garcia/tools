import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  filterOptions,
  filterRecipes,
  selectedLabel,
  totalMinutes,
} from "@/lib/domain/filters";
import { buildSnapshot } from "@/lib/domain/snapshot";
import type { Recipe } from "@/lib/schema";
import { fixtureDrive } from "./helpers";

const recipe = (over: Partial<Recipe> & { id: string }): Recipe =>
  ({
    title: over.id,
    category: "mains",
    tags: {},
    ingredients: [],
    curated: false,
    missing: [],
    steps: [],
    notes: "",
    variations: "",
    ...over,
  }) as Recipe;

const vocab = {
  categories: { mains: { label: "Principales" }, desserts: { label: "Postres" } },
  tags: {
    protein: { label: "Proteína", values: { chicken: "pollo", beef: "ternera", fish: "pescado" } },
    diet: { label: "Dieta", values: { vegan: "vegana" } },
    cuisine: { label: "Cocina", values: { italian: "italiana" } },
  },
  units: {},
  families: {},
};

const recipes = [
  recipe({
    id: "a",
    time: { prep: 10, cook: 5 },
    difficulty: "easy",
    tags: { protein: ["chicken"], cuisine: ["italian"] },
  }),
  recipe({
    id: "b",
    category: "desserts",
    time: { cook: 90 },
    difficulty: "hard",
    tags: { diet: ["vegan"], protein: ["chicken", "beef"] },
  }),
  recipe({ id: "c", time: { prep: 20, rest: 10 }, tags: { protein: ["fish"] } }),
  recipe({ id: "d", category: undefined as unknown as string, tags: { protein: ["tofu"] } }),
];
const ids = (rs: Recipe[]) => rs.map((r) => r.id);

describe("totalMinutes", () => {
  it("sums prep, cook and rest treating missing parts as 0", () => {
    expect(totalMinutes({ prep: 10, cook: 5 })).toBe(15);
    expect(totalMinutes({ rest: 30 })).toBe(30);
  });
  it("is undefined without any time data", () => {
    expect(totalMinutes(undefined)).toBeUndefined();
    expect(totalMinutes({})).toBeUndefined();
  });
});

describe("filterRecipes", () => {
  it("returns everything with no active filters", () => {
    expect(ids(filterRecipes(recipes, {}))).toEqual(["a", "b", "c", "d"]);
  });

  it("filters by category, treating a missing category as unclassified", () => {
    expect(ids(filterRecipes(recipes, { category: "desserts" }))).toEqual(["b"]);
    expect(ids(filterRecipes(recipes, { category: "unclassified" }))).toEqual(["d"]);
  });

  it("filters by time buckets; recipes without time never match", () => {
    expect(ids(filterRecipes(recipes, { time: "15" }))).toEqual(["a"]);
    expect(ids(filterRecipes(recipes, { time: "30" }))).toEqual(["a", "c"]);
    expect(ids(filterRecipes(recipes, { time: "over60" }))).toEqual(["b"]);
  });

  it("filters by difficulty", () => {
    expect(ids(filterRecipes(recipes, { difficulty: "hard" }))).toEqual(["b"]);
  });

  it("matches any tag of a family", () => {
    expect(ids(filterRecipes(recipes, { protein: "beef" }))).toEqual(["b"]);
    expect(ids(filterRecipes(recipes, { protein: "chicken" }))).toEqual(["a", "b"]);
    expect(ids(filterRecipes(recipes, { diet: "vegan" }))).toEqual(["b"]);
    expect(ids(filterRecipes(recipes, { cuisine: "italian" }))).toEqual(["a"]);
  });

  it("combines filters with AND", () => {
    expect(ids(filterRecipes(recipes, { protein: "chicken", category: "mains" }))).toEqual(["a"]);
    expect(filterRecipes(recipes, { protein: "fish", difficulty: "easy" })).toEqual([]);
  });

  it("counts active filters", () => {
    expect(activeFilterCount({})).toBe(0);
    expect(activeFilterCount({ diet: "vegan", time: "15" })).toBe(2);
  });
});

describe("filterOptions", () => {
  const lib = { recipes, vocab };

  it("lists only values present, in vocabulary order, with raw ids for unknown ones", () => {
    expect(filterOptions(lib, "protein", {}).map((o) => o.value)).toEqual([
      "chicken",
      "beef",
      "fish",
      "tofu",
    ]);
    const tofu = filterOptions(lib, "protein", {}).find((o) => o.value === "tofu");
    expect(tofu?.label).toBe("Tofu");
    expect(filterOptions(lib, "category", {}).map((o) => o.label)).toEqual([
      "Principales",
      "Postres",
      "Unclassified",
    ]);
  });

  it("lists time and difficulty options with Spanish labels", () => {
    expect(filterOptions(lib, "time", {}).map((o) => o.label)).toEqual([
      "Hasta 15 min",
      "Hasta 30 min",
      "Hasta 1 h",
      "Más de 1 h",
    ]);
    expect(filterOptions(lib, "difficulty", {}).map((o) => o.label)).toEqual(["Fácil", "Difícil"]);
  });

  it("counts against the other filters but not its own", () => {
    const opts = filterOptions(lib, "protein", { category: "desserts", protein: "fish" });
    expect(Object.fromEntries(opts.map((o) => [o.value, o.count]))).toEqual({
      chicken: 1,
      beef: 1,
      fish: 0,
      tofu: 0,
    });
  });

  it("finds the label of the selected value", () => {
    const opts = filterOptions(lib, "protein", {});
    expect(selectedLabel(opts, "beef")).toBe("Ternera");
    expect(selectedLabel(opts, "gone")).toBe("gone");
  });
});

describe("filters over the fixture library", () => {
  it("works on parsed recipes and the real vocabularies", async () => {
    const { files, read } = fixtureDrive();
    const { data } = await buildSnapshot(files, read);
    const cats = filterOptions(data, "category", {});
    expect(cats.map((o) => o.value)).toEqual(expect.arrayContaining(["mains", "desserts"]));
    expect(cats.reduce((n, o) => n + o.count, 0)).toBe(data.recipes.length);
    const mains = filterRecipes(data.recipes, { category: "mains" });
    expect(mains.every((r) => r.category === "mains")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { appliedQuery, normalize, searchRecipes } from "@/lib/domain/search";
import type { Recipe } from "@/lib/schema";

const recipe = (over: Partial<Recipe> & { id: string }): Recipe =>
  ({
    title: over.id,
    category: "mains",
    tags: {},
    ingredients: [],
    curated: false,
    missing: [],
    ...over,
  }) as Recipe;

const line = (ing: string) => ({ ing }) as unknown as Recipe["ingredients"][number];

const library = {
  vocab: {
    categories: { mains: { label: "Principales" } },
    tags: { protein: { label: "Proteína", values: { chicken: "pollo", egg: "huevo" } } },
    units: {},
    families: {},
  },
  ingredients: {
    "pechuga-de-pollo": { name: "pechuga de pollo" },
    cafe: { name: "café" },
    pina: { name: "piña" },
  },
  recipes: [
    recipe({
      id: "pollo-al-horno",
      title: "Pollo al horno",
      tags: { protein: ["chicken"] },
      ingredients: [line("pechuga-de-pollo")],
    }),
    recipe({
      id: "arroz",
      title: "Arroz",
      tags: { protein: ["chicken"] },
      ingredients: [line("pechuga-de-pollo")],
    }),
    recipe({ id: "sopa", title: "Sopa", ingredients: [line("pechuga-de-pollo")] }),
    recipe({
      id: "tarta-cafe",
      title: "Tarta de café",
      category: "desserts",
      ingredients: [line("cafe")],
    }),
    recipe({ id: "tarta-pina", title: "Tarta de piña", ingredients: [line("pina")] }),
    recipe({ id: "tortilla", title: "Tortilla", tags: { protein: ["egg"] }, ingredients: [] }),
    recipe({ id: "vacia", title: "Vacía", ingredients: [line("sin-catalogo-raro")] }),
  ],
} as unknown as Parameters<typeof searchRecipes>[0];

const ids = (g: { recipes: Recipe[] } | undefined) => g?.recipes.map((r) => r.id);

describe("normalize", () => {
  it("ignores case and accents but keeps ñ", () => {
    expect(normalize("CAFÉ")).toBe("cafe");
    expect(normalize("Piña")).toBe("piña");
    expect(normalize("piña")).not.toBe(normalize("pina"));
  });
});

describe("appliedQuery", () => {
  it("needs 3 characters after trimming", () => {
    expect(appliedQuery("po")).toBe("");
    expect(appliedQuery("  po  ")).toBe("");
    expect(appliedQuery("   ")).toBe("");
    expect(appliedQuery(" pol ")).toBe("pol");
  });
});

describe("searchRecipes", () => {
  it("groups by title, protein and ingredient, in that order", () => {
    const { groups, total } = searchRecipes(library, "poll", {});
    expect(groups.map((g) => g.label)).toEqual(["Recetas", "Proteína", "Ingredientes"]);
    expect(ids(groups[0])).toEqual(["pollo-al-horno"]);
    expect(ids(groups[1])).toEqual(["pollo-al-horno", "arroz"]);
    expect(ids(groups[2])).toEqual(["pollo-al-horno", "arroz", "sopa"]);
    expect(total).toBe(3);
  });

  it("matches without accents or case and by part of a word", () => {
    expect(ids(searchRecipes(library, "CAFE", {}).groups[0])).toEqual(["tarta-cafe"]);
    expect(ids(searchRecipes(library, "pol", {}).groups[0])).toEqual(["pollo-al-horno"]);
  });

  it("does not fold ñ into n", () => {
    expect(searchRecipes(library, "piña", {}).total).toBe(1);
    expect(searchRecipes(library, "pina", {}).total).toBe(0);
  });

  it("needs every word in the same place", () => {
    const hit = searchRecipes(library, "pollo horno", {});
    expect(hit.groups.map((g) => g.key)).toEqual(["recipes"]);
    expect(searchRecipes(library, "pollo cafe", {}).groups).toEqual([]);
  });

  it("falls back to the id as words when the catalog has no entry", () => {
    expect(ids(searchRecipes(library, "catalogo raro", {}).groups[0])).toEqual(["vacia"]);
  });

  it("leaves out empty groups and recipes without protein or ingredients", () => {
    const { groups } = searchRecipes(library, "huevo", {});
    expect(groups.map((g) => g.key)).toEqual(["protein"]);
    expect(ids(groups[0])).toEqual(["tortilla"]);
  });

  it("adds to the active filters", () => {
    const { groups, total } = searchRecipes(library, "poll", { protein: "chicken" });
    expect(total).toBe(2);
    expect(ids(groups[2])).toEqual(["pollo-al-horno", "arroz"]);
    expect(searchRecipes(library, "cafe", { category: "mains" }).groups).toEqual([]);
  });

  it("returns nothing for text with no words", () => {
    expect(searchRecipes(library, "   ", {})).toEqual({ groups: [], total: 0 });
  });
});

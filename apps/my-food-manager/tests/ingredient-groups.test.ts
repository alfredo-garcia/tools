import { describe, expect, it } from "vitest";
import { classifyIngredients, hasIngredients } from "@/lib/domain/ingredient-groups";

const catalog = {
  sal: { name: "sal", staple: true },
  leche: { name: "leche" },
  huevo: { name: "huevo" },
  nata: { name: "nata" },
  ajo: { name: "ajo" },
  pan: { name: "pan" },
} as never;
const recipe = (...ings: string[]) => ({ ingredients: ings.map((ing) => ({ ing })) }) as never;
const sets = (have: string[], buy: string[]) => [new Set(have), new Set(buy)] as const;

describe("classifyIngredients", () => {
  it("sorts into Faltan, En mi lista de la compra and Ya tengo", () => {
    const [have, buy] = sets(["huevo"], ["nata"]);
    expect(classifyIngredients(recipe("leche", "nata", "huevo"), catalog, have, buy)).toEqual({
      faltan: ["leche"],
      lista: ["nata"],
      tengo: ["huevo"],
    });
  });

  it("lets Tengo win over Comprar", () => {
    const [have, buy] = sets(["ajo"], ["ajo"]);
    expect(classifyIngredients(recipe("ajo"), catalog, have, buy)).toEqual({
      faltan: [],
      lista: [],
      tengo: ["ajo"],
    });
  });

  it("counts staples as Ya tengo, even when they are on the list", () => {
    const [have, buy] = sets([], ["sal"]);
    expect(classifyIngredients(recipe("sal"), catalog, have, buy).tengo).toEqual(["sal"]);
  });

  it("lists each ingredient once, in recipe order, optional lines included", () => {
    const r = {
      ingredients: [
        { ing: "leche" },
        { ing: "pan" },
        { ing: "leche", optional: true },
        { ing: "nata", optional: true },
      ],
    } as never;
    const [have, buy] = sets([], []);
    expect(classifyIngredients(r, catalog, have, buy).faltan).toEqual(["leche", "pan", "nata"]);
  });

  it("leaves out ingredients that are not in the catalog", () => {
    const [have, buy] = sets([], []);
    const g = classifyIngredients(recipe("desconocido"), catalog, have, buy);
    expect(g).toEqual({ faltan: [], lista: [], tengo: [] });
    expect(hasIngredients(g)).toBe(false);
  });

  it("is empty for a recipe with no ingredients", () => {
    const [have, buy] = sets([], []);
    expect(hasIngredients(classifyIngredients(recipe(), catalog, have, buy))).toBe(false);
  });
});

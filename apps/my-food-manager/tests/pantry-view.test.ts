import { describe, expect, it } from "vitest";
import {
  baseList,
  buyCount,
  catalogItems,
  familyOptions,
  inFamily,
  matchesText,
  pantryWithPending,
  sortByName,
  type IngredientItem,
  type ListQuery,
} from "@/lib/domain/pantry-view";

const ITEMS: IngredientItem[] = catalogItems({
  arroz: { name: "arroz", synonyms: [], family: "grains-and-flours", staple: false },
  patata: { name: "patata", synonyms: ["papa", "potato"], family: "vegetables", staple: false },
  nata: { name: "nata", synonyms: ["crema de leche"], family: "eggs-and-dairy", staple: false },
  leche: { name: "leche", synonyms: [], family: "eggs-and-dairy", staple: false },
  sal: { name: "sal", synonyms: [], family: "spices-and-herbs", staple: true },
  agua: { name: "agua", synonyms: [], family: undefined, staple: true },
  extra: { name: "extra", synonyms: [], family: "mystery", staple: false },
});
const VOCAB = {
  vegetables: { label: "Verduras y hortalizas" },
  "eggs-and-dairy": { label: "Huevos y lácteos" },
  "grains-and-flours": { label: "Cereales y harinas" },
  "spices-and-herbs": { label: "Especias y hierbas" },
  other: { label: "Otros" },
};
const view = pantryWithPending({ have: ["arroz", "patata"], to_buy: ["nata"] }, []);
const query = (over: Partial<ListQuery> = {}): ListQuery => ({
  tab: "despensa",
  state: "tengo",
  applied: "",
  keepVisible: new Set(),
  struck: new Set(),
  ...over,
});
const ids = (list: IngredientItem[]) => sortByName(list).map((i) => i.id);

describe("pantryWithPending", () => {
  it("applies pending operations in order on top of the stored pantry", () => {
    const v = pantryWithPending({ have: ["arroz"], to_buy: [] }, [
      { id: "1", kind: "pantry.setHave", ingredient: "leche", value: true },
      { id: "2", kind: "pantry.setHave", ingredient: "arroz", value: false },
      { id: "3", kind: "pantry.setBuy", ingredient: "nata", value: true },
      { id: "4", kind: "pantry.setBuy", ingredient: "nata", value: false },
    ]);
    expect([...v.have]).toEqual(["leche"]);
    expect([...v.buy]).toEqual([]);
  });
});

describe("baseList", () => {
  it("Tengo lists what is at home, staples included", () => {
    expect(ids(baseList(ITEMS, view, query()))).toEqual(["agua", "arroz", "patata", "sal"]);
  });

  it("No tengo lists what is missing and leaves staples out", () => {
    expect(ids(baseList(ITEMS, view, query({ state: "notengo" })))).toEqual([
      "extra",
      "leche",
      "nata",
    ]);
  });

  it("Todos lists the whole catalog", () => {
    expect(baseList(ITEMS, view, query({ state: "todos" }))).toHaveLength(ITEMS.length);
  });

  it("keeps a row whose Tengo changed while it was shown", () => {
    const list = baseList(
      ITEMS,
      view,
      query({ state: "notengo", keepVisible: new Set(["arroz"]) }),
    );
    expect(ids(list)).toContain("arroz");
  });

  it("an applied search ignores the Tengo / No tengo filter", () => {
    expect(ids(baseList(ITEMS, view, query({ applied: "leche" })))).toEqual(["leche", "nata"]);
  });

  it("Lista shows what is to buy plus rows turned off while shown", () => {
    const l = query({ tab: "lista", struck: new Set(["leche"]) });
    expect(ids(baseList(ITEMS, view, l))).toEqual(["leche", "nata"]);
  });

  it("Lista applies the search too", () => {
    expect(baseList(ITEMS, view, query({ tab: "lista", applied: "arr" }))).toEqual([]);
  });
});

describe("matchesText", () => {
  it("ignores case and accents and matches synonyms", () => {
    expect(matchesText(ITEMS[1], "PAPA")).toBe(true);
    expect(matchesText(ITEMS[2], "crema")).toBe(true);
    expect(matchesText(ITEMS[1], "pápa")).toBe(true);
  });

  it("needs every word in the same name or synonym", () => {
    expect(matchesText(ITEMS[2], "crema leche")).toBe(true);
    expect(matchesText(ITEMS[2], "nata leche")).toBe(false);
  });

  it("keeps ñ distinct from n", () => {
    const item: IngredientItem = {
      id: "a",
      name: "año",
      synonyms: [],
      family: "other",
      staple: false,
    };
    expect(matchesText(item, "ano")).toBe(false);
    expect(matchesText(item, "año")).toBe(true);
  });
});

describe("families", () => {
  it("lists the families in the list, in vocabulary order, unknown last, with counts", () => {
    expect(familyOptions(ITEMS, VOCAB)).toEqual([
      { value: "vegetables", label: "Verduras y hortalizas", count: 1 },
      { value: "eggs-and-dairy", label: "Huevos y lácteos", count: 2 },
      { value: "grains-and-flours", label: "Cereales y harinas", count: 1 },
      { value: "spices-and-herbs", label: "Especias y hierbas", count: 1 },
      { value: "other", label: "Otros", count: 1 },
      { value: "mystery", label: "Mystery", count: 1 },
    ]);
  });

  it("filters by one family; ingredients with no family count as Otros", () => {
    expect(ids(inFamily(ITEMS, "other"))).toEqual(["agua"]);
    expect(inFamily(ITEMS, undefined)).toHaveLength(ITEMS.length);
  });

  it("counts what is to buy", () => {
    expect(buyCount(ITEMS, view)).toBe(1);
  });
});

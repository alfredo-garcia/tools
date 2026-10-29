import { describe, expect, it } from "vitest";
import {
  difficultyLabel,
  findRecipe,
  formatMinutes,
  formatNumber,
  groupIngredients,
  groupTitle,
  ingredientView,
  notesView,
  servingsLabel,
  tagLabels,
  totalMinutes,
} from "@/lib/domain/recipe-detail";
import { buildSnapshot } from "@/lib/domain/snapshot";
import type { Library, Recipe } from "@/lib/schema";
import { fixtureDrive } from "./helpers";

const { files, read } = fixtureDrive();
const library: Library = (await buildSnapshot(files, read)).data;

const line = (over: Partial<Recipe["ingredients"][number]> & { ing: string }) =>
  over as Recipe["ingredients"][number];

describe("time", () => {
  it("sums prep, cook and rest, treating missing parts as 0", () => {
    expect(totalMinutes({ prep: 10, cook: 25, rest: 5 })).toBe(40);
    expect(totalMinutes({ cook: 25 })).toBe(25);
  });
  it("is undefined with no time data", () => {
    expect(totalMinutes(undefined)).toBeUndefined();
    expect(totalMinutes({})).toBeUndefined();
  });
  it("formats minutes and hours", () => {
    expect(formatMinutes(25)).toBe("25 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(95)).toBe("1 h 35 min");
    expect(formatMinutes(undefined)).toBe("-");
  });
});

describe("facts", () => {
  it("formats numbers with a decimal comma and at most 2 decimals", () => {
    expect(formatNumber(0.5)).toBe("0,5");
    expect(formatNumber(1.25)).toBe("1,25");
    expect(formatNumber(1.333)).toBe("1,33");
    expect(formatNumber(200)).toBe("200");
  });
  it("labels difficulty and servings, with - when missing", () => {
    expect(difficultyLabel("easy")).toBe("Fácil");
    expect(difficultyLabel("medium")).toBe("Media");
    expect(difficultyLabel("hard")).toBe("Difícil");
    expect(difficultyLabel(undefined)).toBe("-");
    expect(servingsLabel({ qty: 12, unit: "units" })).toBe("12 unidades");
    expect(servingsLabel({ qty: 4, unit: "people" })).toBe("4 personas");
    expect(servingsLabel({ unit: "people" })).toBe("-");
    expect(servingsLabel(undefined)).toBe("-");
  });
  it("resolves tag labels and keeps unknown ids", () => {
    expect(tagLabels(library, "cuisine", ["spanish", "martian"])).toEqual(["española", "martian"]);
    expect(tagLabels(library, "technique", undefined)).toEqual([]);
  });
});

describe("ingredients", () => {
  it("puts ungrouped lines first, then groups in order of first appearance", () => {
    const groups = groupIngredients([
      line({ ing: "a", group: "relleno" }),
      line({ ing: "b" }),
      line({ ing: "c", group: "masa" }),
      line({ ing: "d", group: "relleno" }),
      line({ ing: "e", group: "  " }),
    ]);
    expect(groups.map((g) => g.group)).toEqual([undefined, "relleno", "masa"]);
    expect(groups[0].lines.map((l) => l.ing)).toEqual(["b", "e"]);
    expect(groups[1].lines.map((l) => l.ing)).toEqual(["a", "d"]);
  });
  it("titles a group slug", () => {
    expect(groupTitle("salsa-holandesa")).toBe("Salsa holandesa");
  });
  it("formats measured lines with abbreviated or pluralized units and notes", () => {
    expect(
      ingredientView(
        line({ ing: "harina-de-trigo", qty: 200, unit: "g", note: "tamizada" }),
        library,
      ),
    ).toMatchObject({ quantity: "200 g", name: "harina de trigo", detail: "tamizada" });
    expect(ingredientView(line({ ing: "huevo", qty: 1, unit: "unit" }), library).quantity).toBe(
      "1 unidad",
    );
    expect(ingredientView(line({ ing: "huevo", qty: 4, unit: "unit" }), library).quantity).toBe(
      "4 unidades",
    );
    expect(ingredientView(line({ ing: "limon", qty: 0.5, unit: "unit" }), library).quantity).toBe(
      "0,5 unidades",
    );
  });
  it("shows the unit label, without a number, for unmeasured lines", () => {
    expect(ingredientView(line({ ing: "sal", unit: "to-taste" }), library)).toMatchObject({
      quantity: "",
      detail: "al gusto",
    });
    expect(ingredientView(line({ ing: "sal", unit: "pinch", note: "fina" }), library).detail).toBe(
      "pizca · fina",
    );
  });
  it("shows - when a measurable line has no quantity", () => {
    expect(ingredientView(line({ ing: "pan" }), library).quantity).toBe("-");
    expect(ingredientView(line({ ing: "pan", unit: "g" }), library).quantity).toBe("-");
  });
  it("falls back to the raw id for ingredients missing from the catalog", () => {
    expect(ingredientView(line({ ing: "desconocido", qty: 1, unit: "g" }), library).name).toBe(
      "desconocido",
    );
  });
  it("marks optional lines and links only to recipes that exist", () => {
    expect(ingredientView(line({ ing: "sal", optional: true }), library).optional).toBe(true);
    expect(
      ingredientView(line({ ing: "bizcocho", recipe: "bizcocho" }), library).linkedRecipeId,
    ).toBe("bizcocho");
    expect(
      ingredientView(line({ ing: "x", recipe: "no-existe" }), library).linkedRecipeId,
    ).toBeUndefined();
  });
});

describe("notes", () => {
  const base = findRecipe(library, "bizcocho")!;
  it("is undefined when there is nothing to show", () => {
    expect(notesView({ ...base, notes: "", variations: "", source: undefined })).toBeUndefined();
  });
  it("splits bullet notes and joins wrapped lines", () => {
    const view = notesView({
      ...base,
      notes: "- uno\n  sigue\n- dos",
      variations: "",
      source: undefined,
    });
    expect(view?.notes).toEqual(["uno sigue", "dos"]);
  });
  it("shows the source type, author and url", () => {
    const view = notesView({
      ...base,
      notes: "",
      source: { type: "instagram", author: "Ana", url: "https://x.test/p", original: undefined },
    });
    expect(view?.source).toEqual({ text: "Instagram · Ana", url: "https://x.test/p" });
  });
  it("keeps variations on their own", () => {
    expect(
      notesView({ ...base, notes: "", variations: "Con pasas.", source: undefined })?.variations,
    ).toBe("Con pasas.");
  });
});

describe("findRecipe", () => {
  it("finds by id and returns undefined for unknown ids", () => {
    expect(findRecipe(library, "bizcocho")?.title).toBe("Bizcocho");
    expect(findRecipe(library, "nope")).toBeUndefined();
  });
});

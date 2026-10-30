import { describe, expect, it } from "vitest";
import {
  addDays,
  dayHeading,
  datesFrom,
  formatDay,
  formatRange,
  localDate,
  mondayOf,
  weekDates,
} from "@/lib/domain/plan-calendar";
import { missingIngredients, planWithPending, titleMatches } from "@/lib/domain/plan-view";
import type { Plan, PlanOp } from "@/lib/schema";

describe("plan calendar", () => {
  it("finds Monday of any weekday, Sunday included", () => {
    expect(mondayOf("2026-10-30")).toBe("2026-10-26"); // Friday
    expect(mondayOf("2026-11-01")).toBe("2026-10-26"); // Sunday
    expect(mondayOf("2026-11-02")).toBe("2026-11-02"); // Monday
  });

  it("lists the days from today and the weeks from the current one", () => {
    expect(datesFrom("2026-10-30", 3)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01"]);
    expect(weekDates("2026-10-30", 0)[0]).toBe("2026-10-26");
    expect(weekDates("2026-10-30", 1)).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
  });

  it("adds days across month, year and daylight saving changes", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("formats headings and ranges in Spanish", () => {
    expect(dayHeading("2026-10-30", 0)).toBe("Hoy");
    expect(dayHeading("2026-10-31", 1)).toBe("Mañana");
    expect(dayHeading("2026-11-05", 6)).toBe("jueves 5 nov");
    expect(formatDay("2026-10-30")).toBe("viernes 30 oct");
    expect(formatRange("2026-10-26", "2026-11-01")).toBe("26 oct – 1 nov");
  });

  it("uses the device's local date", () => {
    expect(localDate(new Date(2026, 9, 30, 23, 59))).toBe("2026-10-30");
    expect(localDate(new Date(2026, 0, 5, 0, 0))).toBe("2026-01-05");
  });
});

const PLAN: Plan = {
  days: {
    "2026-10-30": [
      { slot: "lunch", dishes: [{ recipe: "a" }, { text: "Fruta" }] },
      { slot: "snack", dishes: [{ text: "Yogur" }] },
      { slot: "lunch", dishes: [{ recipe: "b" }] },
      { slot: "dinner", dishes: [{ recipe: "gone" }] },
    ],
  },
};
const IDS = new Set(["a", "b", "c"]);
const op = (kind: PlanOp["kind"], date: string, meal: PlanOp["meal"], recipe: string): PlanOp => ({
  id: `${kind}${recipe}`,
  kind,
  date,
  meal,
  recipe,
});

describe("planWithPending", () => {
  it("groups the dishes of all meals of a slot, hides snack and unknown recipes", () => {
    const v = planWithPending(PLAN, [], IDS);
    expect(v["2026-10-30"].lunch).toEqual([{ recipe: "a" }, { text: "Fruta" }, { recipe: "b" }]);
    expect(v["2026-10-30"].dinner).toEqual([]);
    expect(Object.keys(v["2026-10-30"])).toEqual(["breakfast", "lunch", "dinner"]);
  });

  it("applies pending adds and removes in order, one occurrence at a time", () => {
    const v = planWithPending(
      PLAN,
      [
        op("plan.addRecipe", "2026-10-30", "lunch", "c"),
        op("plan.addRecipe", "2026-10-30", "lunch", "c"),
        op("plan.removeRecipe", "2026-10-30", "lunch", "c"),
        op("plan.removeRecipe", "2026-10-30", "lunch", "a"),
        op("plan.addRecipe", "2026-11-02", "breakfast", "a"),
        { id: "p", kind: "pantry.setBuy", ingredient: "x", value: true },
      ],
      IDS,
    );
    expect(v["2026-10-30"].lunch).toEqual([{ text: "Fruta" }, { recipe: "b" }, { recipe: "c" }]);
    expect(v["2026-11-02"].breakfast).toEqual([{ recipe: "a" }]);
  });

  it("works with no plan at all", () => {
    expect(
      planWithPending(undefined, [op("plan.addRecipe", "2026-11-02", "dinner", "a")], IDS),
    ).toEqual({
      "2026-11-02": { breakfast: [], lunch: [], dinner: [{ recipe: "a" }] },
    });
  });
});

describe("missingIngredients", () => {
  const catalog = {
    sal: { name: "sal", staple: true },
    leche: { name: "leche" },
    huevo: { name: "huevo" },
    nata: { name: "nata" },
  } as never;
  const recipe = {
    ingredients: [
      { ing: "sal" },
      { ing: "leche" },
      { ing: "huevo" },
      { ing: "leche", optional: true },
      { ing: "desconocido" },
      { ing: "nata", optional: true },
    ],
  } as never;

  it("lists non-staple ingredients not at home, once each, optional ones included", () => {
    expect(missingIngredients(recipe, catalog, new Set(["huevo"]))).toEqual(["leche", "nata"]);
  });

  it("is empty when everything is at home or a staple", () => {
    expect(missingIngredients(recipe, catalog, new Set(["leche", "huevo", "nata"]))).toEqual([]);
  });
});

describe("titleMatches", () => {
  it("needs every word, ignoring case and accents", () => {
    expect(titleMatches("Espaguetis a la boloñesa", "ESPAGUETIS pollo")).toBe(false);
    expect(titleMatches("Espaguetis a la boloñesa", "ESPAGUETIS bolo")).toBe(true);
    expect(titleMatches("Espaguetis a la boloñesa", "espaguetis boloñesa")).toBe(true);
    expect(titleMatches("Crema de zanahoria", "zanahória")).toBe(true);
    expect(titleMatches("Tortilla de patatas", "pollo")).toBe(false);
  });
});

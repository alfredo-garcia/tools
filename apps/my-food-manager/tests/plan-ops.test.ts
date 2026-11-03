import { describe, expect, it } from "vitest";
import { parsePlan } from "@/lib/domain/parse";
import { PlanParseError, applyPlanOps, earliestPlanDate } from "@/lib/domain/plan-ops";
import { parse } from "yaml";

const NOW = new Date("2026-10-30T15:00:00Z"); // 10:00 on 2026-10-30 at -05:00
const RECIPES = new Set(["pasta-bolonesa", "pollo-al-ajillo", "bizcocho"]);

const FILE = `# Meal plan header
updated: 2026-10-29T10:00:00-05:00
days:
  2026-10-30:
    - slot: lunch
      label: En casa
      dishes:
        - { recipe: pasta-bolonesa, servings: 2 }
        - { text: Fruta }
    - slot: snack
      dishes:
        - { text: Yogur }
    - slot: dinner
      dishes:
        - { recipe: pollo-al-ajillo }
`;
const EMPTY = "# header\nupdated: 2026-10-30T15:53:14-05:00\ndays: {}\n";

const add = (id: string, date: string, meal: string, recipe: string) => ({
  id,
  kind: "plan.addRecipe",
  date,
  meal,
  recipe,
});
const remove = (id: string, date: string, meal: string, recipe: string) => ({
  id,
  kind: "plan.removeRecipe",
  date,
  meal,
  recipe,
});
const addOut = (id: string, date: string, meal: string, out: string) => ({
  id,
  kind: "plan.addOut",
  date,
  meal,
  out,
});
const removeOut = (id: string, date: string, meal: string, out: string) => ({
  id,
  kind: "plan.removeOut",
  date,
  meal,
  out,
});
const days = (text: string) => (parse(text) as { days: Record<string, unknown[]> }).days;

describe("applyPlanOps", () => {
  it("adds a dish to the last meal of the slot, keeping labels, servings, text dishes and snack", () => {
    const r = applyPlanOps(FILE, [add("a", "2026-10-30", "lunch", "bizcocho")], RECIPES, NOW);
    expect(r.results).toEqual([{ id: "a", status: "applied" }]);
    expect(days(r.text)["2026-10-30"]).toEqual([
      {
        slot: "lunch",
        label: "En casa",
        dishes: [
          { recipe: "pasta-bolonesa", servings: 2 },
          { text: "Fruta" },
          { recipe: "bizcocho" },
        ],
      },
      { slot: "snack", dishes: [{ text: "Yogur" }] },
      { slot: "dinner", dishes: [{ recipe: "pollo-al-ajillo" }] },
    ]);
    expect(r.text.startsWith("# Meal plan header")).toBe(true);
    expect(r.text).toContain("updated: 2026-10-30T10:00:00-05:00");
  });

  it("creates the meal in slot order, between lunch and snack when needed, and the day in date order", () => {
    const r = applyPlanOps(
      FILE,
      [
        add("a", "2026-10-30", "breakfast", "bizcocho"),
        add("b", "2026-10-29", "dinner", "bizcocho"),
      ],
      RECIPES,
      NOW,
    );
    expect(Object.keys(days(r.text))).toEqual(["2026-10-29", "2026-10-30"]);
    expect((days(r.text)["2026-10-30"] as { slot: string }[]).map((m) => m.slot)).toEqual([
      "breakfast",
      "lunch",
      "snack",
      "dinner",
    ]);
  });

  it("allows the same recipe twice in a slot", () => {
    const r = applyPlanOps(
      EMPTY,
      [add("a", "2026-11-02", "lunch", "bizcocho"), add("b", "2026-11-02", "lunch", "bizcocho")],
      RECIPES,
      NOW,
    );
    expect(days(r.text)["2026-11-02"]).toEqual([
      { slot: "lunch", dishes: [{ recipe: "bizcocho" }, { recipe: "bizcocho" }] },
    ]);
    expect(r.plan.days["2026-11-02"][0].dishes).toHaveLength(2);
  });

  it("removes one occurrence, and cleans empty meals and days", () => {
    const twice = applyPlanOps(
      EMPTY,
      [add("a", "2026-11-02", "lunch", "bizcocho"), add("b", "2026-11-02", "lunch", "bizcocho")],
      RECIPES,
      NOW,
    ).text;
    const one = applyPlanOps(twice, [remove("c", "2026-11-02", "lunch", "bizcocho")], RECIPES, NOW);
    expect(days(one.text)["2026-11-02"]).toEqual([
      { slot: "lunch", dishes: [{ recipe: "bizcocho" }] },
    ]);
    const none = applyPlanOps(
      one.text,
      [remove("d", "2026-11-02", "lunch", "bizcocho")],
      RECIPES,
      NOW,
    );
    expect(days(none.text)).toEqual({});
  });

  it("is a no-op, without writing, when the dish to remove is not there", () => {
    const r = applyPlanOps(FILE, [remove("a", "2026-10-30", "dinner", "bizcocho")], RECIPES, NOW);
    expect(r.results[0].status).toBe("unchanged");
    expect(r.changed).toBe(false);
    expect(r.text).toBe(FILE);
  });

  it("rejects bad operations one by one without failing the batch", () => {
    const r = applyPlanOps(
      FILE,
      [
        { id: "k", kind: "plan.nope", date: "2026-10-30", meal: "lunch", recipe: "bizcocho" },
        add("d1", "30-10-2026", "lunch", "bizcocho"),
        add("d2", "2026-02-31", "lunch", "bizcocho"),
        add("past", "2026-10-28", "lunch", "bizcocho"),
        add("m", "2026-10-30", "snack", "bizcocho"),
        add("r", "2026-10-30", "lunch", "inventada"),
        { id: "none", kind: "plan.addRecipe", date: "2026-10-30", meal: "lunch" },
        add("ok", "2026-10-30", "lunch", "bizcocho"),
      ],
      RECIPES,
      NOW,
    );
    expect(r.results.map((x) => x.status)).toEqual([
      "rejected",
      "rejected",
      "rejected",
      "rejected",
      "rejected",
      "rejected",
      "rejected",
      "applied",
    ]);
    expect(r.results.every((x) => x.status !== "rejected" || x.error?.code === "INVALID_OP")).toBe(
      true,
    );
  });

  it("accepts yesterday in -05:00 so a device in another time zone is not refused", () => {
    expect(earliestPlanDate(NOW)).toBe("2026-10-29");
    const r = applyPlanOps(EMPTY, [add("a", "2026-10-29", "lunch", "bizcocho")], RECIPES, NOW);
    expect(r.results[0].status).toBe("applied");
  });

  it("returns the plan from the earliest allowed day, with recipe and text dishes only", () => {
    const r = applyPlanOps(FILE, [add("a", "2026-11-03", "lunch", "bizcocho")], RECIPES, NOW);
    expect(r.plan.days["2026-10-30"][0]).toEqual({
      slot: "lunch",
      dishes: [{ recipe: "pasta-bolonesa" }, { text: "Fruta" }],
    });
    expect(Object.keys(r.plan.days)).toEqual(["2026-10-30", "2026-11-03"]);
  });

  it("refuses a file it cannot read", () => {
    expect(() => applyPlanOps("days: [1\n", [], RECIPES, NOW)).toThrow(PlanParseError);
    expect(() => applyPlanOps("days: 3\n", [], RECIPES, NOW)).toThrow(PlanParseError);
  });
});

describe("applyPlanOps with out dishes (ADR 005)", () => {
  const OUT_FILE = `updated: 2026-10-29T10:00:00-05:00
days:
  2026-10-31:
    - slot: lunch
      label: En casa
      dishes:
        - { recipe: pasta-bolonesa }
    - slot: lunch
      label: Con amigos
      dishes:
        - { out: eat-out }
    - slot: dinner
      note: Viernes
      dishes:
        - { out: delivery }
        - { text: Ensalada }
    - slot: dinner
      dishes:
        - { out: takeaway }
`;
  const D = "2026-10-31";

  it("puts eat-out in a meal of its own, in slot order", () => {
    const r = applyPlanOps(FILE, [addOut("a", "2026-10-30", "breakfast", "eat-out")], RECIPES, NOW);
    expect(r.results).toEqual([{ id: "a", status: "applied" }]);
    expect(days(r.text)["2026-10-30"][0]).toEqual({
      slot: "breakfast",
      dishes: [{ out: "eat-out" }],
    });
  });

  it("refuses eat-out in a slot with any dish, text dishes included", () => {
    const r = applyPlanOps(FILE, [addOut("a", "2026-10-30", "lunch", "eat-out")], RECIPES, NOW);
    expect(r.changed).toBe(false);
    expect(r.results[0]).toMatchObject({ status: "rejected", error: { code: "INVALID_OP" } });
  });

  it("appends delivery to the last meal of the slot, next to its recipes", () => {
    const r = applyPlanOps(FILE, [addOut("a", "2026-10-30", "dinner", "delivery")], RECIPES, NOW);
    expect(days(r.text)["2026-10-30"][2]).toEqual({
      slot: "dinner",
      dishes: [{ recipe: "pollo-al-ajillo" }, { out: "delivery" }],
    });
  });

  it("is unchanged when the mark is already in the slot, in any of its meals", () => {
    const r = applyPlanOps(
      OUT_FILE,
      [addOut("a", D, "lunch", "eat-out"), addOut("b", D, "dinner", "delivery")],
      RECIPES,
      NOW,
    );
    expect(r.results.map((x) => x.status)).toEqual(["unchanged", "unchanged"]);
    expect(r.text).toBe(OUT_FILE);
  });

  it("refuses delivery and recipes in a slot that has eat-out", () => {
    const r = applyPlanOps(
      OUT_FILE,
      [addOut("a", D, "lunch", "delivery"), add("b", D, "lunch", "bizcocho")],
      RECIPES,
      NOW,
    );
    expect(r.results.map((x) => x.status)).toEqual(["rejected", "rejected"]);
    expect(r.changed).toBe(false);
  });

  it("still adds recipes to a slot with delivery", () => {
    const r = applyPlanOps(OUT_FILE, [add("a", D, "dinner", "bizcocho")], RECIPES, NOW);
    expect(r.results[0].status).toBe("applied");
    expect(days(r.text)[D][3]).toEqual({
      slot: "dinner",
      dishes: [{ out: "takeaway" }, { recipe: "bizcocho" }],
    });
  });

  it("removes a mark, cleaning its meal, and keeps labels, notes and unknown values", () => {
    const r = applyPlanOps(
      OUT_FILE,
      [
        removeOut("a", D, "lunch", "eat-out"),
        removeOut("b", D, "dinner", "delivery"),
        removeOut("c", D, "breakfast", "delivery"),
      ],
      RECIPES,
      NOW,
    );
    expect(r.results.map((x) => x.status)).toEqual(["applied", "applied", "unchanged"]);
    expect(days(r.text)[D]).toEqual([
      { slot: "lunch", label: "En casa", dishes: [{ recipe: "pasta-bolonesa" }] },
      { slot: "dinner", note: "Viernes", dishes: [{ text: "Ensalada" }] },
      { slot: "dinner", dishes: [{ out: "takeaway" }] },
    ]);
  });

  it("rejects an unknown out value", () => {
    const r = applyPlanOps(FILE, [addOut("a", "2026-10-30", "dinner", "takeaway")], RECIPES, NOW);
    expect(r.results[0].status).toBe("rejected");
  });

  it("carries known marks in the plan it returns, and leaves unknown ones out", () => {
    const r = applyPlanOps(OUT_FILE, [], RECIPES, NOW);
    expect(r.plan.days[D].map((m) => m.dishes)).toEqual([
      [{ recipe: "pasta-bolonesa" }],
      [{ out: "eat-out" }],
      [{ out: "delivery" }, { text: "Ensalada" }],
      [],
    ]);
    expect(parsePlan(OUT_FILE).days[D].map((m) => m.dishes)).toEqual(
      r.plan.days[D].map((m) => m.dishes),
    );
  });
});

describe("parsePlan", () => {
  it("reads meals and dishes, dropping labels, notes and servings", () => {
    const plan = parsePlan(FILE);
    expect(plan.updated).toBe("2026-10-29T10:00:00-05:00");
    expect(plan.days["2026-10-30"].map((m) => m.slot)).toEqual(["lunch", "snack", "dinner"]);
    expect(plan.days["2026-10-30"][0].dishes).toEqual([
      { recipe: "pasta-bolonesa" },
      { text: "Fruta" },
    ]);
  });

  it("reads an empty plan", () => {
    expect(parsePlan(EMPTY).days).toEqual({});
  });
});

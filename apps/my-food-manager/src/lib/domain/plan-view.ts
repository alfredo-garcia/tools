import type { Plan, PlanDish, PlanMeal, PlanOut, Recipe } from "@/lib/schema";
import { isPantryOp, isReviewOp, type PendingOp } from "./pantry-view";
import { normalize } from "./search";

export const PLAN_MEAL_LABELS: readonly { meal: PlanMeal; label: string; to: string }[] = [
  { meal: "breakfast", label: "Desayuno", to: "al desayuno" },
  { meal: "lunch", label: "Almuerzo", to: "al almuerzo" },
  { meal: "dinner", label: "Cena", to: "a la cena" },
];

/** How a mark reads in the slot (the schema's label) and in the picker's option. */
export const OUT_LABELS: Record<PlanOut, { label: string; option: string }> = {
  "eat-out": { label: "Comer fuera", option: "Salir fuera" },
  delivery: { label: "Pedir a domicilio", option: "Pedir" },
};

export type DayDishes = Record<PlanMeal, PlanDish[]>;
export type PlanView = Record<string, DayDishes>;

const emptyDay = (): DayDishes => ({ breakfast: [], lunch: [], dinner: [] });
/** Shared, never mutated: the day with nothing planned. */
export const EMPTY_DAY: DayDishes = Object.freeze(emptyDay()) as DayDishes;

/**
 * The plan as shown: the stored dishes of each shown slot (all meals of that slot together, in file order,
 * `snack` left out) plus the pending changes applied in order. Recipes that are not in the library are dropped.
 */
export function planWithPending(
  plan: Plan | undefined,
  pending: readonly PendingOp[],
  recipeIds: ReadonlySet<string>,
): PlanView {
  const view: PlanView = {};
  const day = (date: string) => (view[date] ??= emptyDay());
  for (const [date, meals] of Object.entries(plan?.days ?? {}))
    for (const m of meals)
      if (m.slot === "breakfast" || m.slot === "lunch" || m.slot === "dinner")
        day(date)[m.slot].push(...m.dishes);
  for (const op of pending) {
    if (isPantryOp(op) || isReviewOp(op)) continue;
    const list = day(op.date)[op.meal];
    if (op.kind === "plan.addRecipe") list.push({ recipe: op.recipe });
    else if (op.kind === "plan.addOut") list.push({ out: op.out });
    else {
      const at =
        "out" in op
          ? list.findIndex((d) => d.out === op.out)
          : list.findIndex((d) => d.recipe === op.recipe);
      if (at >= 0) list.splice(at, 1);
    }
  }
  for (const d of Object.values(view))
    for (const meal of Object.keys(d) as PlanMeal[])
      d[meal] = d[meal].filter((x) => x.recipe === undefined || recipeIds.has(x.recipe));
  return view;
}

/** A slot's dishes as shown: marks first, then the rest, each group in its own order. */
export const outFirst = (dishes: readonly PlanDish[]): PlanDish[] => [
  ...dishes.filter((d) => d.out),
  ...dishes.filter((d) => !d.out),
];

export const hasEatOut = (dishes: readonly PlanDish[]) => dishes.some((d) => d.out === "eat-out");

/** Which marks the picker offers for a slot (ADR 005): `eat-out` only when empty, `delivery` once and never with `eat-out`. */
export function outOptions(dishes: readonly PlanDish[]): Record<PlanOut, boolean> {
  return {
    "eat-out": dishes.length === 0,
    delivery: !hasEatOut(dishes) && !dishes.some((d) => d.out === "delivery"),
  };
}

/**
 * The recipes the picker lists: the suggested recipe (the one Al came from) first, even when it is Descartada, then the
 * pickable ones in their usual order without repeating it. An unknown suggestion is ignored.
 */
export function pickerRecipes(
  pickable: readonly Recipe[],
  all: readonly Recipe[],
  suggestedId: string | undefined,
): Recipe[] {
  const suggested = suggestedId ? all.find((r) => r.id === suggestedId) : undefined;
  return suggested ? [suggested, ...pickable.filter((r) => r.id !== suggested.id)] : [...pickable];
}

/** The recipe picker's search: the title holds every word of the applied text, ignoring case and accents. */
export function titleMatches(title: string, applied: string): boolean {
  const haystack = normalize(title);
  return normalize(applied)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => haystack.includes(w));
}

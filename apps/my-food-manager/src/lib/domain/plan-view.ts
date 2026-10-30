import type { Library, Plan, PlanDish, PlanMeal, Recipe } from "@/lib/schema";
import { isPantryOp, isReviewOp, type PendingOp } from "./pantry-view";
import { normalize } from "./search";

export const PLAN_MEAL_LABELS: readonly { meal: PlanMeal; label: string; to: string }[] = [
  { meal: "breakfast", label: "Desayuno", to: "al desayuno" },
  { meal: "lunch", label: "Almuerzo", to: "al almuerzo" },
  { meal: "dinner", label: "Cena", to: "a la cena" },
];

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
    else {
      const at = list.findIndex((d) => d.recipe === op.recipe);
      if (at >= 0) list.splice(at, 1);
    }
  }
  for (const d of Object.values(view))
    for (const meal of Object.keys(d) as PlanMeal[])
      d[meal] = d[meal].filter((x) => x.recipe === undefined || recipeIds.has(x.recipe));
  return view;
}

/** Catalog ids of the recipe's ingredients that are neither a staple nor at home, each once, in recipe order (PRD FR-13). */
export function missingIngredients(
  recipe: Pick<Recipe, "ingredients">,
  catalog: Library["ingredients"],
  have: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const line of recipe.ingredients) {
    const entry = catalog[line.ing];
    if (!entry || entry.staple || have.has(line.ing) || out.includes(line.ing)) continue;
    out.push(line.ing);
  }
  return out;
}

/** The recipe picker's search: the title holds every word of the applied text, ignoring case and accents. */
export function titleMatches(title: string, applied: string): boolean {
  const haystack = normalize(title);
  return normalize(applied)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => haystack.includes(w));
}

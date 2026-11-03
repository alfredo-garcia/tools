import { parseDocument } from "yaml";
import type { OpResult, Plan, PlanDish, PlanMeal, PlanOut } from "@/lib/schema";
import { PLAN_MEALS, isPlanOut } from "@/lib/schema";
import { timestampWithOffset, type RawOp } from "./pantry-ops";

export class PlanParseError extends Error {}

/** Slot order of the file; `snack` is kept in place even though the app never shows or creates it. */
const SLOT_ORDER = ["breakfast", "lunch", "snack", "dinner"];
const RECIPE_KINDS = ["plan.addRecipe", "plan.removeRecipe"];
const OUT_KINDS = ["plan.addOut", "plan.removeOut"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Dish = Record<string, unknown>;
type Meal = { slot?: unknown; dishes?: Dish[] } & Record<string, unknown>;
type Days = Record<string, Meal[]>;

export interface PlanApplyResult {
  text: string;
  changed: boolean;
  results: OpResult[];
  plan: Plan;
}

const reject = (id: string, message: string): OpResult => ({
  id,
  status: "rejected",
  error: { code: "INVALID_OP", message },
});

const isDate = (s: string) => DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

/** Earliest date an operation may touch: yesterday in `-05:00`, so a device in another time zone is never wrongly refused. */
export function earliestPlanDate(now: Date): string {
  const shifted = new Date(now.getTime() - 5 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

const slotIndex = (slot: unknown) => {
  const i = SLOT_ORDER.indexOf(String(slot));
  return i < 0 ? SLOT_ORDER.length : i;
};

/** The plan as the snapshot carries it (days from `from` on; meals with recipe, text and known `out` dishes only). */
export function planFromDays(updated: unknown, days: Days, from?: string): Plan {
  const out: Plan["days"] = {};
  for (const [date, meals] of Object.entries(days)) {
    if (from && date < from) continue;
    const list = meals.map((m) => {
      const dishes: PlanDish[] = [];
      for (const d of m.dishes ?? []) {
        if (typeof d.recipe === "string") dishes.push({ recipe: d.recipe });
        else if (typeof d.text === "string") dishes.push({ text: d.text });
        else if (isPlanOut(d.out)) dishes.push({ out: d.out });
      }
      return { slot: String(m.slot), dishes };
    });
    if (list.length) out[date] = list;
  }
  return { updated: typeof updated === "string" ? updated : undefined, days: out };
}

/** Every dish of a slot, across its meals. */
const slotDishes = (days: Days, date: string, slot: PlanMeal) =>
  (days[date] ?? []).filter((m) => m.slot === slot).flatMap((m) => m.dishes ?? []);

/** Appends the dish to the last meal of the slot, or to a new meal in slot order (always new with `ownMeal`). */
function addDish(days: Days, date: string, slot: PlanMeal, dish: Dish, ownMeal = false) {
  const meals = (days[date] ??= []);
  const last = ownMeal ? undefined : [...meals].reverse().find((m) => m.slot === slot);
  if (last) {
    (last.dishes ??= []).push(dish);
    return;
  }
  const at = meals.findIndex((m) => slotIndex(m.slot) > slotIndex(slot));
  const meal: Meal = { slot, dishes: [dish] };
  if (at < 0) meals.push(meal);
  else meals.splice(at, 0, meal);
}

/** Removes the first dish of the slot's meals that matches; empty meals and days go away too. */
function removeDish(
  days: Days,
  date: string,
  slot: PlanMeal,
  match: (d: Dish) => boolean,
): boolean {
  const meals = days[date];
  if (!meals) return false;
  for (let i = 0; i < meals.length; i++) {
    if (meals[i].slot !== slot) continue;
    const dishes = meals[i].dishes ?? [];
    const k = dishes.findIndex(match);
    if (k < 0) continue;
    dishes.splice(k, 1);
    if (dishes.length === 0) meals.splice(i, 1);
    if (meals.length === 0) delete days[date];
    return true;
  }
  return false;
}

/**
 * Applies an `out` mark (ADR 005), checked per slot: `eat-out` only in an empty slot and in a meal of its own;
 * `delivery` once, never next to `eat-out`. A mark already in place is `unchanged`.
 */
function addOut(
  days: Days,
  date: string,
  slot: PlanMeal,
  out: PlanOut,
): "applied" | "unchanged" | string {
  const dishes = slotDishes(days, date, slot);
  if (dishes.some((d) => d.out === out)) return "unchanged";
  if (dishes.some((d) => d.out === "eat-out")) return "La comida es fuera de casa";
  if (out === "eat-out" && dishes.length > 0) return "La comida ya tiene platos";
  addDish(days, date, slot, { out }, out === "eat-out");
  return "applied";
}

/**
 * Applies add/remove recipe and `out` operations to the text of `plan.yaml` (plan schema 1, ADR 003, ADR 005). Everything the
 * app does not know (labels, notes, servings, text dishes, snack meals, other top-level fields, the header
 * comment) is kept. The file is rewritten, with `updated` set, only when an operation changed it.
 */
export function applyPlanOps(
  text: string,
  ops: RawOp[],
  recipeIds: ReadonlySet<string>,
  now: Date,
): PlanApplyResult {
  const doc = parseDocument(text);
  if (doc.errors.length > 0)
    throw new PlanParseError(`plan.yaml inválido: ${doc.errors[0].message.split("\n")[0]}`);
  const js = (doc.toJS() ?? {}) as { updated?: unknown; days?: unknown };
  if (js.days != null && (typeof js.days !== "object" || Array.isArray(js.days)))
    throw new PlanParseError("plan.yaml inválido: `days` debe ser un mapa de fechas");
  const days = (js.days ?? {}) as Days;
  const earliest = earliestPlanDate(now);
  const results: OpResult[] = [];
  let changed = false;

  for (const op of ops) {
    const outKind = OUT_KINDS.includes(op.kind);
    if (!RECIPE_KINDS.includes(op.kind) && !outKind) {
      results.push(reject(op.id, "Tipo de operación desconocido"));
    } else if (typeof op.date !== "string" || !isDate(op.date)) {
      results.push(reject(op.id, "La fecha debe tener el formato AAAA-MM-DD"));
    } else if (op.date < earliest) {
      results.push(reject(op.id, "No se puede cambiar un día pasado"));
    } else if (!(PLAN_MEALS as readonly string[]).includes(String(op.meal))) {
      results.push(reject(op.id, "Comida desconocida"));
    } else if (outKind) {
      const meal = op.meal as PlanMeal;
      if (!isPlanOut(op.out)) {
        results.push(reject(op.id, "Valor de fuera de casa desconocido"));
      } else if (op.kind === "plan.removeOut") {
        const out = op.out;
        const removed = removeDish(days, op.date, meal, (d) => d.out === out);
        changed ||= removed;
        results.push({ id: op.id, status: removed ? "applied" : "unchanged" });
      } else {
        const r = addOut(days, op.date, meal, op.out);
        if (r === "applied") changed = true;
        results.push(
          r === "applied" || r === "unchanged" ? { id: op.id, status: r } : reject(op.id, r),
        );
      }
    } else if (typeof op.recipe !== "string" || op.recipe === "") {
      results.push(reject(op.id, "Falta la receta"));
    } else if (op.kind === "plan.addRecipe") {
      if (!recipeIds.has(op.recipe)) {
        results.push(reject(op.id, "Receta desconocida"));
      } else if (slotDishes(days, op.date, op.meal as PlanMeal).some((d) => d.out === "eat-out")) {
        results.push(reject(op.id, "La comida es fuera de casa"));
      } else {
        addDish(days, op.date, op.meal as PlanMeal, { recipe: op.recipe });
        changed = true;
        results.push({ id: op.id, status: "applied" });
      }
    } else if (removeDish(days, op.date, op.meal as PlanMeal, (d) => d.recipe === op.recipe)) {
      changed = true;
      results.push({ id: op.id, status: "applied" });
    } else {
      results.push({ id: op.id, status: "unchanged" });
    }
  }

  if (!changed) return { text, changed, results, plan: planFromDays(js.updated, days, earliest) };

  const updated = timestampWithOffset(now);
  const sorted: Days = {};
  for (const date of Object.keys(days).sort()) sorted[date] = days[date];
  const node = doc.createNode(sorted);
  doc.set("days", node);
  doc.set("updated", updated);
  return {
    text: doc.toString({ lineWidth: 0 }),
    changed,
    results,
    plan: planFromDays(updated, sorted, earliest),
  };
}

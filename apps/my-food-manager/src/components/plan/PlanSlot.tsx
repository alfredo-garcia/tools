"use client";

import { Plus } from "lucide-react";
import { PlanRecipeItem } from "./PlanRecipeItem";
import { formatDay } from "@/lib/domain/plan-calendar";
import type { DayDishes } from "@/lib/domain/plan-view";
import type { PlanMeal, Recipe } from "@/lib/schema";

/** What every slot needs from the screen: the recipes by id and the three things a user can do. */
export interface PlanActions {
  recipes: ReadonlyMap<string, Recipe>;
  onAdd: (date: string, meal: PlanMeal) => void;
  onRemove: (date: string, meal: PlanMeal, recipeId: string) => void;
  onOpen: (recipeId: string) => void;
}

/** One meal time of one day: its dishes and the "Añadir" action (not on days already past). */
export function PlanSlot({
  date,
  meal,
  label,
  dishes,
  past,
  columns,
  actions,
}: {
  date: string;
  meal: PlanMeal;
  label: string;
  dishes: DayDishes[PlanMeal];
  past: boolean;
  columns: boolean;
  actions: PlanActions;
}) {
  const day = formatDay(date);
  return (
    <section
      aria-label={`${label}, ${day}`}
      className={`mt-2 rounded-md border border-border bg-surface-1 ${columns ? "p-2" : "p-3"}`}
    >
      <h3 className="mb-1 text-xs font-extrabold tracking-[0.06em] text-text-muted uppercase">
        {label}
      </h3>
      {dishes.length > 0 && (
        <ul>
          {dishes.map((dish, i) => (
            <PlanRecipeItem
              key={`${dish.recipe ?? dish.text}-${i}`}
              dish={dish}
              recipe={dish.recipe ? actions.recipes.get(dish.recipe) : undefined}
              past={past}
              columns={columns}
              onOpen={actions.onOpen}
              onRemove={(id) => actions.onRemove(date, meal, id)}
            />
          ))}
        </ul>
      )}
      {!past && (
        <button
          type="button"
          onClick={() => actions.onAdd(date, meal)}
          aria-label={`Añadir receta a ${label.toLowerCase()}, ${day}`}
          className="mt-1.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border text-sm font-semibold text-primary-500 transition hover:border-primary-500 hover:bg-primary-500/10"
        >
          <Plus className="size-3.5" aria-hidden />
          Añadir
        </button>
      )}
    </section>
  );
}

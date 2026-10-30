"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { SearchInput } from "@/components/inputs/SearchInput";
import { Sheet } from "@/components/overlays/Sheet";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { useSearchQuery } from "@/components/recipes/use-search-query";
import { formatDay } from "@/lib/domain/plan-calendar";
import { PLAN_MEAL_LABELS, titleMatches } from "@/lib/domain/plan-view";
import { totalMinutes } from "@/lib/domain/filters";
import { formatMinutes } from "@/lib/domain/recipe-detail";
import type { PlanMeal, Recipe } from "@/lib/schema";

/** Picks one recipe for a slot: search box, single-select list and the "Añadir receta" button. */
export function RecipePickerSheet({
  date,
  meal,
  recipes,
  onClose,
  onConfirm,
}: {
  date: string;
  meal: PlanMeal;
  recipes: Recipe[];
  onClose: () => void;
  onConfirm: (recipeId: string) => void;
}) {
  const search = useSearchQuery();
  const [selected, setSelected] = useState<string | null>(null);
  const label = PLAN_MEAL_LABELS.find((m) => m.meal === meal)!;
  const list = useMemo(
    () => (search.applied ? recipes.filter((r) => titleMatches(r.title, search.applied)) : recipes),
    [recipes, search.applied],
  );

  let body: React.ReactNode;
  if (recipes.length === 0)
    body = (
      <EmptyState
        emoji="📖"
        title="No hay recetas todavía"
        hint="Añade recetas desde Claude o Telegram."
      />
    );
  else if (list.length === 0)
    body = (
      <EmptyState
        emoji="🔎"
        title="Sin resultados"
        hint="Prueba con otra búsqueda."
        action={
          <Button variant="secondary" onClick={search.clear}>
            Borrar búsqueda
          </Button>
        }
      />
    );
  else
    body = (
      <ul role="listbox" aria-label="Recetas" className="min-h-0 flex-1 overflow-y-auto">
        {list.map((r) => {
          const minutes = totalMinutes(r.time);
          const on = selected === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => setSelected(on ? null : r.id)}
                className={`flex min-h-16 w-full items-center gap-3 rounded-md border-2 p-2 text-left transition ${
                  on
                    ? "border-primary-500 bg-primary-500/15"
                    : "border-transparent hover:bg-surface-2"
                }`}
              >
                <RecipePhoto
                  recipeId={r.id}
                  photoVersion={r.photoVersion}
                  category={r.category}
                  className="size-12 shrink-0 rounded-sm"
                />
                <span className="min-w-0 flex-1 leading-snug font-semibold">
                  {r.title}
                  {minutes !== undefined && (
                    <small className="block text-xs font-normal text-text-muted">
                      {formatMinutes(minutes)}
                    </small>
                  )}
                </span>
                <span
                  aria-hidden
                  className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    on ? "border-primary-500 bg-primary-500 text-primary-contrast" : "border-border"
                  }`}
                >
                  {on && <Check className="size-3.5 stroke-[3.4]" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );

  return (
    <Sheet
      open
      onClose={onClose}
      size="tall"
      title={`Añadir ${label.to}`}
      subtitle={formatDay(date)}
    >
      <SearchInput
        value={search.typed}
        onChange={search.setTyped}
        onClear={search.clear}
        onSubmit={search.applyNow}
        placeholder="Buscar receta"
        label="Buscar receta"
      />
      {body}
      <Button
        className="mt-3 w-full"
        disabled={selected === null}
        onClick={() => selected && onConfirm(selected)}
      >
        Añadir receta
      </Button>
    </Sheet>
  );
}

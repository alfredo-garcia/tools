"use client";

import { X } from "lucide-react";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { categoryEmoji } from "@/lib/domain/categories";
import type { PlanDish, Recipe } from "@/lib/schema";

/** One dish of a slot: a recipe (opens its detail, removable) or a plain text dish (read only). */
export function PlanRecipeItem({
  dish,
  recipe,
  past,
  columns,
  onOpen,
  onRemove,
}: {
  dish: PlanDish;
  recipe?: Recipe;
  past: boolean;
  columns: boolean;
  onOpen: (recipeId: string) => void;
  onRemove: (recipeId: string) => void;
}) {
  if (!recipe)
    return (
      <li className="border-b border-border py-2 text-sm text-text-muted last:border-b-0">
        {dish.text}
      </li>
    );
  return (
    <li
      className={`flex items-center gap-1 border-b border-border last:border-b-0 ${
        columns ? "min-h-12" : "min-h-14"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(recipe.id)}
        className={`flex min-w-0 flex-1 gap-3 rounded-sm text-left ${
          columns ? "min-h-12 items-start gap-1.5 pt-2" : "min-h-14 items-center"
        }`}
      >
        {columns ? (
          <span aria-hidden className="text-sm leading-snug">
            {categoryEmoji(recipe.category)}
          </span>
        ) : (
          <RecipePhoto
            recipeId={recipe.id}
            photoVersion={recipe.photoVersion}
            category={recipe.category}
            className="size-11 shrink-0 rounded-sm"
          />
        )}
        <span
          className={`min-w-0 flex-1 leading-snug font-semibold ${
            columns ? "line-clamp-3 text-[13px]" : "line-clamp-2"
          }`}
        >
          {recipe.title}
        </span>
      </button>
      {!past && (
        <button
          type="button"
          onClick={() => onRemove(recipe.id)}
          aria-label={`Quitar ${recipe.title}`}
          className={`grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition hover:bg-surface-2 hover:text-danger-500 ${
            columns ? "-mr-2" : ""
          }`}
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </li>
  );
}

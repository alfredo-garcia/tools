"use client";

import { detailHref, openRecipe } from "@/components/recipes/detail/use-detail-navigation";

/** Link to a recipe detail. Keeps a real href (new tab, copy link) but opens in place without a request. */
export function RecipeLink({
  recipeId,
  className,
  current = false,
  replace = false,
  children,
}: {
  recipeId: string;
  className?: string;
  /** Marks the link as the recipe currently open (side panel). */
  current?: boolean;
  /** Replace the history entry instead of adding one. */
  replace?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={detailHref(recipeId)}
      className={className}
      data-recipe-row={current ? "current" : "row"}
      aria-current={current ? "true" : undefined}
      onClick={(e) => {
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return;
        e.preventDefault();
        openRecipe(recipeId, { replace });
      }}
    >
      {children}
    </a>
  );
}

"use client";

import { detailHref, openRecipe } from "@/components/recipes/detail/use-detail-navigation";

/** Link to a recipe detail. Keeps a real href (new tab, copy link) but opens in place without a request. */
export function RecipeLink({
  recipeId,
  className,
  children,
}: {
  recipeId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={detailHref(recipeId)}
      className={className}
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
        openRecipe(recipeId);
      }}
    >
      {children}
    </a>
  );
}

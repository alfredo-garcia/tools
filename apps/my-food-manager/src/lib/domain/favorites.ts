import { isReviewOp, type PendingOp } from "./pantry-view";
import type { Library, Recipe } from "@/lib/schema";
import { REVIEWS_USER } from "./review-ops";

/**
 * Ids of the favorite recipes: Al's stored favorites with the pending changes of the outbox applied in order.
 * Ids that are not recipes of the library are dropped.
 */
export function favoritesWithPending(
  library: Pick<Library, "reviews" | "recipes"> | undefined,
  pending: readonly PendingOp[],
): Set<string> {
  const ids = new Set(library?.recipes.map((r) => r.id));
  const favorites = new Set(library?.reviews[REVIEWS_USER]?.favorites ?? []);
  for (const op of pending) {
    if (!isReviewOp(op)) continue;
    if (op.value) favorites.add(op.recipe);
    else favorites.delete(op.recipe);
  }
  return new Set([...favorites].filter((id) => ids.has(id)));
}

/** True when Al's reviews file exists, so a favorite can be saved. */
export const canWriteFavorites = (library: Pick<Library, "reviews"> | undefined) =>
  library?.reviews[REVIEWS_USER] !== undefined;

/** Recipes shown in the favorites tab: the favorites plus the ones just unfavorited that stay on screen. */
export function favoriteRecipes(
  recipes: readonly Recipe[],
  favorites: ReadonlySet<string>,
  kept: ReadonlySet<string> = new Set(),
): Recipe[] {
  return recipes.filter((r) => favorites.has(r.id) || kept.has(r.id));
}

import type { Library, Recipe } from "@/lib/schema";
import { isRatingOp, type PendingOp } from "./pantry-view";
import { REVIEWS_USER, validStars } from "./review-ops";

/** A recipe as the lists see it: with Al's rating, which never comes from the recipe file. */
export type RatedRecipe = Recipe & { userRating?: number };

export const MAX_STARS = 5;

/** Al's valid ratings (integers 1 to 5); anything else in the file reads as no rating. */
export function storedRatings(library: Pick<Library, "reviews"> | undefined): Map<string, number> {
  const out = new Map<string, number>();
  const ratings = (
    library?.reviews[REVIEWS_USER] as { ratings?: Record<string, { stars?: unknown }> }
  )?.ratings;
  for (const [id, entry] of Object.entries(ratings ?? {}))
    if (validStars(entry?.stars)) out.set(id, entry.stars);
  return out;
}

/** Al's ratings with the pending changes of the outbox applied in order; ids that are not recipes are dropped. */
export function ratingsWithPending(
  library: Pick<Library, "reviews" | "recipes"> | undefined,
  pending: readonly PendingOp[],
): Map<string, number> {
  const ids = new Set(library?.recipes.map((r) => r.id));
  const ratings = storedRatings(library);
  for (const op of pending) {
    if (!isRatingOp(op)) continue;
    if (op.value === null) ratings.delete(op.recipe);
    else ratings.set(op.recipe, op.value);
  }
  for (const id of [...ratings.keys()]) if (!ids.has(id)) ratings.delete(id);
  return ratings;
}

/** Tapping the star that equals the current rating removes it; any other star sets it. */
export const nextRating = (current: number | undefined, tapped: number): number | null =>
  tapped === current ? null : tapped;

/**
 * The recipes with Al's rating attached. A recipe with a pending rating that is Por probar or Descartada already
 * reads as Probada, as it will once the server has saved the change (ADR 004).
 */
export function withRatings(
  recipes: readonly Recipe[],
  ratings: ReadonlyMap<string, number>,
  pending: readonly PendingOp[],
): RatedRecipe[] {
  const rated = new Set(
    pending
      .filter(isRatingOp)
      .filter((o) => o.value !== null)
      .map((o) => o.recipe),
  );
  return recipes.map((r) => {
    const userRating = ratings.get(r.id);
    const tried = rated.has(r.id) && r.status !== undefined && r.status !== "tried";
    if (userRating === undefined && !tried) return r;
    return {
      ...r,
      ...(userRating === undefined ? {} : { userRating }),
      ...(tried ? { status: "tried" } : {}),
    };
  });
}

/** Default list order: stars from highest to lowest, unrated last, ties by title (Spanish collation). */
export function sortByRating<T extends RatedRecipe>(recipes: readonly T[]): T[] {
  return [...recipes].sort(
    (a, b) => (b.userRating ?? 0) - (a.userRating ?? 0) || a.title.localeCompare(b.title, "es"),
  );
}

/** True when Al's reviews file exists, so a rating can be saved. */
export const canWriteRatings = (library: Pick<Library, "reviews"> | undefined) =>
  library?.reviews[REVIEWS_USER] !== undefined;

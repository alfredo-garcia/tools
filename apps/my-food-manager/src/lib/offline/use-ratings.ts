"use client";

import { useCallback, useMemo } from "react";
import {
  canWriteRatings,
  nextRating,
  ratingsWithPending,
  withRatings,
  type RatedRecipe,
} from "@/lib/domain/ratings";
import { REVIEWS_USER } from "@/lib/domain/review-ops";
import type { Library } from "@/lib/schema";
import { getOutbox } from "./outbox-client";
import { FAVORITE_TOGGLED } from "./use-favorites";
import { useLibrary } from "./use-library";
import { useOutbox } from "./use-outbox";

/**
 * Al's ratings with the pending changes applied, the library with each recipe carrying its rating (and the status
 * a pending rating will give it), and the action that rates a recipe. Tapping the star that equals the current
 * rating removes it.
 */
export function useRatings() {
  const { library } = useLibrary();
  const { pending } = useOutbox();
  const ratings = useMemo(
    () => ratingsWithPending(library ?? undefined, pending),
    [library, pending],
  );
  const rated = useMemo<(Library & { recipes: RatedRecipe[] }) | null>(
    () =>
      library ? { ...library, recipes: withRatings(library.recipes, ratings, pending) } : null,
    [library, ratings, pending],
  );
  const canWrite = canWriteRatings(library ?? undefined);

  const rate = useCallback(
    (recipeId: string, tapped: number) => {
      const outbox = getOutbox();
      if (!library || !canWrite) return outbox.notifyRatingFailed(recipeId);
      const stored =
        (library.reviews[REVIEWS_USER] as { ratings?: Record<string, { stars?: number }> })
          .ratings?.[recipeId]?.stars ?? null;
      const storedValid = typeof stored === "number" && stored >= 1 && stored <= 5 ? stored : null;
      void outbox.enqueueRating(recipeId, nextRating(ratings.get(recipeId), tapped), storedValid);
      window.dispatchEvent(new Event(FAVORITE_TOGGLED));
    },
    [library, canWrite, ratings],
  );

  return { library: rated, ratings, canWrite, rate };
}

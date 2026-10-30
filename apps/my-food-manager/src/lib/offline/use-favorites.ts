"use client";

import { useCallback, useMemo } from "react";
import { canWriteFavorites, favoritesWithPending } from "@/lib/domain/favorites";
import { REVIEWS_USER } from "@/lib/domain/review-ops";
import { getOutbox } from "./outbox-client";
import { useLibrary } from "./use-library";
import { useOutbox } from "./use-outbox";

/** Window event that tells `FavoriteFeedback` a heart was toggled, so it can ask for the write key. */
export const FAVORITE_TOGGLED = "favorite:toggled";

/** Window event that asks `FavoriteFeedback` to open the write key dialog ("Introducir clave"). */
export const OPEN_KEY_DIALOG = "favorite:open-key";

/** Al's favorites with the pending changes applied, and the action that toggles one. */
export function useFavorites() {
  const { library } = useLibrary();
  const { pending } = useOutbox();
  const favorites = useMemo(
    () => favoritesWithPending(library ?? undefined, pending),
    [library, pending],
  );
  const canWrite = canWriteFavorites(library ?? undefined);

  const toggle = useCallback(
    (recipeId: string) => {
      const outbox = getOutbox();
      if (!library || !canWrite) return outbox.notifyFavoriteFailed(recipeId);
      const stored = library.reviews[REVIEWS_USER]?.favorites.includes(recipeId) ?? false;
      void outbox.enqueueFavorite(recipeId, !favorites.has(recipeId), stored);
      window.dispatchEvent(new Event(FAVORITE_TOGGLED));
    },
    [library, canWrite, favorites],
  );

  return { favorites, canWrite, toggle };
}

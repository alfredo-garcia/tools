"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildShare, shareLink } from "@/lib/domain/share";
import type { Recipe } from "@/lib/schema";

const NOTICE_MS = 4000;
/** How long a tap waits for a photo that is still loading before sharing without it. */
const PHOTO_WAIT_MS = 1500;

async function fetchPhoto(recipe: Pick<Recipe, "id" | "photoVersion">): Promise<File | undefined> {
  if (!recipe.photoVersion) return undefined;
  try {
    const res = await fetch(
      `/api/photo/${encodeURIComponent(recipe.id)}?v=${encodeURIComponent(recipe.photoVersion)}`,
    );
    if (!res.ok) return undefined;
    return new File([await res.blob()], `${recipe.id}.jpg`, { type: "image/jpeg" });
  } catch {
    return undefined;
  }
}

/**
 * Shares a recipe through the device's share menu with its title, photo and link; where the browser has no share
 * menu it copies the link. The photo is fetched when the recipe opens so the tap can open the menu at once.
 */
export function useRecipeShare(recipe: Pick<Recipe, "id" | "title" | "photoVersion">) {
  const photo = useRef<Promise<File | undefined>>(undefined);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    photo.current = fetchPhoto(recipe);
  }, [recipe]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const share = useCallback(async () => {
    if (busy) return;
    const link = shareLink(window.location.origin, recipe.id);
    if (typeof navigator.share !== "function") {
      try {
        await navigator.clipboard.writeText(link);
        setNotice("Enlace copiado");
      } catch {
        setNotice("No se pudo copiar el enlace");
      }
      return;
    }
    setBusy(true);
    try {
      const file = await Promise.race([
        photo.current ?? Promise.resolve(undefined),
        new Promise<undefined>((resolve) => setTimeout(resolve, PHOTO_WAIT_MS)),
      ]);
      let data = buildShare(recipe.title, link, file);
      if (data.files && !navigator.canShare?.(data)) data = buildShare(recipe.title, link);
      await navigator.share(data);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setNotice("No se pudo compartir");
    } finally {
      setBusy(false);
    }
  }, [busy, recipe]);

  return { share, busy, notice };
}

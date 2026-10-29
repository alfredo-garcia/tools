"use client";

import { useState } from "react";
import { categoryEmoji } from "@/lib/domain/categories";

const TINT: Record<string, string> = {
  breakfast: "var(--color-cat-breakfast)",
  starters: "var(--color-cat-starters)",
  soups: "var(--color-cat-soups)",
  salads: "var(--color-cat-salads)",
  mains: "var(--color-cat-mains)",
  sides: "var(--color-cat-sides)",
  sauces: "var(--color-cat-sauces)",
  breads: "var(--color-cat-breads)",
  desserts: "var(--color-cat-desserts)",
  drinks: "var(--color-cat-drinks)",
};

/** Drive photo when there is one; otherwise (or if it fails, e.g. offline and unseen) the category tile. */
export function RecipePhoto({
  recipeId,
  photoVersion,
  category,
  className = "",
}: {
  recipeId: string;
  photoVersion?: string;
  category?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const tint = (category && TINT[category]) || "var(--color-cat-unclassified)";

  if (photoVersion && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- photos come through our own /api/photo proxy and the service worker cache
      <img
        src={`/api/photo/${encodeURIComponent(recipeId)}?v=${encodeURIComponent(photoVersion)}`}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`grid place-items-center ${className}`}
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 85%, black), color-mix(in srgb, ${tint} 45%, black))`,
      }}
    >
      <span className="text-2xl">{categoryEmoji(category)}</span>
    </div>
  );
}

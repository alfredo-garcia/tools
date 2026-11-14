import type { CSSProperties } from "react";

/** Known category and region ids with a tint token (ui_standards §2: `cat.<id>`, `region.<id>`). */
const CATEGORIES = new Set(["swim-day", "strength", "mobility", "express", "cardio"]);

/** Category emoji (ui_standards §2); text glyphs for cards and chips only. */
export const CATEGORY_EMOJI: Record<string, string> = {
  "swim-day": "🏊",
  strength: "💪",
  mobility: "🧘",
  express: "⚡",
  cardio: "🚶",
};
const REGIONS = new Set(["core", "lower-body", "upper-body", "full-body"]);

const mix = (token: string, pct: number): CSSProperties => ({
  background: `color-mix(in srgb, var(${token}) ${pct}%, var(--color-surface-1))`,
});

/** Background tint of a routine category; unknown ids get the plain surface. */
export function categoryTint(category: string): CSSProperties {
  return CATEGORIES.has(category)
    ? mix(`--color-cat-${category}`, 16)
    : { background: "var(--color-surface-1)" };
}

/** Background tint of a body region; unknown ids get `surface.2`. */
export function regionTint(region: string | null | undefined): CSSProperties {
  return region && REGIONS.has(region)
    ? mix(`--color-region-${region}`, 18)
    : { background: "var(--color-surface-2)" };
}

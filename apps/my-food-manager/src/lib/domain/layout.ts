export type Layout = "small" | "medium" | "large";

export const MEDIUM_MIN_WIDTH = 640;
export const LARGE_MIN_WIDTH = 1280;

/** small: full-screen detail; medium: modal over the list; large: list column with a detail panel. */
export function layoutForWidth(width: number): Layout {
  if (width >= LARGE_MIN_WIDTH) return "large";
  if (width >= MEDIUM_MIN_WIDTH) return "medium";
  return "small";
}

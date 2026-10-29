const EMOJI: Record<string, string> = {
  breakfast: "🍳",
  starters: "🥂",
  soups: "🍲",
  salads: "🥗",
  mains: "🍽️",
  sides: "🥔",
  sauces: "🫙",
  breads: "🍞",
  desserts: "🍰",
  drinks: "🍹",
};

export const categoryEmoji = (id: string | undefined) => (id && EMOJI[id]) || "🍴";

export function categoryLabel(categories: Record<string, unknown>, id: string | undefined): string {
  const entry = id ? (categories[id] as { label?: string } | undefined) : undefined;
  return entry?.label ?? "Sin clasificar";
}

import { Heart } from "lucide-react";

/**
 * The heart that marks a recipe as favorite: icon only in rows and in the detail title, or with its text under
 * the photo (`label`). A sibling of any recipe link, never inside it.
 */
export function FavoriteButton({
  pressed,
  onToggle,
  recipeTitle,
  label,
}: {
  pressed: boolean;
  onToggle: () => void;
  recipeTitle: string;
  /** Shows the text next to the heart; the button then takes the width of its content. */
  label?: string;
}) {
  const action = pressed ? "Quitar de favoritos" : "Añadir a favoritos";
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label ? undefined : `${action}: ${recipeTitle}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={
        label
          ? `inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
              pressed
                ? "border-accent-lime bg-accent-lime/15 text-accent-lime"
                : "border-border bg-surface-1 text-text"
            }`
          : `grid size-11 shrink-0 place-items-center rounded-full transition ${
              pressed ? "text-accent-lime" : "text-text-muted"
            }`
      }
    >
      <Heart
        className={`${label ? "size-5" : "size-6"} ${pressed ? "fill-current" : ""}`}
        aria-hidden
      />
      {label && <span>{label}</span>}
    </button>
  );
}

import { Share2 } from "lucide-react";

/** Opens the share menu for a recipe: icon only on the title row, or with the text "Compartir" under the photo. */
export function ShareButton({
  onShare,
  recipeTitle,
  busy = false,
  label,
}: {
  onShare: () => void;
  recipeTitle: string;
  busy?: boolean;
  /** Shows the text next to the icon; the button then takes the width of its content. */
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      aria-label={label ? undefined : `Compartir: ${recipeTitle}`}
      onClick={onShare}
      className={
        label
          ? "inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-surface-1 px-5 text-sm font-semibold text-text transition disabled:opacity-60"
          : "grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition disabled:opacity-60"
      }
    >
      <Share2 className={label ? "size-5" : "size-6"} aria-hidden />
      {label && <span>{label}</span>}
    </button>
  );
}

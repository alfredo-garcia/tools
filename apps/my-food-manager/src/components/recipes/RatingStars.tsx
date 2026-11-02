import { Star } from "lucide-react";
import { MAX_STARS } from "@/lib/domain/ratings";

/** Five stars to set, change or remove a rating: star N is a button, filled up to the value. */
export function RatingStars({
  value,
  onChange,
  recipeTitle,
}: {
  /** 0 when the recipe has no rating. */
  value: number;
  onChange: (stars: number) => void;
  recipeTitle: string;
}) {
  return (
    <div role="group" aria-label={`Rating de ${recipeTitle}`} className="inline-flex items-center">
      {Array.from({ length: MAX_STARS }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={n <= value}
          aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
          onClick={() => onChange(n)}
          className={`grid size-11 place-items-center rounded-full transition ${
            n <= value ? "text-warning-500" : "text-text-muted"
          }`}
        >
          <Star className={`size-7 ${n <= value ? "fill-current" : ""}`} aria-hidden />
        </button>
      ))}
    </div>
  );
}

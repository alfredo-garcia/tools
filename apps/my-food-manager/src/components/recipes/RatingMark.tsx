import { Star } from "lucide-react";

/** Al's rating on a row of a list, display only: a filled star and the number. */
export function RatingMark({ stars }: { stars: number }) {
  return (
    <span
      aria-label={`Rating ${stars} de 5`}
      className="inline-flex items-center gap-0.5 align-middle font-bold text-warning-500"
    >
      <Star className="size-3 fill-current" aria-hidden />
      {stars}
    </span>
  );
}

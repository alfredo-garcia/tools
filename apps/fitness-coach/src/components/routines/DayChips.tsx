import { DAY_INITIALS, daysAria, type Weekday } from "@/lib/domain/routines";
import { WEEKDAYS } from "@/lib/schema/kb";

type Props = { days: readonly Weekday[] | null | undefined; today?: Weekday };

/**
 * Kit `DayChips`: the 7 initials (L M X J V S D), the routine's days filled, today with a lime
 * border. One image for assistive tech, named "Días: L · J" (or "Sin día fijo").
 */
export function DayChips({ days, today }: Props) {
  const set = new Set(days ?? []);
  return (
    <span className="flex items-center gap-xs">
      <span role="img" aria-label={daysAria(days)} className="flex gap-xs">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            aria-hidden
            className={[
              "grid size-6.5 place-items-center rounded-full border-2 text-caption font-semibold",
              set.has(d)
                ? "bg-primary-500 text-primary-contrast"
                : "bg-[color-mix(in_srgb,var(--color-surface-2)_80%,transparent)] text-text-muted",
              d === today ? "border-accent-lime" : "border-transparent",
            ].join(" ")}
          >
            {DAY_INITIALS[d]}
          </span>
        ))}
      </span>
      {set.size === 0 && <span className="ml-1.5 text-caption text-text-muted">Sin día fijo</span>}
    </span>
  );
}

import { SlidersHorizontal } from "lucide-react";

// TEMP — not in ui_kit_registry.md yet (my-food-manager/016); propose it to the registry when the feature ships.
/** Round icon button at the right of a search bar that shows or hides the filter panel, with the active count. */
export function TmpFilterToggle({
  expanded,
  count,
  onToggle,
  controls,
}: {
  expanded: boolean;
  count: number;
  onToggle: () => void;
  /** id of the panel it shows and hides. */
  controls?: string;
}) {
  const name = count > 0 ? `Filtros, ${count} ${count === 1 ? "activo" : "activos"}` : "Filtros";
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={name}
      onClick={onToggle}
      className={`relative grid size-12 shrink-0 place-items-center rounded-full border transition active:scale-[0.97] ${
        expanded
          ? "border-primary-500 bg-primary-500/15 text-primary-500"
          : "border-border bg-surface-1 text-text"
      }`}
    >
      <SlidersHorizontal className="size-5" aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 h-[18px] min-w-[18px] rounded-full bg-primary-500 px-[5px] text-center text-[11px] leading-[18px] font-extrabold text-primary-contrast ring-2 ring-surface-1"
        >
          {count}
        </span>
      )}
    </button>
  );
}

import { Check } from "lucide-react";
import type { FilterOption } from "@/lib/domain/filters";

/** Options of one filter as small pills; options that would show nothing are disabled. */
export function FilterOptions({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: FilterOption[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  if (options.length === 0)
    return <p className="px-1 py-2 text-sm text-text-muted">Sin opciones</p>;

  return (
    <div role="listbox" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const isSelected = o.value === selected;
        return (
          <button
            key={o.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={o.count === 0 && !isSelected}
            onClick={() => onSelect(o.value)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
              isSelected
                ? "border-primary-500 bg-primary-500/15 text-primary-500"
                : "border-border bg-surface-2 text-text"
            }`}
          >
            {isSelected && <Check className="size-4" aria-hidden />}
            {o.label}
            <span className="text-xs font-medium text-text-muted">{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

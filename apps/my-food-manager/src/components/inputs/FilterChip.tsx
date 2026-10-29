import { ChevronDown, X } from "lucide-react";

const BASE =
  "inline-flex min-h-11 shrink-0 items-center rounded-full border text-[14px] font-semibold transition";

/** Idle: just the filter name. Active: tinted chip with the chosen value and an "x" that clears it. */
export function FilterChip({
  label,
  value,
  open,
  disabled,
  onToggle,
  onClear,
}: {
  label: string;
  value?: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClear: () => void;
}) {
  const trigger = {
    type: "button" as const,
    onClick: onToggle,
    disabled,
    "aria-expanded": open,
    "aria-haspopup": "listbox" as const,
  };
  const chevron = (
    <ChevronDown
      className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    />
  );

  if (value === undefined) {
    return (
      <button
        {...trigger}
        className={`${BASE} gap-1.5 border-border bg-surface-2 px-4 text-text active:scale-[0.97] disabled:opacity-40`}
      >
        {label}
        {chevron}
      </button>
    );
  }
  return (
    <span
      className={`${BASE} animate-[pop-in_150ms_ease-out] border-primary-500 bg-primary-500/15 text-primary-500`}
    >
      <button
        {...trigger}
        aria-label={`${label}: ${value}`}
        className="inline-flex min-h-11 max-w-44 items-center gap-1.5 rounded-l-full pr-1 pl-4"
      >
        <span className="truncate">{value}</span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Quitar filtro ${label}`}
        className="grid size-11 shrink-0 place-items-center rounded-r-full transition active:scale-90"
      >
        <X className="size-4" aria-hidden />
      </button>
    </span>
  );
}

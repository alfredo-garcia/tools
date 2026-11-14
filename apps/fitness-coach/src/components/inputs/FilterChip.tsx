import type { ReactNode } from "react";

type Props = {
  selected: boolean;
  onSelect: () => void;
  count?: number;
  children: ReactNode;
  "aria-label"?: string;
  "data-testid"?: string;
};

/** Kit `FilterChip`: a selectable option (`aria-pressed`) with its count, ≥ 44 px tall. */
export function FilterChip({
  selected,
  onSelect,
  count,
  children,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      data-testid={testId}
      className={[
        "inline-flex h-(--size-touch-min) flex-none items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-label whitespace-nowrap",
        selected
          ? "border-primary-500 bg-[color-mix(in_srgb,var(--color-primary-500)_16%,var(--color-surface-1))]"
          : "border-transparent bg-surface-2",
      ].join(" ")}
    >
      {children}
      {count !== undefined && (
        <span className="text-caption text-text-muted tabular-nums">{count}</span>
      )}
    </button>
  );
}

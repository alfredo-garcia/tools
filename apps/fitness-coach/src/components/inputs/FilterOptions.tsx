import { useId, type ReactNode } from "react";

/** Kit `FilterOptions`: a labelled group of `FilterChip`s in one horizontally scrolling row. */
export function FilterOptions({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-1.5">
      <span id={id} className="text-block-label text-text-muted uppercase">
        {label}
      </span>
      <div className="-mx-md flex gap-sm overflow-x-auto px-md pb-0.5 [scrollbar-width:none]">
        {children}
      </div>
    </div>
  );
}

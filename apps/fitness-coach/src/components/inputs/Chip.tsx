import type { ReactNode } from "react";

/** Kit `Chip`: static pill with text (and an optional emoji or icon before it). */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center gap-xs rounded-full bg-[color-mix(in_srgb,var(--color-surface-1)_55%,transparent)] px-3 text-label whitespace-nowrap">
      {children}
    </span>
  );
}

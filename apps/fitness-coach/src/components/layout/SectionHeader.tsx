import type { ReactNode } from "react";

/** Kit `SectionHeader`: `heading-2` title with an optional action on the right. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-sm">
      <h2 className="text-heading-2">{title}</h2>
      {action}
    </div>
  );
}

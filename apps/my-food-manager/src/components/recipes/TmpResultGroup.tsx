import type { ReactNode } from "react";

// TEMP — prototype-only, not in ui_kit_registry.md. Needs a real design-system component before this ships.
/** A group of search results: heading "<label> · <count>" and the rows under it. */
export function TmpResultGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-xs font-extrabold tracking-wider text-text-muted uppercase">
        {label} · <span className="text-text">{count}</span>
      </h2>
      {children}
    </section>
  );
}

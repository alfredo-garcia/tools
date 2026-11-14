import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Inside a modal it sticks to the dialog, not the window. */ inDialog?: boolean;
};

/** Kit `StickyFooter`: bar fixed at the bottom, `elevation.3`, with the safe-area inset. */
export function StickyFooter({ children, inDialog = false }: Props) {
  return (
    <div
      className={[
        "z-30 bg-surface-1 px-md pt-md pb-[calc(var(--spacing-lg)+env(safe-area-inset-bottom))] shadow-elevation-3",
        inDialog ? "sticky bottom-0" : "fixed inset-x-0 bottom-0",
      ].join(" ")}
    >
      <div className="mx-auto max-w-(--size-content-max)">{children}</div>
    </div>
  );
}

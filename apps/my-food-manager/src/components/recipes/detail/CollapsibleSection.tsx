"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Titled card whose body folds; all sections start open and keep their own state. */
export function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <section className="mt-4 rounded-md border border-border bg-surface-1 shadow-elevation-1">
      <h2>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-14 w-full items-center rounded-md px-4 text-left text-lg font-bold"
        >
          {title}
          <ChevronDown
            aria-hidden
            className={`ml-auto size-5 text-text-muted transition-transform duration-200 ${
              open ? "" : "-rotate-90"
            }`}
          />
        </button>
      </h2>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div inert={!open} className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

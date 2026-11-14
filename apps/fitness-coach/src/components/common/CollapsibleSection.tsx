"use client";
import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

type Props = {
  /** The visible header; also the button's accessible name. */
  title: ReactNode;
  /** Small line under the title (e.g. the block's duration). */
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  "data-testid"?: string;
};

/**
 * Kit `CollapsibleSection`: a separator line, a ≥ 44 px header button with `ChevronDown`
 * (`aria-expanded`), and its content, only rendered while open.
 */
export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <section data-testid={testId} className="border-t border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-(--size-touch-min) w-full items-center justify-between gap-sm pt-md pb-sm text-left"
      >
        <span className="flex flex-col gap-0.5">
          {title}
          {subtitle}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-(--icon-md) flex-none text-text-muted transition-transform duration-(--duration-fast) motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div id={contentId} className="pb-md">
          {children}
        </div>
      )}
    </section>
  );
}

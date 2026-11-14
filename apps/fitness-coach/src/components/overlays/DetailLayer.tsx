"use client";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { MEDIUM_UP, useMediaQuery } from "@/components/common/useMediaQuery";
import { Button } from "@/components/inputs/Button";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

type Props = {
  onBack: () => void;
  /** Accessible name of the dialog (from 640 px). */
  label: string;
  children: ReactNode;
  /** A `StickyFooter`, kept at the bottom of the screen or of the dialog. */
  footer?: ReactNode;
};

/**
 * Kit `DetailLayer`: full screen below 640 px (the page itself scrolls), a 720 px modal over the
 * screen behind from 640 px (scrim, Escape closes, focus moves inside and Tab stays there). "Atrás" at the top left.
 */
export function DetailLayer({ onBack, label, children, footer }: Props) {
  const wide = useMediaQuery(MEDIUM_UP);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wide) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onBack();
      if (e.key !== "Tab" || !panel.current) return;
      // Keep Tab inside the dialog (the screen behind is inert as well)
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wide, onBack]);

  const back = (
    <div className="flex items-center px-sm pt-sm">
      <Button variant="ghost" icon={ChevronLeft} onClick={onBack} data-testid="back-button">
        Atrás
      </Button>
    </div>
  );

  if (!wide) {
    return (
      <div className="min-h-dvh bg-bg pt-[env(safe-area-inset-top)]">
        {back}
        <div className="mx-auto max-w-(--size-content-max) px-md pb-[calc(120px+env(safe-area-inset-bottom))]">
          {children}
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
      <div aria-hidden className="absolute inset-0 bg-black/55" onClick={onBack} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="relative flex max-h-full w-full max-w-(--size-content-max) flex-col overflow-y-auto rounded-md bg-bg shadow-elevation-3 outline-none"
      >
        {back}
        <div className="px-xl pb-lg">{children}</div>
        {footer}
      </div>
    </div>
  );
}

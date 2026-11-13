"use client";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { Button } from "@/components/inputs/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  "data-testid"?: string;
  /** test id of the close button */
  closeTestId?: string;
};

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
/** Distance to drag the sheet down to close it (below 640 px). */
const SWIPE_CLOSE = 80;

/**
 * Kit `Sheet`: bottom sheet below 640 px, centred modal (max 520 px) from 640 px. Closes with the
 * close button, a tap outside, Escape or a swipe down. Moves focus inside on open, keeps Tab
 * inside and gives focus back on close.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  "data-testid": testId,
  closeTestId,
}: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const items = () => [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    (panel.current?.querySelector<HTMLElement>("input") ?? items()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const onTouchStart = (e: TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (dragStart.current !== null) setDrag(Math.max(0, e.touches[0].clientY - dragStart.current));
  };
  const onTouchEnd = () => {
    if (drag >= SWIPE_CLOSE) onClose();
    dragStart.current = null;
    setDrag(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center medium:items-center">
      <div aria-hidden className="absolute inset-0 bg-bg/70" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
        className="relative w-full max-w-(--size-dialog-max) rounded-t-lg bg-surface-1 p-lg pb-[calc(var(--spacing-lg)+env(safe-area-inset-bottom))] shadow-elevation-3 medium:rounded-lg"
      >
        <div className="mb-md flex items-start justify-between gap-md">
          <h2 id={titleId} className="text-heading-2">
            {title}
          </h2>
          <Button
            variant="ghost"
            icon={X}
            aria-label="Cerrar"
            onClick={onClose}
            data-testid={closeTestId}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

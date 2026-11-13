"use client";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
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

/**
 * Kit `Sheet`: bottom sheet below 640 px, centred modal (max 520 px) from 640 px. Closes with the
 * close button, a tap outside or Escape.
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center medium:items-center">
      <div aria-hidden className="absolute inset-0 bg-bg/70" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
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

"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE = "a[href], button:not([disabled]), input, [tabindex]:not([tabindex='-1'])";

/**
 * Bottom sheet below 640 px, centered modal from 640 px (also on large windows). Traps focus, locks the page
 * scroll, closes on Esc and on a tap on the backdrop, and gives focus back to the element that opened it.
 * `size="tall"` fills most of the window height (lists); `hideClose` drops the close button when the
 * content offers its own way out.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  size = "auto",
  hideClose = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "auto" | "tall";
  hideClose?: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <SheetLayer
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      hideClose={hideClose}
    >
      {children}
    </SheetLayer>
  );
}

function SheetLayer({
  onClose,
  title,
  subtitle,
  size,
  hideClose,
  children,
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  size: "auto" | "tall";
  hideClose: boolean;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const first =
      panel.current?.querySelector<HTMLElement>("input") ??
      panel.current?.querySelector<HTMLElement>("button");
    first?.focus();
    return () => {
      root.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // A search box that clears its text on Esc has already handled it.
      if (!e.defaultPrevented) onCloseRef.current();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex w-full max-w-[520px] flex-col rounded-t-lg bg-surface-1 p-4 shadow-elevation-3 sm:rounded-lg sm:p-5 ${
          size === "tall" ? "h-[88%] sm:h-[min(640px,100%)]" : "max-h-[92%]"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <h2 id={titleId} className="min-w-0 flex-1 text-lg leading-tight font-bold">
            {title}
            {subtitle && (
              <small className="block text-xs font-medium text-text-muted">{subtitle}</small>
            )}
          </h2>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-text-muted hover:text-text"
            >
              <X className="size-5" aria-hidden />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

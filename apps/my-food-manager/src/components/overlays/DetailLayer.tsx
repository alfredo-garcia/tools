"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/inputs/Button";

const DESKTOP_QUERY = "(min-width: 1024px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

const FOCUSABLE = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Full screen below 1024 px, large modal above it. Owns the top bar (back/close and the compact
 * title that appears once the in-body `[data-detail-title]` scrolls under the bar), focus trap,
 * Esc/backdrop close and the page scroll lock. In the desktop modal the title is always in the bar.
 */
export function DetailLayer({
  title,
  resetKey,
  onClose,
  children,
}: {
  title?: string;
  /** Scroll returns to the top when this changes (another recipe opened in the same layer). */
  resetKey?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop();
  const [compact, setCompact] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const updateCompact = () => {
    const heading = scrollRef.current?.querySelector("[data-detail-title]");
    const bar = barRef.current;
    if (!heading || !bar) return setCompact(false);
    setCompact(heading.getBoundingClientRect().bottom <= bar.getBoundingClientRect().bottom);
  };

  useEffect(updateCompact);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  // Lock the page behind, move focus in, and give it back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    layerRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      root.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDesktop) return onCloseRef.current();
      if (e.key !== "Tab") return;
      const items = [...(layerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (el) => el.offsetParent !== null,
      );
      if (!items.length) return;
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
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDesktop]);

  const closeButton = isDesktop ? (
    <Button
      variant="ghost"
      icon={X}
      aria-label="Cerrar"
      onClick={onClose}
      className="min-h-11 min-w-11 px-3"
    />
  ) : (
    <Button variant="ghost" icon={ArrowLeft} onClick={onClose} className="min-h-11 px-3">
      Atrás
    </Button>
  );

  const compactTitle = (
    <div
      aria-hidden={!isDesktop}
      title={title}
      className={`min-w-0 flex-1 truncate text-base font-bold transition duration-150 ${
        compact || isDesktop ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {title}
    </div>
  );

  return (
    <div
      ref={layerRef}
      data-detail-layer
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Receta"}
      onMouseDown={(e) => {
        if (isDesktop && e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-40 ${isDesktop ? "grid place-items-center bg-black/55" : "bg-bg"}`}
    >
      <div
        className={`flex animate-[detail-in_200ms_ease-out] flex-col bg-bg ${
          isDesktop
            ? "h-[90dvh] w-[min(720px,92vw)] overflow-hidden rounded-lg border border-border shadow-elevation-3"
            : "h-dvh w-full"
        }`}
      >
        <div
          ref={barRef}
          className={`flex min-h-14 shrink-0 items-center gap-2 border-b bg-surface-1 px-2 transition-[border-color,box-shadow] ${
            compact ? "border-border shadow-elevation-1" : "border-transparent"
          }`}
        >
          {isDesktop ? (
            <>
              {compactTitle}
              {closeButton}
            </>
          ) : (
            <>
              {closeButton}
              {compactTitle}
            </>
          )}
        </div>
        <div
          ref={scrollRef}
          onScroll={updateCompact}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/inputs/Button";

/** fullscreen: small windows; modal: medium; panel: the right region of the large layout (not a dialog). */
export type DetailLayerMode = "fullscreen" | "modal" | "panel";

const FOCUSABLE = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Hosts the recipe detail in one of three modes without remounting its content when the mode
 * changes. Owns the top bar (back/close and the title), and, for fullscreen and modal, the focus
 * trap, Esc/backdrop close and the page scroll lock. In fullscreen the title appears in the bar once
 * the in-body `[data-detail-title]` scrolls under it; in modal and panel it is always there.
 */
export function DetailLayer({
  mode,
  title,
  resetKey,
  onClose,
  children,
}: {
  mode: DetailLayerMode;
  title?: string;
  /** Scroll returns to the top when this changes (another recipe opened in the same layer). */
  resetKey?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [compact, setCompact] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const modeRef = useRef(mode);
  useEffect(() => {
    onCloseRef.current = onClose;
    modeRef.current = mode;
  });

  const isModal = mode === "modal";
  const isPanel = mode === "panel";
  const modalLike = mode !== "panel";

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

  // Lock the page behind (not in the panel), move focus in, and give it back to the opener on close.
  useEffect(() => {
    if (!modalLike) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    layerRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      root.style.overflow = previousOverflow;
      // Moving to the panel keeps focus where it is; a real close returns it to the opener.
      if (modeRef.current !== "panel" && opener?.isConnected) opener.focus();
    };
  }, [modalLike]);

  useEffect(() => {
    if (!modalLike) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modeRef.current === "modal") return onCloseRef.current();
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
  }, [modalLike]);

  const titleAlways = mode !== "fullscreen";

  return (
    <div
      ref={layerRef}
      data-detail-layer
      data-detail-mode={mode}
      role={isPanel ? "region" : "dialog"}
      aria-modal={isPanel ? undefined : true}
      aria-label={title ?? "Receta"}
      onMouseDown={(e) => {
        if (isModal && e.target === e.currentTarget) onClose();
      }}
      className={`group ${
        isPanel
          ? "relative h-full min-w-0 flex-1"
          : `fixed inset-0 z-40 ${isModal ? "grid place-items-center bg-black/55" : "bg-bg"}`
      }`}
    >
      <div
        className={`flex flex-col bg-bg ${isPanel ? "" : "animate-[detail-in_200ms_ease-out]"} ${
          isModal
            ? "h-[90dvh] w-[min(720px,92vw)] overflow-hidden rounded-lg border border-border shadow-elevation-3"
            : isPanel
              ? "h-full w-full"
              : "h-dvh w-full"
        }`}
      >
        <div
          ref={barRef}
          className={`flex min-h-14 shrink-0 items-center gap-2 border-b bg-surface-1 px-2 transition-[border-color,box-shadow] ${
            compact ? "border-border shadow-elevation-1" : "border-transparent"
          }`}
        >
          {mode === "fullscreen" && (
            <Button variant="ghost" icon={ArrowLeft} onClick={onClose} className="min-h-11 px-3">
              Atrás
            </Button>
          )}
          <div
            aria-hidden={!titleAlways}
            title={title}
            className={`min-w-0 flex-1 truncate text-base font-bold transition duration-150 ${
              compact || titleAlways ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {title}
          </div>
          {mode !== "fullscreen" && (
            <Button
              variant="ghost"
              icon={X}
              aria-label="Cerrar"
              onClick={onClose}
              className="min-h-11 min-w-11 px-3"
            />
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

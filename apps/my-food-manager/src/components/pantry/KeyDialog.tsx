"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/inputs/Button";

/** Asks for the household write key once per device. Bottom sheet on small windows, centered modal from 640 px. */
export function KeyDialog({
  rejected,
  onSave,
  onClose,
}: {
  rejected: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [empty, setEmpty] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    return () => {
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);

  const save = () => {
    if (!draft.trim()) return setEmpty(true);
    onSave(draft);
  };

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key !== "Tab" || !panel.current) return;
    const focusable = panel.current.querySelectorAll<HTMLElement>("input, button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const error = empty ? "Escribe la clave" : rejected ? "La clave no es correcta" : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={trapFocus}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="key-dialog-title"
        className="w-full max-w-md rounded-t-lg bg-surface-1 p-4 pt-6 shadow-elevation-3 sm:rounded-lg"
      >
        <h2 id="key-dialog-title" className="text-lg font-bold">
          Clave de escritura
        </h2>
        <p className="mb-3 text-text-muted">
          La necesitas una vez por dispositivo para guardar cambios.
        </p>
        <input
          type="password"
          autoComplete="off"
          autoFocus
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setEmpty(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && save()}
          aria-label="Clave de escritura"
          aria-invalid={error !== null}
          className="min-h-12 w-full rounded-full border border-border bg-surface-2 px-4 text-base focus:border-primary-500 focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-1.5 px-1 text-[13px] text-danger-500">
            {error}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Ahora no
          </Button>
          <Button className="flex-1" onClick={save}>
            Guardar clave
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";

/** Pill search field with a leading icon and a clear button that shows while there is text. */
export function SearchInput({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  placeholder: string;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const clear = () => {
    onClear();
    input.current?.focus();
  };

  return (
    <div role="search" className="relative mb-3">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          } else if (e.key === "Escape" && value) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        enterKeyHint="search"
        className="min-h-12 w-full appearance-none rounded-full border border-border bg-surface-2 pr-12 pl-11 text-base font-medium text-text placeholder:text-text-muted focus:border-primary-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Borrar búsqueda"
          className="absolute top-1/2 right-0.5 grid size-11 -translate-y-1/2 place-items-center rounded-full text-text-muted transition hover:bg-surface-1 hover:text-text"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}

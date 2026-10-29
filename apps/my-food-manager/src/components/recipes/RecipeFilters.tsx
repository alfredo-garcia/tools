"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/inputs/Button";
import { FilterChip } from "@/components/inputs/FilterChip";
import { FilterOptions } from "@/components/inputs/FilterOptions";
import {
  FILTERS,
  activeFilterCount,
  filterOptions,
  selectedLabel,
  type FilterKey,
  type FilterState,
} from "@/lib/domain/filters";
import type { Library } from "@/lib/schema";

/** Filter chips, the options panel of the open one, and the "N de M" count with a clear-all action. */
export function RecipeFilters({
  library,
  state,
  onChange,
  shown,
}: {
  library: Pick<Library, "recipes" | "vocab">;
  state: FilterState;
  onChange: (next: FilterState) => void;
  shown: number;
}) {
  const [open, setOpen] = useState<FilterKey | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = (key: FilterKey, value: string | undefined) => {
    const next = { ...state };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const active = activeFilterCount(state);
  const openDef = FILTERS.find((f) => f.key === open);

  return (
    <div ref={root} className="mb-4">
      <div
        role="group"
        aria-label="Filtros"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FILTERS.map(({ key, label }) => {
          const value = state[key];
          const options = filterOptions(library, key, state);
          return (
            <FilterChip
              key={key}
              label={label}
              value={value === undefined ? undefined : selectedLabel(options, value)}
              open={open === key}
              disabled={options.length === 0 && value === undefined}
              onToggle={() => setOpen(open === key ? null : key)}
              onClear={() => {
                set(key, undefined);
                if (open === key) setOpen(null);
              }}
            />
          );
        })}
      </div>

      {openDef && (
        <div
          key={openDef.key}
          className="mt-2 animate-[panel-in_150ms_ease-out] rounded-md border border-border bg-surface-1 p-3 shadow-elevation-1"
        >
          <FilterOptions
            label={openDef.label}
            options={filterOptions(library, openDef.key, state)}
            selected={state[openDef.key]}
            onSelect={(value) => {
              set(openDef.key, value);
              setOpen(null);
            }}
          />
        </div>
      )}

      <div className="mt-2 flex min-h-8 items-center justify-between text-sm text-text-muted">
        <p aria-live="polite">
          {active > 0
            ? `${shown} de ${library.recipes.length} recetas`
            : `${library.recipes.length} ${library.recipes.length === 1 ? "receta" : "recetas"}`}
        </p>
        {active > 1 && (
          <Button
            variant="ghost"
            className="min-h-11 px-3"
            onClick={() => {
              onChange({});
              setOpen(null);
            }}
          >
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

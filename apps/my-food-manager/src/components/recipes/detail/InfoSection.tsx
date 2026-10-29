"use client";

import { useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { TagChip } from "@/components/recipes/TagChip";
import { categoryLabel } from "@/lib/domain/categories";
import {
  INFO_TAG_FAMILIES,
  MISSING,
  difficultyLabel,
  formatMinutes,
  servingsLabel,
  tagLabels,
  totalMinutes,
} from "@/lib/domain/recipe-detail";
import type { Library, Recipe } from "@/lib/schema";
import { CollapsibleSection } from "./CollapsibleSection";

const Dash = () => (
  <span className="text-text-muted" aria-label="sin dato">
    {MISSING}
  </span>
);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="flex min-h-11 items-center text-sm font-medium text-text-muted">{label}</dt>
      <dd className="flex min-h-11 items-center text-sm font-semibold">{children}</dd>
    </>
  );
}

function TimeRow({ time }: { time: Recipe["time"] }) {
  const [open, setOpen] = useState(false);
  const total = totalMinutes(time);
  const part = (min: number | undefined) => (min === undefined ? MISSING : formatMinutes(min));
  return (
    <>
      <Row label="Tiempo">
        <button
          type="button"
          disabled={total === undefined}
          aria-expanded={open}
          aria-controls="time-breakdown"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 w-full items-center gap-2 text-left disabled:cursor-default"
        >
          {total === undefined ? (
            <Dash />
          ) : (
            <>
              {formatMinutes(total)}
              <ChevronDown
                aria-hidden
                className={`ml-auto size-3.5 text-text-muted transition-transform duration-200 ${
                  open ? "" : "-rotate-90"
                }`}
              />
            </>
          )}
        </button>
      </Row>
      <div
        id="time-breakdown"
        className={`col-span-2 grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div inert={!open} className="overflow-hidden">
          <dl className="mb-2 grid grid-cols-[1fr_auto] gap-x-2 rounded-sm bg-surface-2 px-3 py-2 text-sm">
            <dt className="text-text-muted">Preparación</dt>
            <dd className="font-semibold">{part(time?.prep)}</dd>
            <dt className="text-text-muted">Cocción</dt>
            <dd className="font-semibold">{part(time?.cook)}</dd>
            <dt className="text-text-muted">Reposo</dt>
            <dd className="font-semibold">{part(time?.rest)}</dd>
          </dl>
        </div>
      </div>
    </>
  );
}

export function InfoSection({ recipe, library }: { recipe: Recipe; library: Library }) {
  const hasCategory = recipe.category && recipe.category !== "unclassified";
  const difficulty = difficultyLabel(recipe.difficulty);
  const servings = servingsLabel(recipe.servings);
  return (
    <CollapsibleSection title="Info general">
      <dl className="grid grid-cols-[104px_1fr] gap-y-1">
        <Row label="Categoría">
          {hasCategory ? (
            <TagChip tint={`var(--color-cat-${recipe.category}, var(--color-cat-unclassified))`}>
              {categoryLabel(library.vocab.categories, recipe.category)}
            </TagChip>
          ) : (
            <Dash />
          )}
        </Row>
        <TimeRow time={recipe.time} />
        <Row label="Dificultad">
          {recipe.difficulty ? (
            <span className="inline-flex items-center gap-1.5">
              <Flame aria-hidden className="size-3.5" />
              {difficulty}
            </span>
          ) : (
            <Dash />
          )}
        </Row>
        <Row label="Raciones">{servings === MISSING ? <Dash /> : servings}</Row>
        {INFO_TAG_FAMILIES.map(({ key, label }) => {
          const labels = tagLabels(library, key, recipe.tags[key]);
          return (
            <Row key={key} label={label}>
              {labels.length ? (
                <span className="flex flex-wrap gap-2 py-1">
                  {labels.map((l) => (
                    <TagChip key={l}>{l}</TagChip>
                  ))}
                </span>
              ) : (
                <Dash />
              )}
            </Row>
          );
        })}
      </dl>
    </CollapsibleSection>
  );
}

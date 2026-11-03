"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { hasIngredients, type IngredientGroups as Groups } from "@/lib/domain/ingredient-groups";

const COLLAPSE_OVER = 5;

const cap = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

function Group({
  title,
  ids,
  names,
  dot,
  muted,
  collapsible = false,
}: {
  title: string;
  ids: string[];
  names: (id: string) => string;
  dot: string;
  muted?: boolean;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  if (ids.length === 0) return null;
  const heading = (
    <>
      <span aria-hidden className={`size-2.5 shrink-0 rounded-sm ${dot}`} />
      {title} ({ids.length})
    </>
  );
  return (
    <section className="mb-3">
      <h3 className="mt-3 mb-1 text-sm font-bold">
        {collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex min-h-11 w-full items-center gap-2 text-left"
          >
            {heading}
            <ChevronDown
              aria-hidden
              className={`ml-auto size-4 transition ${open ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <span className="flex items-center gap-2">{heading}</span>
        )}
      </h3>
      {open && (
        <ul>
          {ids.map((id) => (
            <li
              key={id}
              className={`border-b border-border px-1 py-2.5 last:border-b-0 ${
                muted ? "text-text-muted" : "font-semibold"
              }`}
            >
              {cap(names(id))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The ingredients of a recipe in Faltan, En mi lista de la compra and Ya tengo; empty groups are not shown. */
export function IngredientGroups({
  groups,
  names,
}: {
  groups: Groups;
  names: (id: string) => string;
}) {
  if (!hasIngredients(groups))
    return <p className="text-text-muted">Esta receta no tiene ingredientes del catálogo.</p>;
  return (
    <>
      {groups.faltan.length === 0 && (
        <p className="text-text-muted">No te falta nada: todo está en tu despensa o en tu lista.</p>
      )}
      <Group title="Faltan" ids={groups.faltan} names={names} dot="bg-warning-500" />
      <Group
        title="En mi lista de la compra"
        ids={groups.lista}
        names={names}
        dot="bg-primary-500"
        muted
      />
      <Group
        title="Ya tengo"
        ids={groups.tengo}
        names={names}
        dot="bg-success-500"
        muted
        collapsible={groups.tengo.length > COLLAPSE_OVER}
      />
    </>
  );
}

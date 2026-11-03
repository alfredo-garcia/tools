"use client";

import { Bike, Utensils, X, type LucideIcon } from "lucide-react";
import { OUT_LABELS } from "@/lib/domain/plan-view";
import type { PlanOut } from "@/lib/schema";

export const OUT_ICONS: Record<PlanOut, LucideIcon> = { "eat-out": Utensils, delivery: Bike };

/** A slot marked as eaten out or ordered in: icon, the schema's label and the X (not on days already past). */
export function PlanOutItem({
  out,
  past,
  columns,
  onRemove,
}: {
  out: PlanOut;
  past: boolean;
  columns: boolean;
  onRemove: () => void;
}) {
  const Icon = OUT_ICONS[out];
  const { label } = OUT_LABELS[out];
  return (
    <li
      className={`my-0.5 flex items-center gap-1 rounded-sm bg-surface-2 ${
        columns ? "min-h-12 pl-1" : "min-h-14 pl-1.5"
      }`}
    >
      <span
        className={`flex min-w-0 flex-1 font-semibold leading-snug ${
          columns ? "items-start gap-1.5 pt-2 text-[13px]" : "items-center gap-3"
        }`}
      >
        {columns ? (
          <Icon className="mt-px size-4 shrink-0" aria-hidden />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-sm border border-border bg-surface-1">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        {label}
      </span>
      {!past && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${label}`}
          className={`grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition hover:bg-surface-1 hover:text-danger-500 ${
            columns ? "-mr-2" : ""
          }`}
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </li>
  );
}

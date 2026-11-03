"use client";

import { Button } from "@/components/inputs/Button";
import { OUT_LABELS } from "@/lib/domain/plan-view";
import { PLAN_OUTS, type PlanOut } from "@/lib/schema";
import { OUT_ICONS } from "./PlanOutItem";

/** The picker's row "Salir fuera" / "Pedir": one tap marks the slot (ADR 005). */
export function PlanOutOptions({
  enabled,
  slotLabel,
  day,
  onChoose,
}: {
  enabled: Record<PlanOut, boolean>;
  /** The slot's name in lower case, for the accessible names ("cena"). */
  slotLabel: string;
  day: string;
  onChoose: (out: PlanOut) => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2">
      {PLAN_OUTS.map((out) => {
        const { option } = OUT_LABELS[out];
        return (
          <Button
            key={out}
            variant="secondary"
            icon={OUT_ICONS[out]}
            disabled={!enabled[out]}
            onClick={() => onChoose(out)}
            aria-label={`${option}, ${slotLabel}, ${day}`}
            className="w-full"
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

import { CloudOff } from "lucide-react";

type Status = "partial" | "done" | "pending-sync" | "paused";

const TEXT: Record<Status, string> = {
  paused: "Pausada",
  partial: "Parcial",
  done: "Hecha",
  "pending-sync": "Pendiente de sincronizar",
};

const STYLE: Record<Status, string> = {
  paused: "bg-surface-2 text-text-muted",
  partial: "bg-[color-mix(in_srgb,var(--color-warning-500)_24%,var(--color-surface-1))] text-text",
  done: "bg-[color-mix(in_srgb,var(--color-success-500)_22%,var(--color-surface-1))] text-text",
  "pending-sync":
    "bg-[color-mix(in_srgb,var(--color-warning-500)_24%,var(--color-surface-1))] text-text",
};

/** Kit `StatusBadge`: caption pill. `paused` is neutral and has no icon (fitness-coach/002). */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center gap-xs rounded-full px-2.5 py-0.5 text-caption whitespace-nowrap ${STYLE[status]}`}
    >
      {status === "pending-sync" && <CloudOff aria-hidden className="size-(--icon-sm)" />}
      {TEXT[status]}
    </span>
  );
}

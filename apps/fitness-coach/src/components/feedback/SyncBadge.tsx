"use client";
import { Check, CloudOff, KeyRound, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import { formatAge } from "@/lib/domain/age";
import { useNow } from "@/components/common/useNow";

export type SyncBadgeStatus = "synced" | "offline" | "syncing" | "error" | "invalid_key";

type Props = {
  status: SyncBadgeStatus;
  syncedAt?: string | null;
  onInvalidKey?: () => void;
  "data-testid"?: string;
};

const LOOK: Record<SyncBadgeStatus, { icon: LucideIcon; tint: string; iconColor: string }> = {
  synced: { icon: Check, tint: "bg-success-500/16", iconColor: "text-success-500" },
  offline: { icon: CloudOff, tint: "bg-warning-500/18", iconColor: "text-text" },
  syncing: { icon: RefreshCw, tint: "bg-surface-2", iconColor: "text-text-muted" },
  error: { icon: TriangleAlert, tint: "bg-warning-500/18", iconColor: "text-text" },
  invalid_key: { icon: KeyRound, tint: "bg-warning-500/18", iconColor: "text-text" },
};

/**
 * Kit `SyncBadge` (FR-9, AC-13): five states, always with text and icon (never color alone).
 * Warning states keep the text in `color.text` on the warning tint (ui_standards §2).
 */
export function SyncBadge({ status, syncedAt, onInvalidKey, "data-testid": testId }: Props) {
  const now = useNow(30_000, [status, syncedAt]);
  const age = syncedAt ? formatAge(new Date(syncedAt), new Date(now)) : null;
  const text = {
    synced: age ? `Sincronizado · ${age}` : "Sincronizado",
    offline: age ? `Sin conexión · datos de ${age}` : "Sin conexión",
    syncing: "Sincronizando…",
    error: age ? `No se pudo actualizar · datos de ${age}` : "No se pudo actualizar",
    invalid_key: "Clave no válida · toca para introducirla",
  }[status];
  const { icon: Icon, tint, iconColor } = LOOK[status];
  const body = (
    <>
      <Icon aria-hidden className={`size-(--icon-sm) shrink-0 ${iconColor}`} />
      <span>{text}</span>
    </>
  );
  const pill = `inline-flex items-center gap-xs rounded-full px-sm py-xs text-caption text-text ${tint}`;
  return (
    <div role="status" data-testid={testId} className="inline-flex">
      {status === "invalid_key" ? (
        <button
          type="button"
          onClick={onInvalidKey}
          className={`${pill} min-h-(--size-touch-min) px-md`}
        >
          {body}
        </button>
      ) : (
        <span className={pill}>{body}</span>
      )}
    </div>
  );
}

import { Clock } from "lucide-react";

/** TEMP: "N cambios pendientes" bar; offers to enter the write key when the device has none. */
export function TmpPendingChanges({
  count,
  keyNeeded,
  onEnterKey,
}: {
  count: number;
  keyNeeded: boolean;
  onEnterKey: () => void;
}) {
  return (
    <div
      role="status"
      className="mt-3 flex items-center gap-2 rounded-full border border-warning-500 bg-warning-500/15 py-1.5 pr-1.5 pl-3.5 text-[13px] font-semibold"
    >
      <Clock className="size-3.5 shrink-0" aria-hidden />
      <span className="flex-1">
        {count} {count === 1 ? "cambio pendiente" : "cambios pendientes"}
      </span>
      {keyNeeded && (
        <button
          type="button"
          onClick={onEnterKey}
          className="min-h-9 rounded-full bg-warning-500 px-3.5 text-[13px] font-bold text-primary-contrast"
        >
          Introducir clave
        </button>
      )}
    </div>
  );
}

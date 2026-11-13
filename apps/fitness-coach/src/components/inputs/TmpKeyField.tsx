"use client";
// TEMP (fitness-coach/001, UX Flow §5): access key field. Propose for the registry once the
// feature ships (UX Flow §7.1).
import { Eye, EyeOff } from "lucide-react";

type Props = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  error: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
  /** Prefix of the test ids: `<prefix>-input`, `<prefix>-visibility-toggle`, `<prefix>-error`. */
  testIdPrefix: string;
};

export function TmpKeyField({
  id,
  label,
  value,
  visible,
  error,
  disabled,
  onChange,
  onToggleVisible,
  testIdPrefix,
}: Props) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-sm">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      <div
        className={`flex items-center rounded-sm bg-surface-2 ${error ? "outline-2 outline-danger-500" : ""}`}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete="current-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`${testIdPrefix}-input`}
          className="min-h-(--size-button-height) min-w-0 flex-1 bg-transparent px-md text-body text-text outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
          aria-pressed={visible}
          disabled={disabled}
          data-testid={`${testIdPrefix}-visibility-toggle`}
          className="flex size-(--size-touch-min) shrink-0 items-center justify-center text-text-muted"
        >
          {visible ? (
            <EyeOff aria-hidden className="size-(--icon-md)" />
          ) : (
            <Eye aria-hidden className="size-(--icon-md)" />
          )}
        </button>
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          data-testid={`${testIdPrefix}-error`}
          className="text-caption text-danger-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}

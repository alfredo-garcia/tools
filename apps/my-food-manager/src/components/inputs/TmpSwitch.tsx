import { Check } from "lucide-react";

const ON_TRACK = {
  success: "border-success-500 bg-success-500",
  primary: "border-primary-500 bg-primary-500",
};

/** TEMP: labeled on/off switch. State shows in the knob position, its check mark and the label weight, not only in color. */
export function TmpSwitch({
  label,
  checked,
  tone,
  disabled,
  ariaLabel,
  onChange,
}: {
  label: string;
  checked: boolean;
  tone: keyof typeof ON_TRACK;
  disabled?: boolean;
  ariaLabel: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onChange}
      className={`flex min-h-14 w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-sm ${
        disabled ? "cursor-default opacity-65" : ""
      }`}
    >
      <span
        aria-hidden
        className={`relative h-[26px] w-11 rounded-full border-2 transition-colors duration-150 ${
          checked ? ON_TRACK[tone] : "border-border bg-surface-2"
        }`}
      >
        <span
          className={`absolute top-px left-px grid size-5 place-items-center rounded-full transition-[left] duration-150 ${
            checked ? "left-[19px] bg-bg text-text" : "bg-text-muted"
          }`}
        >
          {checked && <Check className="size-3 stroke-[3.4]" />}
        </span>
      </span>
      <span
        className={`text-xs ${checked ? "font-bold text-text" : "font-semibold text-text-muted"}`}
      >
        {label}
      </span>
    </button>
  );
}

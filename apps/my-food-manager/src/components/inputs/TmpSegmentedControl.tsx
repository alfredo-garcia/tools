/** TEMP: exclusive choice among a few options, as a tab list or as a radio group. */
export function TmpSegmentedControl<T extends string>({
  kind,
  ariaLabel,
  items,
  value,
  onChange,
}: {
  kind: "tabs" | "radio";
  ariaLabel: string;
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role={kind === "tabs" ? "tablist" : "radiogroup"}
      aria-label={ariaLabel}
      className="flex gap-1 rounded-full bg-surface-2 p-1"
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role={kind === "tabs" ? "tab" : "radio"}
            {...(kind === "tabs" ? { "aria-selected": selected } : { "aria-checked": selected })}
            onClick={() => onChange(item.value)}
            className={`min-h-11 flex-1 rounded-full px-3 text-[14px] font-semibold whitespace-nowrap transition ${
              selected
                ? "bg-surface-1 text-text shadow-elevation-1 outline-2 -outline-offset-2 outline-primary-500"
                : "text-text-muted"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

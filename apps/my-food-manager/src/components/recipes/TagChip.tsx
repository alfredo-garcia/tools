/** Non-interactive chip for tags and the category (the kit's `Chip` is a filter toggle). */
export function TagChip({ children, tint }: { children: React.ReactNode; tint?: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-semibold ${
        tint ? "border-transparent text-[#15130f]" : "border-border bg-surface-2"
      }`}
      style={tint ? { background: tint } : undefined}
    >
      {children}
    </span>
  );
}

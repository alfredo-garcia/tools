import type { ReactNode } from "react";

export function EmptyState({
  emoji,
  title,
  hint,
  action,
}: {
  emoji: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <div className="text-5xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="max-w-xs text-sm text-text-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

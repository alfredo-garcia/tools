import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = { icon: LucideIcon; title: string; text?: string; action?: ReactNode };

/** Kit `EmptyState`: icon, title, short text and an optional action. */
export function EmptyState({ icon: Icon, title, text, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-md px-lg py-xl text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface-2">
        <Icon aria-hidden className="size-(--icon-nav) text-text-muted" />
      </span>
      <h2 className="text-heading-2">{title}</h2>
      {text && <p className="max-w-80 text-body text-text-muted">{text}</p>}
      {action}
    </div>
  );
}

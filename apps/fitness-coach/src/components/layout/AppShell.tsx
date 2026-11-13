"use client";
import { RefreshCw } from "lucide-react";
import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { MEDIUM_UP, useMediaQuery } from "@/components/common/useMediaQuery";
import { Button } from "@/components/inputs/Button";

type Props = {
  title: string;
  /** Usually a `SyncBadge`. */
  badge?: ReactNode;
  /** Pull-to-refresh below 640 px; "Actualizar" button from 640 px (FR-6d/e). */
  onRefresh?: () => void;
  children: ReactNode;
};

/** Distance the finger has to travel down, from the top of the page, to trigger a refresh. */
const PULL_THRESHOLD = 70;

/** Kit `AppShell`: page frame with title, badge, content and the refresh gesture or button. */
export function AppShell({ title, badge, onRefresh, children }: Props) {
  const wide = useMediaQuery(MEDIUM_UP);
  const start = useRef<number | null>(null);
  const [pull, setPull] = useState(0);

  const onTouchStart = (e: TouchEvent) => {
    start.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (start.current === null) return;
    setPull(Math.max(0, Math.min(e.touches[0].clientY - start.current, PULL_THRESHOLD * 1.5)));
  };
  const onTouchEnd = () => {
    if (start.current !== null && pull >= PULL_THRESHOLD) onRefresh?.();
    start.current = null;
    setPull(0);
  };

  const touch =
    !wide && onRefresh ? { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd } : {};

  return (
    <div className="min-h-dvh" {...touch}>
      {pull > 0 && (
        <div aria-hidden className="flex justify-center pt-sm" style={{ height: pull }}>
          <RefreshCw
            className="size-(--icon-md) text-text-muted"
            style={{ transform: `rotate(${(pull / PULL_THRESHOLD) * 270}deg)` }}
          />
        </div>
      )}
      <div className="mx-auto max-w-(--size-content-max) px-md pt-lg pb-xl">
        <header className="mb-lg flex flex-col gap-sm medium:flex-row medium:items-center medium:justify-between">
          <h1 className="text-heading-1">{title}</h1>
          <div className="flex items-center gap-sm">
            {badge}
            {wide && onRefresh && (
              <Button
                variant="ghost"
                icon={RefreshCw}
                aria-label="Actualizar"
                onClick={onRefresh}
                data-testid="refresh-button"
              />
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const BUTTON =
  "absolute top-28 z-10 grid size-11 place-items-center rounded-full border border-border bg-surface-1 shadow-elevation-1 transition";

/** Previous and next week buttons at the sides of the columns. Going back is disabled at the current week. */
export function WeekNav({
  canGoBack,
  onPrevious,
  onNext,
}: {
  canGoBack: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => canGoBack && onPrevious()}
        aria-label="Semana anterior"
        aria-disabled={!canGoBack}
        className={`${BUTTON} left-0 ${canGoBack ? "hover:bg-surface-2" : "cursor-default opacity-35 shadow-none"}`}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Semana siguiente"
        className={`${BUTTON} right-0 hover:bg-surface-2`}
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { PlanDay } from "./PlanDay";
import type { PlanActions } from "./PlanSlot";
import { datesFrom } from "@/lib/domain/plan-calendar";
import type { PlanView } from "@/lib/domain/plan-view";
import { EMPTY_DAY } from "@/lib/domain/plan-view";

/** Small windows: days from today stacked; reaching the end loads more (no limit, also offline). */
export function PlanDayList({
  today,
  count,
  view,
  actions,
  onMore,
}: {
  today: string;
  count: number;
  view: PlanView;
  actions: PlanActions;
  onMore: () => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  const more = useRef(onMore);
  useEffect(() => {
    more.current = onMore;
  });
  // Re-observed after every batch: if the end is still in view, the next batch loads too.
  useEffect(() => {
    const node = end.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && more.current(),
      { rootMargin: "0px 0px 80px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [count]);

  return (
    <div className="mx-auto max-w-[720px]">
      {datesFrom(today, count).map((date, i) => (
        <PlanDay
          key={date}
          date={date}
          index={i}
          dishes={view[date] ?? EMPTY_DAY}
          actions={actions}
        />
      ))}
      <div ref={end} aria-hidden className="h-px" />
    </div>
  );
}

"use client";

import { PlanColumn } from "./PlanColumn";
import { WeekNav } from "./WeekNav";
import type { PlanActions } from "./PlanSlot";
import { formatRange, weekDates } from "@/lib/domain/plan-calendar";
import { EMPTY_DAY, type PlanView } from "@/lib/domain/plan-view";

/** Medium and large windows: one Monday–Sunday week in columns, from the current week on. */
export function PlanWeek({
  today,
  offset,
  view,
  actions,
  onOffset,
}: {
  today: string;
  offset: number;
  view: PlanView;
  actions: PlanActions;
  onOffset: (offset: number) => void;
}) {
  const dates = weekDates(today, offset);
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg leading-tight font-bold">{formatRange(dates[0], dates[6])}</h2>
        {offset === 0 && (
          <span className="rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-semibold text-primary-500">
            Esta semana
          </span>
        )}
      </div>
      <div className="relative px-[22px]">
        <WeekNav
          canGoBack={offset > 0}
          onPrevious={() => onOffset(offset - 1)}
          onNext={() => onOffset(offset + 1)}
        />
        <div
          role="group"
          aria-label="Semana"
          // The week scrolls sideways when seven columns do not fit (medium windows).
          className="grid grid-cols-[repeat(7,minmax(132px,1fr))] items-start gap-1.5 overflow-x-auto pb-2"
        >
          {dates.map((date) => (
            <PlanColumn
              key={date}
              date={date}
              past={date < today}
              today={date === today}
              dishes={view[date] ?? EMPTY_DAY}
              actions={actions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

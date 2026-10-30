"use client";

import { PlanSlot, type PlanActions } from "./PlanSlot";
import { PLAN_MEAL_LABELS, type DayDishes } from "@/lib/domain/plan-view";
import { dayOfMonth, formatDay, weekdayShort } from "@/lib/domain/plan-calendar";

/** One day of the weekly view. Days before today are dimmed and read only. */
export function PlanColumn({
  date,
  past,
  today,
  dishes,
  actions,
}: {
  date: string;
  past: boolean;
  today: boolean;
  dishes: DayDishes;
  actions: PlanActions;
}) {
  return (
    <section
      aria-label={formatDay(date)}
      aria-current={today ? "date" : undefined}
      className={`min-w-0 rounded-md bg-surface-2 p-2 ${past ? "opacity-55" : ""} ${
        today ? "outline-2 -outline-offset-2 outline-primary-500" : ""
      }`}
    >
      <header className="pt-1 pb-2 text-center text-xs font-bold tracking-[0.06em] text-text-muted uppercase">
        {weekdayShort(date)}
        <b
          className={`block text-[22px] leading-tight font-extrabold tracking-normal ${
            today ? "text-primary-500" : "text-text"
          }`}
        >
          {dayOfMonth(date)}
        </b>
      </header>
      {PLAN_MEAL_LABELS.map(({ meal, label }) => (
        <PlanSlot
          key={meal}
          date={date}
          meal={meal}
          label={label}
          dishes={dishes[meal]}
          past={past}
          columns
          actions={actions}
        />
      ))}
    </section>
  );
}

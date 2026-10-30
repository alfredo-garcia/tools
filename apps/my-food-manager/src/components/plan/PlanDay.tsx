"use client";

import { PlanSlot, type PlanActions } from "./PlanSlot";
import { PLAN_MEAL_LABELS, type DayDishes } from "@/lib/domain/plan-view";
import { dayHeading, formatDay } from "@/lib/domain/plan-calendar";

/** One day of the vertical list: heading and its three slots. */
export function PlanDay({
  date,
  index,
  dishes,
  actions,
}: {
  date: string;
  index: number;
  dishes: DayDishes;
  actions: PlanActions;
}) {
  return (
    <section aria-label={formatDay(date)} className="mt-5">
      <h2
        className={`mb-2 text-lg leading-tight font-bold first-letter:uppercase ${
          index === 0 ? "text-primary-500" : ""
        }`}
      >
        {dayHeading(date, index)}
        {index < 2 && (
          <small className="ml-2 text-xs font-medium text-text-muted">{formatDay(date)}</small>
        )}
      </h2>
      {PLAN_MEAL_LABELS.map(({ meal, label }) => (
        <PlanSlot
          key={meal}
          date={date}
          meal={meal}
          label={label}
          dishes={dishes[meal]}
          past={false}
          columns={false}
          actions={actions}
        />
      ))}
    </section>
  );
}

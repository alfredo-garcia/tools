/**
 * [fitness-coach/002] Pure logic of "Mis rutinas" (PRD FR-2, FR-3, FR-5; UX Flow 2.1, 2.2).
 * Synthetic data only.
 */
import { describe, expect, it } from "vitest";
import {
  daysAria,
  filterCounts,
  formatDose,
  groupRoutines,
  routineExerciseCount,
  sortRoutines,
  type RoutineLike,
} from "./routines";

function r(
  id: string,
  over: Partial<RoutineLike> & { days?: RoutineLike["days"] } = {},
): RoutineLike {
  return {
    id,
    title: over.title ?? id,
    category: over.category ?? "strength",
    status: over.status ?? "active",
    days: over.days,
    blocks: over.blocks ?? [{ id: "main", items: [{ ex: "a" }] }],
  };
}

describe("[fitness-coach/002] routineExerciseCount", () => {
  it("adds the items of every block (FR-2)", () => {
    const routine = r("x", {
      blocks: [
        { id: "a", items: [{ ex: "1" }, { ex: "2" }, { ex: "3" }] },
        { id: "b", items: [{ ex: "4" }, { ex: "5" }, { ex: "6" }, { ex: "7" }] },
        { id: "c", items: [] },
      ],
    });
    expect(routineExerciseCount(routine)).toBe(7);
  });
});

describe("[fitness-coach/002] sortRoutines (FR-2)", () => {
  it("orders by first weekday, then by title in Spanish; no fixed day goes last", () => {
    const list = [
      r("express", { title: "Express", days: [] }),
      r("b", { title: "Zancadas", days: ["thu"] }),
      r("c", { title: "Ábdomen", days: ["mon", "fri"] }),
      r("d", { title: "Bici", days: ["thu", "mon"] }),
      r("e", { title: "Natación", days: ["tue"] }),
      r("f", { title: "Andar" }),
    ];
    expect(sortRoutines(list).map((x) => x.id)).toEqual(["c", "d", "e", "b", "f", "express"]);
  });
});

describe("[fitness-coach/002] groupRoutines (FR-1, FR-3)", () => {
  const list = [
    r("mon-strength", { days: ["mon"], category: "strength" }),
    r("thu-strength", { days: ["thu"], category: "strength" }),
    r("mon-swim", { days: ["mon"], category: "swim-day" }),
    r("mon-paused", { days: ["mon"], category: "cardio", status: "paused" }),
    r("tue-paused", { days: ["tue"], category: "cardio", status: "paused" }),
  ];

  it("splits active and paused with no filters", () => {
    const g = groupRoutines(list, { day: "all", type: "all" });
    expect(g.active.map((x) => x.id)).toEqual(["mon-strength", "mon-swim", "thu-strength"]);
    expect(g.paused.map((x) => x.id)).toEqual(["mon-paused", "tue-paused"]);
  });

  it("day filter applies to both groups (AC-6)", () => {
    const g = groupRoutines(list, { day: "mon", type: "all" });
    expect(g.active.map((x) => x.id)).toEqual(["mon-strength", "mon-swim"]);
    expect(g.paused.map((x) => x.id)).toEqual(["mon-paused"]);
  });

  it("day and type combine with AND (AC-7)", () => {
    const g = groupRoutines(list, { day: "mon", type: "strength" });
    expect(g.active.map((x) => x.id)).toEqual(["mon-strength"]);
    expect(g.paused).toEqual([]);
  });

  it("a routine without days only passes the 'all' day filter (AC-3)", () => {
    const g = groupRoutines([r("free", { days: [] }), r("none")], { day: "sun", type: "all" });
    expect(g.active).toEqual([]);
    expect(groupRoutines([r("none")], { day: "all", type: "all" }).active).toHaveLength(1);
  });
});

describe("[fitness-coach/002] filterCounts (UX Flow 2.1)", () => {
  const list = [
    r("a", { days: ["mon", "thu"], category: "strength" }),
    r("b", { days: ["mon"], category: "swim-day" }),
    r("c", { days: [], category: "express", status: "paused" }),
  ];

  it("counts each option with the other filter as it is, both groups included", () => {
    const c = filterCounts(list, { day: "all", type: "all" });
    expect(c.day).toEqual({ all: 3, mon: 2, tue: 0, wed: 0, thu: 1, fri: 0, sat: 0, sun: 0 });
    expect(c.type).toEqual({ all: 3, strength: 1, "swim-day": 1, express: 1 });

    const withMon = filterCounts(list, { day: "mon", type: "all" });
    expect(withMon.type).toEqual({ all: 2, strength: 1, "swim-day": 1, express: 0 });
  });

  it("offers only the categories that some routine has (FR-3)", () => {
    expect(Object.keys(filterCounts(list, { day: "all", type: "all" }).type)).toEqual([
      "all",
      "strength",
      "swim-day",
      "express",
    ]);
  });
});

describe("[fitness-coach/002] daysAria (AC-2, AC-3)", () => {
  it("names the days with Spanish initials in week order", () => {
    expect(daysAria(["thu", "mon"])).toBe("Días: L · J");
    expect(daysAria(["wed", "sun"])).toBe("Días: X · D");
  });
  it("says 'Sin día fijo' when there are none", () => {
    expect(daysAria([])).toBe("Sin día fijo");
    expect(daysAria(undefined)).toBe("Sin día fijo");
  });
});

describe("[fitness-coach/002] formatDose (FR-5, AC-11)", () => {
  it("formats sets × reps, sets × seconds, hold and minutes", () => {
    expect(formatDose({ ex: "a", sets: 3, reps: 12 })).toBe("3 × 12");
    expect(formatDose({ ex: "a", sets: 2, time: 30 })).toBe("2 × 30 s");
    expect(formatDose({ ex: "a", hold: 20 })).toBe("aguantar 20 s");
    expect(formatDose({ ex: "a", duration_min: 10 })).toBe("10 min");
  });

  it("reps or time without sets, and a hold after reps", () => {
    expect(formatDose({ ex: "a", reps: 12 })).toBe("12");
    expect(formatDose({ ex: "a", time: 45 })).toBe("45 s");
    expect(formatDose({ ex: "a", sets: 3, reps: 10, hold: 10 })).toBe("3 × 10 · aguanta 10 s");
  });

  it("adds the rest: the item's, else the routine's", () => {
    expect(formatDose({ ex: "a", sets: 3, reps: 12, rest: 60 }, 90)).toBe("3 × 12 · descanso 60 s");
    expect(formatDose({ ex: "a", sets: 3, reps: 12 }, 90)).toBe("3 × 12 · descanso 90 s");
  });

  it("adds 'por lado' for unilateral exercises", () => {
    expect(formatDose({ ex: "a", sets: 3, time: 70 }, undefined, "unilateral")).toBe(
      "3 × 70 s por lado",
    );
  });

  it("returns an empty string when there is no dose", () => {
    expect(formatDose({ ex: "a" })).toBe("");
  });
});

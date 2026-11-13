/**
 * [fitness-coach/001] Relative age shown by SyncBadge and the summary card (PRD §9, UX Flow 2.3 `edad(t)`).
 *
 * Seam required from the implementation (test contract, see tests/README.md):
 *   src/lib/domain/age.ts
 *     export function formatAge(from: Date, now: Date): string
 *   Returns "hace un momento", "hace N min", "hace N h", "ayer" or a short date (2+ days).
 */
process.env.TZ = "America/Bogota";

import { describe, expect, it } from "vitest";
import { formatAge } from "@/lib/domain/age";

const now = new Date("2026-11-12T12:00:00-05:00");
const minus = (ms: number) => new Date(now.getTime() - ms);
const MIN = 60_000;
const H = 60 * MIN;

describe("[fitness-coach/001] formatAge", () => {
  it("[fitness-coach/001] AC-4 / AC-8: under a minute is 'hace un momento'", () => {
    expect(formatAge(now, now)).toBe("hace un momento");
    expect(formatAge(minus(59_000), now)).toBe("hace un momento");
  });

  it("[fitness-coach/001] AC-13: minutes", () => {
    expect(formatAge(minus(1 * MIN), now)).toBe("hace 1 min");
    expect(formatAge(minus(5 * MIN), now)).toBe("hace 5 min");
    expect(formatAge(minus(59 * MIN), now)).toBe("hace 59 min");
  });

  it("[fitness-coach/001] AC-1 / AC-14: hours", () => {
    expect(formatAge(minus(1 * H), now)).toBe("hace 1 h");
    expect(formatAge(minus(2 * H), now)).toBe("hace 2 h");
  });

  it("[fitness-coach/001] PRD §9: the previous local day is 'ayer'", () => {
    expect(formatAge(new Date("2026-11-11T09:00:00-05:00"), now)).toBe("ayer");
  });

  it("[fitness-coach/001] PRD §9: two days or more is a date, never 'hace' or 'ayer'", () => {
    const out = formatAge(new Date("2026-11-09T09:00:00-05:00"), now);
    expect(out).not.toMatch(/^hace|^ayer/);
    expect(out).toMatch(/9/);
  });
});

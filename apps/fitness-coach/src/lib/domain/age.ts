/**
 * Relative age of the data (PRD §9, UX Flow 2.3 `edad(t)`), with `Intl` only (tech_standards §1).
 */
const MIN = 60_000;
const H = 60 * MIN;

const shortDate = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatAge(from: Date, now: Date): string {
  const diff = now.getTime() - from.getTime();
  if (diff < MIN) return "hace un momento"; // also a clock that went backwards
  if (diff < H) return `hace ${Math.floor(diff / MIN)} min`;
  if (diff < 24 * H) return `hace ${Math.floor(diff / H)} h`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  if (startOfLocalDay(from) >= yesterday) return "ayer";
  return shortDate.format(from);
}

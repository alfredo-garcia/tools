/** "hace 3 min"-style label; falls back safely on invalid or future dates. */
export function timeAgo(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return "nunca";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "hace un momento";
  const min = Math.floor((now.getTime() - t) / 60_000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

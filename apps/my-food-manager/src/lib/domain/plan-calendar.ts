/** Calendar helpers of the Plan. Dates are `YYYY-MM-DD` strings; arithmetic runs in UTC so daylight saving never shifts a day. */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const WEEKDAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Days loaded first on a small window (today and the next 7) and each time its end is reached. */
export const INITIAL_DAYS = 8;
export const MORE_DAYS = 7;

const toUtc = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fromUtc = (d: Date) => d.toISOString().slice(0, 10);

/** The device's local calendar date. */
export function localDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Monday of the week that holds `date`. */
export function mondayOf(date: string): string {
  return addDays(date, -((toUtc(date).getUTCDay() + 6) % 7));
}

/** `count` consecutive dates starting today. */
export function datesFrom(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

/** The seven dates, Monday to Sunday, of the week `offset` weeks after the current one. */
export function weekDates(today: string, offset: number): string[] {
  const start = addDays(mondayOf(today), 7 * offset);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const dayNumber = (date: string) => toUtc(date).getUTCDate();
const monthName = (date: string) => MONTHS[toUtc(date).getUTCMonth()];

/** "jueves 5 nov" */
export function formatDay(date: string): string {
  return `${WEEKDAYS[toUtc(date).getUTCDay()]} ${dayNumber(date)} ${monthName(date)}`;
}

/** Heading of the `index`-th day of the list: "Hoy", "Mañana", then the full day. */
export function dayHeading(date: string, index: number): string {
  return index === 0 ? "Hoy" : index === 1 ? "Mañana" : formatDay(date);
}

export const weekdayShort = (date: string) => WEEKDAYS_SHORT[toUtc(date).getUTCDay()];
export const dayOfMonth = dayNumber;

/** "26 oct – 1 nov" */
export function formatRange(start: string, end: string): string {
  return `${dayNumber(start)} ${monthName(start)} – ${dayNumber(end)} ${monthName(end)}`;
}

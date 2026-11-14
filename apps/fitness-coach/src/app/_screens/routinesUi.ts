/**
 * UI state of "Mis rutinas" that lives while the app is open (PRD 002 FR-3, FR-4, FR-8): the
 * filters, the list's scroll position, and which routine the detail shows. The routine id stays
 * on the device (memory + sessionStorage, so a reload of /routines/detail still knows it), never
 * in the URL (tech_standards §10).
 */
import type { RoutineFilters } from "@/lib/domain/routines";

const SELECTED_KEY = "fc.routines.selected";

let filters: RoutineFilters = { day: "all", type: "all" };
let scrollY: number | null = null;
let selected: string | null = null;
let fromList = false;

export const routinesUi = {
  get filters() {
    return filters;
  },
  setFilters(next: RoutineFilters) {
    filters = next;
  },
  /** Remembered when a card opens the detail; read once when the list comes back. */
  saveScroll(y: number) {
    scrollY = y;
  },
  takeScroll(): number | null {
    const y = scrollY;
    scrollY = null;
    return y;
  },
  /** For the list drawn behind the modal: same position, left for the real list to take. */
  peekScroll(): number | null {
    return scrollY;
  },
  /** True when the detail was opened from the list in this app session (so Back = history back). */
  get openedFromList() {
    return fromList;
  },
  select(id: string) {
    selected = id;
    fromList = true;
    try {
      sessionStorage.setItem(SELECTED_KEY, id);
    } catch {
      // storage blocked: memory is enough while the app stays open
    }
  },
  /** The detail is leaving: a later direct launch of /routines/detail is not "from the list". */
  leftDetail() {
    fromList = false;
  },
  get selected(): string | null {
    if (selected) return selected;
    try {
      selected = sessionStorage.getItem(SELECTED_KEY);
    } catch {
      selected = null;
    }
    return selected;
  },
};

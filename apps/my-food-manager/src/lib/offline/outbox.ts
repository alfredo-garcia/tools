import { isPantryOp, isReviewOp, type PendingOp } from "@/lib/domain/pantry-view";
import {
  opsResponseSchema,
  type OpsResponse,
  type PantryOpKind,
  type PlanMeal,
  type PlanOpKind,
} from "@/lib/schema";

/** Waits before each retry after a failed send; the last one repeats (PRD FR-15). */
export const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 60_000];
const MAX_BATCH = 100;

/** A change the server rejected: the ingredient of a pantry switch or the recipe of a plan or favorite change. */
export interface Notice {
  id: number;
  ingredient?: string;
  recipe?: string;
  /** The rejected change was a favorite toggle; the screens that show hearts report it. */
  favorite?: boolean;
}

const subjectOf = (o: PendingOp): Omit<Notice, "id"> =>
  isPantryOp(o)
    ? { ingredient: o.ingredient }
    : isReviewOp(o)
      ? { recipe: o.recipe, favorite: true }
      : { recipe: o.recipe };

const wireOf = (o: PendingOp) =>
  isPantryOp(o)
    ? { id: o.id, kind: o.kind, ingredient: o.ingredient, value: o.value }
    : isReviewOp(o)
      ? { id: o.id, kind: o.kind, recipe: o.recipe, value: o.value }
      : { id: o.id, kind: o.kind, date: o.date, meal: o.meal, recipe: o.recipe };

export interface OutboxState {
  hydrated: boolean;
  /** Changes made on this device and not confirmed by the server yet, in order. */
  pending: PendingOp[];
  sending: boolean;
  hasKey: boolean;
  /** The server refused the stored key; changes wait for a new one. */
  keyRejected: boolean;
  notices: Notice[];
  /** False when the device storage is unavailable: pending changes then live in memory only. */
  storageOk: boolean;
}

export interface OutboxDeps {
  fetch: typeof fetch;
  storage: { get(): Promise<PendingOp[] | undefined>; set(value: PendingOp[]): Promise<void> };
  keyStore: { get(): string | null; set(key: string): void };
  isOnline: () => boolean;
  isVisible: () => boolean;
  newId: () => string;
  /** Called with the pantry, plan and reviews the server saved, so the stored library matches before the next sync. */
  onSaved: (saved: Pick<OpsResponse, "pantry" | "plan" | "reviews">) => void;
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export function createOutbox(deps: OutboxDeps) {
  let state: OutboxState = {
    hydrated: false,
    pending: [],
    sending: false,
    hasKey: !!deps.keyStore.get(),
    keyRejected: false,
    notices: [],
    storageOk: true,
  };
  let inflight = new Set<string>();
  let attempt = 0;
  let retryTimer: unknown;
  let noticeSeq = 0;
  const listeners = new Set<() => void>();

  const set = (patch: Partial<OutboxState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };

  async function persist() {
    try {
      await deps.storage.set(state.pending);
    } catch {
      set({ storageOk: false });
    }
  }

  function scheduleRetry() {
    deps.clearTimeout(retryTimer);
    const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
    attempt++;
    retryTimer = deps.setTimeout(() => void flush(), delay);
  }

  /** Removes sent operations that the server answered for (or that it can never accept). */
  function settle(ids: Set<string>, rejected: Map<string, Omit<Notice, "id">> = new Map()) {
    const notices = [...rejected.values()].map((subject) => ({ id: ++noticeSeq, ...subject }));
    set({
      pending: state.pending.filter((o) => !ids.has(o.id)),
      notices: [...state.notices, ...notices],
    });
    return persist();
  }

  async function flush(): Promise<void> {
    if (state.sending || !state.hydrated) return;
    const key = deps.keyStore.get();
    const batch = state.pending.slice(0, MAX_BATCH);
    if (batch.length === 0 || !key || !deps.isOnline()) return;
    if (!deps.isVisible()) {
      scheduleRetry();
      return;
    }

    deps.clearTimeout(retryTimer);
    inflight = new Set(batch.map((o) => o.id));
    set({ sending: true });
    const ids = new Set(inflight);

    let res: Response;
    try {
      res = await deps.fetch("/api/ops", {
        method: "POST",
        headers: { "content-type": "application/json", "x-app-key": key },
        body: JSON.stringify({
          ops: batch.map(wireOf),
        }),
      });
    } catch {
      inflight = new Set();
      set({ sending: false });
      scheduleRetry();
      return;
    }

    if (res.status === 401) {
      inflight = new Set();
      set({ sending: false, keyRejected: true });
      return;
    }
    if (res.status === 400) {
      // The server can never accept this batch as written: drop it instead of retrying forever.
      const byId = new Map(batch.map((o) => [o.id, subjectOf(o)]));
      inflight = new Set();
      await settle(ids, byId);
      set({ sending: false });
      void flush();
      return;
    }

    let body: OpsResponse | undefined;
    if (res.ok) {
      const parsed = opsResponseSchema.safeParse(await res.json().catch(() => undefined));
      if (parsed.success) body = parsed.data;
    }
    if (!body) {
      inflight = new Set();
      set({ sending: false });
      scheduleRetry();
      return;
    }

    attempt = 0;
    deps.onSaved({ pantry: body.pantry, plan: body.plan, reviews: body.reviews });
    const rejected = new Map<string, Omit<Notice, "id">>();
    for (const r of body.results)
      if (r.status === "rejected") {
        const op = batch.find((o) => o.id === r.id);
        if (op) rejected.set(r.id, subjectOf(op));
      }
    inflight = new Set();
    await settle(ids, rejected);
    set({ sending: false });
    void flush();
  }

  return {
    getState: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },

    async hydrate() {
      let stored: PendingOp[] = [];
      let storageOk = true;
      try {
        stored = (await deps.storage.get()) ?? [];
      } catch {
        storageOk = false;
      }
      // Changes enqueued before the stored list loaded keep their place after it.
      set({ hydrated: true, storageOk, pending: [...stored, ...state.pending] });
      await flush();
    },

    /**
     * Records one change. Unsent changes to the same switch collapse into the new one; a change equal to
     * what is stored (and not racing a sent one) needs no operation at all (PRD FR-14).
     */
    async enqueue(kind: PantryOpKind, ingredient: string, value: boolean, storedValue: boolean) {
      const same = (o: PendingOp) =>
        isPantryOp(o) && o.ingredient === ingredient && o.kind === kind;
      const kept = state.pending.filter((o) => !(same(o) && !inflight.has(o.id)));
      const racing = kept.some(same);
      const next =
        !racing && value === storedValue
          ? kept
          : [...kept, { id: deps.newId(), kind, ingredient, value }];
      set({ pending: next });
      await persist();
      void flush();
    },

    /**
     * Records a favorite toggle. Unsent toggles of the same recipe collapse into the new one; one equal to what is
     * stored (and not racing a sent one) needs no operation at all.
     */
    async enqueueFavorite(recipe: string, value: boolean, storedValue: boolean) {
      const same = (o: PendingOp) => isReviewOp(o) && o.recipe === recipe;
      const kept = state.pending.filter((o) => !(same(o) && !inflight.has(o.id)));
      const racing = kept.some(same);
      const next =
        !racing && value === storedValue
          ? kept
          : [...kept, { id: deps.newId(), kind: "review.setFavorite" as const, recipe, value }];
      set({ pending: next });
      await persist();
      void flush();
    },

    /** Records a plan change. Changes are ordered and never collapse: a repeated recipe is a second dish. */
    async enqueuePlan(kind: PlanOpKind, date: string, meal: PlanMeal, recipe: string) {
      set({ pending: [...state.pending, { id: deps.newId(), kind, date, meal, recipe }] });
      await persist();
      void flush();
    },

    /** Stores the household key and tries again. */
    setKey(key: string) {
      deps.keyStore.set(key.trim());
      set({ hasKey: true, keyRejected: false });
      attempt = 0;
      void flush();
    },

    /** Reports a favorite that could not even be queued (Al's reviews file is missing). */
    notifyFavoriteFailed(recipe: string) {
      set({ notices: [...state.notices, { id: ++noticeSeq, recipe, favorite: true }] });
    },

    dismissNotice(id: number) {
      set({ notices: state.notices.filter((n) => n.id !== id) });
    },

    /** Triggers: app open, connection back, app visible again. */
    flush,
  };
}

export type Outbox = ReturnType<typeof createOutbox>;

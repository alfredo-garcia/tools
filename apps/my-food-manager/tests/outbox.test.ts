import { describe, expect, it, vi } from "vitest";
import type { PendingOp } from "@/lib/domain/pantry-view";
import { RETRY_DELAYS_MS, createOutbox, type OutboxDeps } from "@/lib/offline/outbox";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const saved = (...ids: string[]) =>
  json({
    results: ids.map((id) => ({ id, status: "applied" })),
    pantry: { have: ["leche"], to_buy: [] },
  });
const tick = () => new Promise((r) => setTimeout(r, 0));

function setup(over: Partial<OutboxDeps> = {}, key: string | null = "casa", stored?: PendingOp[]) {
  let n = 0;
  let storedKey = key;
  let online = true;
  let saved_: PendingOp[] | undefined = stored;
  const timers: { fn: () => void; ms: number }[] = [];
  const fetchMock = vi.fn();
  const deps: OutboxDeps = {
    fetch: fetchMock as never,
    storage: {
      get: async () => saved_,
      set: async (v) => {
        saved_ = v;
      },
    },
    keyStore: { get: () => storedKey, set: (k) => (storedKey = k) },
    isOnline: () => online,
    isVisible: () => true,
    newId: () => `op${++n}`,
    onSaved: vi.fn(),
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
    clearTimeout: () => undefined,
    ...over,
  };
  const outbox = createOutbox(deps);
  return {
    outbox,
    deps,
    fetchMock,
    timers,
    persisted: () => saved_,
    setOnline: (v: boolean) => (online = v),
  };
}

describe("outbox", () => {
  it("sends a change right away and clears it when saved", async () => {
    const t = setup();
    t.fetchMock.mockResolvedValue(saved("op1"));
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await tick();
    const [url, init] = t.fetchMock.mock.calls[0];
    expect(url).toBe("/api/ops");
    expect(init.headers["x-app-key"]).toBe("casa");
    expect(JSON.parse(init.body).ops).toEqual([
      { id: "op1", kind: "pantry.setHave", ingredient: "leche", value: true },
    ]);
    expect(t.outbox.getState().pending).toEqual([]);
    expect(t.deps.onSaved).toHaveBeenCalledWith({ have: ["leche"], to_buy: [] });
    expect(t.persisted()).toEqual([]);
  });

  it("keeps changes pending, in order, while offline and sends them on reconnect", async () => {
    const t = setup();
    t.setOnline(false);
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await t.outbox.enqueue("pantry.setBuy", "nata", true, false);
    expect(t.fetchMock).not.toHaveBeenCalled();
    expect(t.outbox.getState().pending.map((o) => o.ingredient)).toEqual(["leche", "nata"]);
    expect(t.persisted()).toHaveLength(2);

    t.setOnline(true);
    t.fetchMock.mockResolvedValue(saved("op1", "op2"));
    await t.outbox.flush();
    expect(
      JSON.parse(t.fetchMock.mock.calls[0][1].body).ops.map((o: PendingOp) => o.ingredient),
    ).toEqual(["leche", "nata"]);
    expect(t.outbox.getState().pending).toEqual([]);
  });

  it("collapses unsent changes to the same switch into the last one", async () => {
    const t = setup();
    t.setOnline(false);
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await t.outbox.enqueue("pantry.setHave", "leche", false, false);
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    expect(t.outbox.getState().pending).toHaveLength(1);
    expect(t.outbox.getState().pending[0].value).toBe(true);
  });

  it("drops a change that returns a switch to its stored value", async () => {
    const t = setup();
    t.setOnline(false);
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await t.outbox.enqueue("pantry.setHave", "leche", false, false);
    expect(t.outbox.getState().pending).toEqual([]);
  });

  it("restores pending changes after a reload and sends them", async () => {
    const stored: PendingOp[] = [
      { id: "old", kind: "pantry.setBuy", ingredient: "nata", value: true },
    ];
    const t = setup({}, "casa", stored);
    t.fetchMock.mockResolvedValue(saved("old"));
    await t.outbox.hydrate();
    expect(t.fetchMock).toHaveBeenCalledOnce();
    expect(t.outbox.getState().pending).toEqual([]);
  });

  it("keeps changes and asks for a key when none is stored", async () => {
    const t = setup({}, null);
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    expect(t.fetchMock).not.toHaveBeenCalled();
    expect(t.outbox.getState()).toMatchObject({ hasKey: false });
    expect(t.outbox.getState().pending).toHaveLength(1);

    t.fetchMock.mockResolvedValue(saved("op1"));
    t.outbox.setKey(" casa ");
    await tick();
    expect(t.fetchMock.mock.calls[0][1].headers["x-app-key"]).toBe("casa");
    expect(t.outbox.getState()).toMatchObject({ hasKey: true, pending: [] });
  });

  it("keeps changes and flags the key when the server answers 401", async () => {
    const t = setup();
    t.fetchMock.mockResolvedValue(json({ error: { code: "UNAUTHORIZED", message: "x" } }, 401));
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await tick();
    expect(t.outbox.getState()).toMatchObject({ keyRejected: true });
    expect(t.outbox.getState().pending).toHaveLength(1);
    expect(t.timers).toHaveLength(0);

    t.fetchMock.mockResolvedValue(saved("op1"));
    t.outbox.setKey("nueva");
    await tick();
    expect(t.outbox.getState()).toMatchObject({ keyRejected: false, pending: [] });
  });

  it("drops a rejected change and reports it", async () => {
    const t = setup();
    t.fetchMock.mockResolvedValue(
      json({
        results: [{ id: "op1", status: "rejected", error: { code: "INVALID_OP", message: "x" } }],
        pantry: { have: [], to_buy: [] },
      }),
    );
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await tick();
    expect(t.outbox.getState().pending).toEqual([]);
    expect(t.outbox.getState().notices).toMatchObject([{ ingredient: "leche" }]);
    t.outbox.dismissNotice(t.outbox.getState().notices[0].id);
    expect(t.outbox.getState().notices).toEqual([]);
  });

  it("keeps changes and retries with increasing waits after a failure", async () => {
    const t = setup();
    t.fetchMock.mockRejectedValue(new TypeError("network"));
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await tick();
    expect(t.outbox.getState().pending).toHaveLength(1);
    expect(t.timers.map((x) => x.ms)).toEqual([RETRY_DELAYS_MS[0]]);

    t.fetchMock.mockResolvedValue(
      json({ error: { code: "DRIVE_UNAVAILABLE", message: "x" } }, 502),
    );
    t.timers[0].fn();
    await tick();
    expect(t.timers.map((x) => x.ms)).toEqual([RETRY_DELAYS_MS[0], RETRY_DELAYS_MS[1]]);

    t.fetchMock.mockResolvedValue(saved("op1"));
    t.timers[1].fn();
    await tick();
    expect(t.outbox.getState().pending).toEqual([]);
  });

  it("does not collapse a change into one that is already being sent", async () => {
    const t = setup();
    let release!: (r: Response) => void;
    t.fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (release = r)));
    await t.outbox.hydrate();
    await t.outbox.enqueue("pantry.setHave", "leche", true, false);
    await t.outbox.enqueue("pantry.setHave", "leche", false, false);
    expect(t.outbox.getState().pending.map((o) => o.value)).toEqual([true, false]);

    t.fetchMock.mockResolvedValue(saved("op2"));
    release(saved("op1"));
    await tick();
    await tick();
    expect(t.outbox.getState().pending).toEqual([]);
    expect(t.fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sends in batches of at most 100 operations", async () => {
    const stored: PendingOp[] = Array.from({ length: 150 }, (_, i) => ({
      id: `o${i}`,
      kind: "pantry.setBuy",
      ingredient: `i${i}`,
      value: true,
    }));
    const t = setup({}, "casa", stored);
    t.fetchMock.mockImplementation(async (_u: string, init: { body: string }) =>
      saved(...JSON.parse(init.body).ops.map((o: PendingOp) => o.id)),
    );
    await t.outbox.hydrate();
    await tick();
    expect(t.fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).ops.length)).toEqual([100, 50]);
    expect(t.outbox.getState().pending).toEqual([]);
  });
});

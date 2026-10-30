import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { assertWriteKey } from "@/lib/api/write-key";
import { runOps } from "@/lib/drive/ops";
import { DriveConflictError, type FoodSource } from "@/lib/drive/types";
import { parsePantry } from "@/lib/domain/parse";
import { fixtureDrive } from "./helpers";

function setup(conflicts = 0) {
  const drive = fixtureDrive();
  let left = conflicts;
  const writes: string[] = [];
  const source: FoodSource = {
    list: async () => drive.files,
    readText: drive.read,
    readBytes: async () => new Uint8Array(),
    writeText: vi.fn(async (_f, text) => {
      if (left-- > 0) throw new DriveConflictError();
      writes.push(text);
    }),
  };
  const deps = {
    source,
    list: async () => drive.files,
    now: () => new Date("2026-10-30T15:00:00Z"),
  };
  return { source, deps, writes };
}
const ops = (...o: [string, string, boolean][]) =>
  o.map(([kind, ingredient, value], i) => ({ id: String(i), kind, ingredient, value }));

describe("runOps", () => {
  it("writes the merged pantry once and returns it", async () => {
    const { deps, writes } = setup();
    const r = await runOps(
      ops(["pantry.setHave", "leche", true], ["pantry.setBuy", "nata", false]),
      deps,
    );
    expect(writes).toHaveLength(1);
    expect(r.pantry!.have).toContain("leche");
    expect(parsePantry(writes[0]).to_buy).toEqual(["pimiento-rojo"]);
    expect(writes[0]).not.toMatch(/^have:/m);
  });

  it("does not write when nothing changes", async () => {
    const { deps, source } = setup();
    const r = await runOps(ops(["pantry.setHave", "arroz", true]), deps);
    expect(source.writeText).not.toHaveBeenCalled();
    expect(r.results[0].status).toBe("unchanged");
  });

  it("re-reads and retries once on a conflict", async () => {
    const { deps, source, writes } = setup(1);
    await runOps(ops(["pantry.setHave", "leche", true]), deps);
    expect(source.writeText).toHaveBeenCalledTimes(2);
    expect(writes).toHaveLength(1);
  });

  it("gives up with CONFLICT after the second conflict and writes nothing", async () => {
    const { deps, writes } = setup(2);
    await expect(runOps(ops(["pantry.setHave", "leche", true]), deps)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
    expect(writes).toHaveLength(0);
  });

  it("rejects ids that are not in the catalog without failing the batch", async () => {
    const { deps } = setup();
    const r = await runOps(
      ops(["pantry.setHave", "no-existe", true], ["pantry.setHave", "leche", true]),
      deps,
    );
    expect(r.results.map((x) => x.status)).toEqual(["rejected", "applied"]);
  });

  it("reports a missing pantry file and never creates it", async () => {
    const { deps, source } = setup();
    const files = (await deps.list()).filter((f) => f.path !== "pantry/pantry.yaml");
    await expect(
      runOps(ops(["pantry.setHave", "leche", true]), { ...deps, list: async () => files }),
    ).rejects.toMatchObject({
      code: "PANTRY_MISSING",
      status: 404,
    });
    expect(source.writeText).not.toHaveBeenCalled();
  });
});

describe("assertWriteKey", () => {
  it("accepts the right key", () => {
    expect(() => assertWriteKey("casa", "casa")).not.toThrow();
  });

  it("rejects a missing or wrong key with 401", () => {
    for (const sent of [null, "", "mala"])
      expect(() => assertWriteKey(sent, "casa")).toThrow(
        expect.objectContaining({ code: "UNAUTHORIZED", status: 401 }),
      );
  });

  it("fails with a configuration error when the server has no key", () => {
    expect(() => assertWriteKey("casa", "")).toThrow(ApiError);
    expect(() => assertWriteKey("casa", undefined)).toThrow(
      expect.objectContaining({ code: "CONFIG_MISSING" }),
    );
  });
});

describe("runOps with plan operations (ADR 003)", () => {
  const planOp = (id: string, kind: string, recipe: string, meal = "lunch") => ({
    id,
    kind,
    date: "2026-11-02",
    meal,
    recipe,
  });

  function planSetup(over: { drop?: string; conflicts?: Record<string, number> } = {}) {
    const drive = fixtureDrive();
    const files = drive.files.filter((f) => f.path !== over.drop);
    const left = { ...(over.conflicts ?? {}) };
    const writes: { path: string; text: string }[] = [];
    const source: FoodSource = {
      list: async () => files,
      readText: drive.read,
      readBytes: async () => new Uint8Array(),
      writeText: vi.fn(async (f, text) => {
        if ((left[f.path] ?? 0) > 0) {
          left[f.path]--;
          throw new DriveConflictError();
        }
        writes.push({ path: f.path, text });
        drive.contents.set(f.path, text);
      }),
    };
    const deps = { source, list: async () => files, now: () => new Date("2026-10-30T15:00:00Z") };
    return { deps, writes, source };
  }

  it("writes the plan only and returns just the plan", async () => {
    const { deps, writes } = planSetup();
    const r = await runOps([planOp("a", "plan.addRecipe", "bizcocho")], deps);
    expect(writes.map((w) => w.path)).toEqual(["plan/plan.yaml"]);
    expect(r.pantry).toBeUndefined();
    expect(r.plan?.days["2026-11-02"].map((m) => m.slot)).toEqual(["breakfast", "lunch"]);
    expect(r.results).toEqual([{ id: "a", status: "applied" }]);
  });

  it("writes pantry first and plan last, and answers in request order", async () => {
    const { deps, writes } = planSetup();
    const r = await runOps(
      [
        planOp("p1", "plan.addRecipe", "bizcocho"),
        { id: "b1", kind: "pantry.setBuy", ingredient: "leche", value: true },
        planOp("p2", "plan.addRecipe", "inventada"),
      ],
      deps,
    );
    expect(writes.map((w) => w.path)).toEqual(["pantry/pantry.yaml", "plan/plan.yaml"]);
    expect(r.results.map((x) => [x.id, x.status])).toEqual([
      ["p1", "applied"],
      ["b1", "applied"],
      ["p2", "rejected"],
    ]);
    expect(r.pantry?.to_buy).toContain("leche");
  });

  it("retries a plan conflict once and fails with CONFLICT when it persists", async () => {
    const once = planSetup({ conflicts: { "plan/plan.yaml": 1 } });
    await runOps([planOp("a", "plan.addRecipe", "bizcocho")], once.deps);
    expect(once.writes).toHaveLength(1);

    const twice = planSetup({ conflicts: { "plan/plan.yaml": 2 } });
    await expect(
      runOps([planOp("a", "plan.addRecipe", "bizcocho")], twice.deps),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("rejects plan operations, not the batch, when the plan file is missing", async () => {
    const { deps } = planSetup({ drop: "plan/plan.yaml" });
    const r = await runOps(
      [
        planOp("p", "plan.addRecipe", "bizcocho"),
        { id: "b", kind: "pantry.setBuy", ingredient: "leche", value: true },
      ],
      deps,
    );
    expect(r.results[0]).toMatchObject({ status: "rejected", error: { code: "PLAN_MISSING" } });
    expect(r.results[1].status).toBe("applied");
    expect(r.plan).toBeUndefined();
  });
});

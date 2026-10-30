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
    expect(r.pantry.have).toContain("leche");
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

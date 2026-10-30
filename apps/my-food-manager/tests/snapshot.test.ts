import { SNAPSHOT_SCHEMA_VERSION } from "@/lib/schema";
import { describe, expect, it } from "vitest";
import { buildSnapshot, computeEtag, relevantFiles, photoFiles } from "@/lib/domain/snapshot";
import { fixtureDrive } from "./helpers";

describe("buildSnapshot", () => {
  it("builds the whole library from the fixture folder", async () => {
    const { files, read } = fixtureDrive();
    const snap = await buildSnapshot(files, read, () => new Date("2026-10-28T12:00:00Z"));
    expect(snap.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION);
    expect(snap.data.recipes.map((r) => r.id)).toEqual([
      "bizcocho",
      "pasta-bolonesa",
      "pollo-al-ajillo",
    ]);
    expect(Object.keys(snap.data.ingredients).length).toBeGreaterThan(5);
    expect(snap.data.pantry.have).toContain("arroz");
    expect(snap.data.pantry.to_buy).toContain("nata");
    expect(Object.keys(snap.data.reviews).sort()).toEqual(["al", "ana"]);
    expect(snap.data.people).toEqual([
      { id: "al", name: "Al" },
      { id: "ana", name: "Ana" },
    ]);
    expect(snap.data.vocab.categories).toHaveProperty("mains");
    expect(snap.data.vocab.families).toHaveProperty("vegetables");
    expect(snap.data.vocab.units).toHaveProperty("g");
    expect(snap.generatedAt).toBe("2026-10-28T12:00:00.000Z");
    expect(snap.warnings).toEqual([]);
  });

  it("carries the plan, and leaves it out without a warning when the file does not exist", async () => {
    const { files, read } = fixtureDrive();
    const snap = await buildSnapshot(files, read);
    expect(Object.keys(snap.data.plan!.days)).toEqual(["2026-10-30", "2026-11-02"]);
    expect(snap.data.plan!.days["2026-10-30"].map((m) => m.slot)).toEqual([
      "lunch",
      "snack",
      "dinner",
    ]);

    const without = await buildSnapshot(
      files.filter((f) => f.path !== "plan/plan.yaml"),
      read,
    );
    expect(without.data.plan).toBeUndefined();
    expect(without.warnings).toEqual([]);
  });

  it("changes the validator when the plan file changes", async () => {
    const { files } = fixtureDrive();
    const changed = files.map((f) =>
      f.path === "plan/plan.yaml" ? { ...f, modifiedTime: "2026-10-30T10:00:00.000Z" } : f,
    );
    expect(computeEtag(changed)).not.toBe(computeEtag(files));
  });

  it("skips a malformed recipe, reports it in warnings and keeps the rest", async () => {
    const { files, read } = fixtureDrive({ "recipes/items/05-mains/roto.md": "no frontmatter" });
    const snap = await buildSnapshot(files, read);
    expect(snap.data.recipes).toHaveLength(3);
    expect(snap.warnings).toEqual([
      { file: "recipes/items/05-mains/roto.md", message: expect.any(String) },
    ]);
  });

  it("warns instead of failing when optional files are missing", async () => {
    const { files, read } = fixtureDrive();
    const without = files.filter((f) => f.path !== "pantry/pantry.yaml");
    const snap = await buildSnapshot(without, read);
    expect(snap.data.pantry).toEqual({ have: [], to_buy: [] });
    expect(snap.warnings.some((w) => w.file === "pantry/pantry.yaml")).toBe(true);
  });

  it("marks recipes that have a photo with its version", async () => {
    const { files, read } = fixtureDrive();
    const withPhoto = [
      ...files,
      {
        id: "p1",
        path: "recipes/_attachments/bizcocho.jpg",
        modifiedTime: "2026-10-27T00:00:00.000Z",
      },
    ];
    const snap = await buildSnapshot(withPhoto, read);
    expect(snap.data.recipes.find((r) => r.id === "bizcocho")?.photoVersion).toBe(
      "2026-10-27T00:00:00.000Z",
    );
    expect(snap.data.recipes.find((r) => r.id === "pollo-al-ajillo")?.photoVersion).toBeUndefined();
    expect(photoFiles(withPhoto).has("bizcocho")).toBe(true);
  });

  it("propagates Drive read failures instead of returning a partial snapshot", async () => {
    const { files } = fixtureDrive();
    const read = async () => {
      const e = new Error("quota");
      e.name = "DriveReadError";
      throw e;
    };
    await expect(buildSnapshot(files, read)).rejects.toThrow("quota");
  });
});

describe("computeEtag", () => {
  const { files } = fixtureDrive();

  it("is stable regardless of listing order", () => {
    expect(computeEtag(files)).toBe(computeEtag([...files].reverse()));
  });
  it("changes when a relevant file is modified, added or removed", () => {
    const base = computeEtag(files);
    const modified = files.map((f, i) =>
      i === 0 ? { ...f, modifiedTime: "2026-11-01T00:00:00.000Z" } : f,
    );
    expect(computeEtag(modified)).not.toBe(base);
    expect(computeEtag(files.slice(1))).not.toBe(base);
    expect(
      computeEtag([
        ...files,
        { id: "n", path: "recipes/items/05-mains/nueva.md", modifiedTime: "x" },
      ]),
    ).not.toBe(base);
  });
  it("ignores irrelevant files", () => {
    const base = computeEtag(files);
    expect(computeEtag([...files, { id: "z", path: "notes/todo.md", modifiedTime: "x" }])).toBe(
      base,
    );
    expect(relevantFiles(files).length).toBe(files.length);
  });
});

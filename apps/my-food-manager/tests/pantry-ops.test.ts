import { describe, expect, it } from "vitest";
import { applyPantryOps, timestampWithOffset, PantryParseError } from "@/lib/domain/pantry-ops";
import { parsePantry } from "@/lib/domain/parse";
import { fixtureDrive } from "./helpers";

const NOW = new Date("2026-10-30T15:30:00Z");
const catalog = {
  ...Object.fromEntries(
    ["arroz", "patata", "cebolla", "ajo", "huevo", "pimiento-rojo", "nata", "leche", "limon"].map(
      (id) => [id, { staple: false }],
    ),
  ),
  sal: { staple: true },
};
const pantryText = () => fixtureDrive().contents.get("pantry/pantry.yaml")!;
const op = (id: string, kind: string, ingredient: string, value: unknown) => ({
  id,
  kind,
  ingredient,
  value,
});

describe("applyPantryOps (pantry schema 2)", () => {
  it("sets have and to_buy on the entries and sets updated with the -05:00 offset", () => {
    const r = applyPantryOps(
      pantryText(),
      [op("1", "pantry.setHave", "leche", true), op("2", "pantry.setBuy", "nata", false)],
      catalog,
      NOW,
    );
    expect(r.changed).toBe(true);
    expect(r.results.map((x) => x.status)).toEqual(["applied", "applied"]);
    const saved = parsePantry(r.text);
    expect(saved.have).toEqual(["patata", "cebolla", "ajo", "huevo", "leche", "arroz"]);
    expect(saved.to_buy).toEqual(["pimiento-rojo"]);
    expect(saved.updated).toBe("2026-10-30T10:30:00-05:00");
    expect(r.pantry).toEqual({
      updated: "2026-10-30T10:30:00-05:00",
      have: saved.have,
      to_buy: saved.to_buy,
    });
  });

  it("changes only the touched values and keeps comments and the layout of the file", () => {
    const original = pantryText();
    const r = applyPantryOps(original, [op("1", "pantry.setHave", "leche", true)], catalog, NOW);
    const diff = r.text.split("\n").filter((line, i) => line !== original.split("\n")[i]);
    expect(diff.map((l) => l.trim())).toEqual([
      "updated: 2026-10-30T10:30:00-05:00",
      "leche: { have: true, to_buy: false }",
    ]);
    expect(r.text).toContain("# Verduras y hortalizas");
    expect(r.text).toContain("# What's at home and what to buy.");
    expect(r.text).toContain("items:\n");
  });

  it("keeps the alignment of columns when the file uses them", () => {
    const text = [
      "updated: x",
      "items:",
      "  patata:  { have: true,  to_buy: false }",
      "  leche:   { have: false, to_buy: false }",
      "",
    ].join("\n");
    const r = applyPantryOps(text, [op("1", "pantry.setHave", "patata", false)], catalog, NOW);
    expect(r.text).toContain("  patata:  { have: false, to_buy: false }");
    expect(r.text).toContain("  leche:   { have: false, to_buy: false }");
  });

  it("adds an entry, in flow style, for a catalog ingredient that has none yet", () => {
    const r = applyPantryOps(pantryText(), [op("1", "pantry.setBuy", "limon", true)], catalog, NOW);
    expect(r.text).toMatch(/limon: \{ have: false, to_buy: true \}/);
    expect(parsePantry(r.text).to_buy).toContain("limon");
  });

  it("never writes the old top-level have / to_buy lists", () => {
    const r = applyPantryOps(
      pantryText(),
      [op("1", "pantry.setHave", "leche", true)],
      catalog,
      NOW,
    );
    expect(r.text).not.toMatch(/^have:/m);
    expect(r.text).not.toMatch(/^to_buy:/m);
  });

  it("keeps fields the app does not know, on the entry and in the file", () => {
    const text =
      "updated: x\nnotes: keep me\nitems:\n  arroz: { have: true, to_buy: false, brand: x }\n";
    const r = applyPantryOps(text, [op("1", "pantry.setBuy", "arroz", true)], catalog, NOW);
    expect(r.text).toContain("notes: keep me");
    expect(r.text).toContain("brand: x");
  });

  it("does not touch the file when nothing changes", () => {
    const text = pantryText();
    const r = applyPantryOps(
      text,
      [
        op("1", "pantry.setHave", "arroz", true),
        op("2", "pantry.setBuy", "leche", false),
        op("3", "pantry.setBuy", "limon", false),
      ],
      catalog,
      NOW,
    );
    expect(r.changed).toBe(false);
    expect(r.text).toBe(text);
    expect(r.results.map((x) => x.status)).toEqual(["unchanged", "unchanged", "unchanged"]);
  });

  it("does not write when a batch ends where it started", () => {
    const text = pantryText();
    const r = applyPantryOps(
      text,
      [
        op("1", "pantry.setHave", "leche", true),
        op("2", "pantry.setHave", "leche", false),
        op("3", "pantry.setBuy", "limon", true),
        op("4", "pantry.setBuy", "limon", false),
      ],
      catalog,
      NOW,
    );
    expect(r.changed).toBe(false);
    expect(r.text).toBe(text);
  });

  it("rejects bad operations and staples, and still applies the rest", () => {
    const r = applyPantryOps(
      pantryText(),
      [
        op("1", "pantry.setHave", "no-existe", true),
        op("2", "pantry.deleteAll", "arroz", true),
        op("3", "pantry.setHave", "arroz", "yes"),
        op("4", "pantry.setBuy", "sal", true),
        op("5", "pantry.setBuy", "leche", true),
      ],
      catalog,
      NOW,
    );
    expect(r.results.map((x) => [x.status, x.error?.code])).toEqual([
      ["rejected", "INVALID_OP"],
      ["rejected", "INVALID_OP"],
      ["rejected", "INVALID_OP"],
      ["rejected", "INVALID_OP"],
      ["applied", undefined],
    ]);
    expect(parsePantry(r.text).to_buy).toContain("leche");
    expect(r.text).not.toMatch(/\bsal:/);
  });

  it("refuses a file that is not schema 2 instead of mixing formats", () => {
    const legacy = "updated: x\nhave: [arroz]\nto_buy: [nata]\n";
    expect(() =>
      applyPantryOps(legacy, [op("1", "pantry.setHave", "leche", true)], catalog, NOW),
    ).toThrow(PantryParseError);
    expect(() =>
      applyPantryOps("", [op("1", "pantry.setHave", "leche", true)], catalog, NOW),
    ).toThrow(PantryParseError);
  });

  it("refuses a file that is not valid YAML", () => {
    expect(() =>
      applyPantryOps("items: {a", [op("1", "pantry.setHave", "arroz", true)], catalog, NOW),
    ).toThrow(PantryParseError);
  });

  it("formats timestamps in the -05:00 offset", () => {
    expect(timestampWithOffset(new Date("2026-10-30T03:00:00Z"))).toBe("2026-10-29T22:00:00-05:00");
  });
});

describe("parsePantry (pantry schema 2)", () => {
  it("derives the ids at home and on the list from items", () => {
    expect(parsePantry(pantryText())).toEqual({
      updated: "2026-10-30T08:35:03-05:00",
      have: ["patata", "cebolla", "ajo", "huevo", "arroz"],
      to_buy: ["pimiento-rojo", "nata"],
    });
  });

  it("reads the real file of the food folder when it is available locally", async () => {
    const fs = await import("node:fs");
    const real = `${process.env.HOME}/knowledge-base/food/pantry/pantry.yaml`;
    if (!fs.existsSync(real)) return;
    const pantry = parsePantry(fs.readFileSync(real, "utf8"));
    expect(Array.isArray(pantry.have)).toBe(true);
    expect(pantry.updated).toBeTruthy();
  });

  it("a toggle on the real file changes only that entry and updated", async () => {
    const fs = await import("node:fs");
    const real = `${process.env.HOME}/knowledge-base/food/pantry/pantry.yaml`;
    if (!fs.existsSync(real)) return;
    const original = fs.readFileSync(real, "utf8");
    const r = applyPantryOps(
      original,
      [op("1", "pantry.setBuy", "leche", true)],
      { leche: { staple: false } },
      NOW,
    );
    const a = original.split("\n");
    const changed = r.text.split("\n").filter((line, i) => line !== a[i]);
    expect(changed).toHaveLength(2);
    expect(r.text.split("\n")).toHaveLength(a.length);
  });

  it("rejects the old list format", () => {
    expect(() => parsePantry("have: [arroz]\nto_buy: []\n")).toThrow();
  });
});

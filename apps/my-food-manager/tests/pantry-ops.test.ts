import { describe, expect, it } from "vitest";
import { applyPantryOps, timestampWithOffset, PantryParseError } from "@/lib/domain/pantry-ops";
import { parsePantry } from "@/lib/domain/parse";
import { fixtureDrive } from "./helpers";

const NOW = new Date("2026-10-30T15:30:00Z");
const known = new Set([
  "arroz",
  "patata",
  "cebolla",
  "ajo",
  "huevo",
  "pimiento-rojo",
  "nata",
  "leche",
]);
const pantryText = () => fixtureDrive().contents.get("pantry/pantry.yaml")!;
const op = (id: string, kind: string, ingredient: string, value: unknown) => ({
  id,
  kind,
  ingredient,
  value,
});

describe("applyPantryOps", () => {
  it("adds and removes ids and sets updated with the -05:00 offset", () => {
    const r = applyPantryOps(
      pantryText(),
      [op("1", "pantry.setHave", "leche", true), op("2", "pantry.setBuy", "nata", false)],
      known,
      NOW,
    );
    expect(r.changed).toBe(true);
    expect(r.results.map((x) => x.status)).toEqual(["applied", "applied"]);
    const saved = parsePantry(r.text);
    expect(saved.have).toEqual(["arroz", "patata", "cebolla", "ajo", "huevo", "leche"]);
    expect(saved.to_buy).toEqual(["pimiento-rojo"]);
    expect(saved.updated).toBe("2026-10-30T10:30:00-05:00");
    expect(r.pantry).toEqual({
      updated: "2026-10-30T10:30:00-05:00",
      have: saved.have,
      to_buy: saved.to_buy,
    });
  });

  it("keeps comments and fields the app does not know", () => {
    const text = `# What's at home\nupdated: 2026-10-26T15:00:00-05:00\nhave:\n  - arroz\nto_buy: []\nnotes: keep me\n`;
    const r = applyPantryOps(text, [op("1", "pantry.setBuy", "nata", true)], known, NOW);
    expect(r.text).toContain("# What's at home");
    expect(r.text).toContain("notes: keep me");
    expect(parsePantry(r.text).to_buy).toEqual(["nata"]);
  });

  it("does not touch the file when nothing changes", () => {
    const text = pantryText();
    const r = applyPantryOps(
      text,
      [op("1", "pantry.setHave", "arroz", true), op("2", "pantry.setBuy", "leche", false)],
      known,
      NOW,
    );
    expect(r.changed).toBe(false);
    expect(r.text).toBe(text);
    expect(r.results.map((x) => x.status)).toEqual(["unchanged", "unchanged"]);
  });

  it("does not write when a batch ends where it started", () => {
    const r = applyPantryOps(
      pantryText(),
      [op("1", "pantry.setHave", "leche", true), op("2", "pantry.setHave", "leche", false)],
      known,
      NOW,
    );
    expect(r.changed).toBe(false);
    expect(r.results.map((x) => x.status)).toEqual(["applied", "applied"]);
  });

  it("rejects bad operations and still applies the rest", () => {
    const r = applyPantryOps(
      pantryText(),
      [
        op("1", "pantry.setHave", "no-existe", true),
        op("2", "pantry.deleteAll", "arroz", true),
        op("3", "pantry.setHave", "arroz", "yes"),
        op("4", "pantry.setBuy", "leche", true),
      ],
      known,
      NOW,
    );
    expect(r.results.map((x) => [x.status, x.error?.code])).toEqual([
      ["rejected", "INVALID_OP"],
      ["rejected", "INVALID_OP"],
      ["rejected", "INVALID_OP"],
      ["applied", undefined],
    ]);
    expect(parsePantry(r.text).to_buy).toContain("leche");
  });

  it("keeps one occurrence of ids duplicated in the file when it writes", () => {
    const text = "have: [arroz, arroz, patata]\nto_buy: []\n";
    const r = applyPantryOps(text, [op("1", "pantry.setBuy", "nata", true)], known, NOW);
    expect(parsePantry(r.text).have).toEqual(["arroz", "patata"]);
  });

  it("works on an empty file", () => {
    const r = applyPantryOps("", [op("1", "pantry.setHave", "arroz", true)], known, NOW);
    expect(parsePantry(r.text).have).toEqual(["arroz"]);
  });

  it("refuses a file that is not valid YAML", () => {
    expect(() =>
      applyPantryOps("have: [a", [op("1", "pantry.setHave", "arroz", true)], known, NOW),
    ).toThrow(PantryParseError);
  });

  it("formats timestamps in the -05:00 offset", () => {
    expect(timestampWithOffset(new Date("2026-10-30T03:00:00Z"))).toBe("2026-10-29T22:00:00-05:00");
  });
});

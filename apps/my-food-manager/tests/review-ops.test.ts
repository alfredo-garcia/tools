import { describe, expect, it } from "vitest";
import { applyReviewOps } from "@/lib/domain/review-ops";
import { parseReviews } from "@/lib/domain/parse";
import { fixtureDrive } from "./helpers";

const NOW = new Date("2026-10-30T15:00:00Z");
const IDS = new Set(["pasta-bolonesa", "pollo-al-ajillo", "bizcocho"]);
const al = () => fixtureDrive().contents.get("reviews/al.yaml")!;
const op = (id: string, recipe: string, value: unknown = true, kind = "review.setFavorite") => ({
  id,
  kind,
  recipe,
  value,
});

describe("applyReviewOps", () => {
  it("adds a favorite, sets updated and keeps comments and the rest of the file", () => {
    const r = applyReviewOps(al(), [op("1", "bizcocho")], IDS, NOW);
    expect(r.changed).toBe(true);
    expect(r.results).toEqual([{ id: "1", status: "applied" }]);
    expect(r.reviews).toEqual({
      user: "al",
      updated: "2026-10-30T10:00:00-05:00",
      favorites: ["bizcocho"],
    });
    expect(parseReviews(r.text)?.favorites).toEqual(["bizcocho"]);
    expect(r.text).toContain("updated: 2026-10-30T10:00:00-05:00");
    expect(r.text).toContain("# Al's opinions about recipes.");
    expect(r.text).toBe(
      al()
        .replace("favorites: []", "favorites: [bizcocho]")
        .replace("2026-10-28T09:00:00-05:00", "2026-10-30T10:00:00-05:00"),
    );
    expect(r.text).toContain("ratings: {}");
    expect(r.text).toContain("#   tortilla-de-patatas: { stars: 4");
  });

  it("removes a favorite and keeps the order of the others", () => {
    const text = al().replace(
      "favorites: []",
      "favorites: [bizcocho, pasta-bolonesa, pollo-al-ajillo]",
    );
    const r = applyReviewOps(text, [op("1", "pasta-bolonesa", false)], IDS, NOW);
    expect(r.reviews.favorites).toEqual(["bizcocho", "pollo-al-ajillo"]);
  });

  it("edits a block list in place", () => {
    const text = al().replace("favorites: []", "favorites:\n  - bizcocho");
    const r = applyReviewOps(text, [op("1", "pasta-bolonesa")], IDS, NOW);
    expect(r.reviews.favorites).toEqual(["bizcocho", "pasta-bolonesa"]);
    expect(r.text).toMatch(/favorites:\n {2}- bizcocho\n {2}- pasta-bolonesa/);
  });

  it("applies several operations in order; the last toggle wins", () => {
    const r = applyReviewOps(
      al(),
      [op("1", "bizcocho"), op("2", "bizcocho", false), op("3", "bizcocho")],
      IDS,
      NOW,
    );
    expect(r.reviews.favorites).toEqual(["bizcocho"]);
  });

  it("reports unchanged and does not rewrite the file", () => {
    const r = applyReviewOps(al(), [op("1", "bizcocho", false)], IDS, NOW);
    expect(r.changed).toBe(false);
    expect(r.text).toBe(al());
    expect(r.results[0].status).toBe("unchanged");
    expect(r.reviews.updated).toBe("2026-10-28T09:00:00-05:00");
  });

  it("rejects unknown recipes, non-boolean values and unknown kinds without stopping the batch", () => {
    const r = applyReviewOps(
      al(),
      [
        op("1", "no-existe"),
        op("2", "bizcocho", "yes"),
        op("3", "bizcocho", true, "review.x"),
        op("4", "bizcocho"),
      ],
      IDS,
      NOW,
    );
    expect(r.results.map((x) => x.status)).toEqual(["rejected", "rejected", "rejected", "applied"]);
    expect(r.reviews.favorites).toEqual(["bizcocho"]);
  });

  it("creates the list when the file has none", () => {
    const text = al().replace("favorites: []\n", "");
    const r = applyReviewOps(text, [op("1", "bizcocho")], IDS, NOW);
    expect(r.reviews.favorites).toEqual(["bizcocho"]);
  });

  it("refuses a file that is not Al's reviews", () => {
    const ana = fixtureDrive().contents.get("reviews/ana.yaml")!;
    expect(() => applyReviewOps(ana, [op("1", "bizcocho")], IDS, NOW)).toThrow();
    expect(() => applyReviewOps("favorites: [", [op("1", "bizcocho")], IDS, NOW)).toThrow();
  });
});

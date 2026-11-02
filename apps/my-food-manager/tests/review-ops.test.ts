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
      ratings: {},
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

describe("applyReviewOps with ratings", () => {
  const rate = (id: string, recipe: string, value: number | null) =>
    op(id, recipe, value, "review.setRating");
  const withRating = () =>
    al().replace(
      "ratings: {}",
      'ratings:\n  bizcocho: { stars: 4, comment: "Mejor con cebolla", date: 2026-10-28 }',
    );

  it("creates a rating as a flow entry with the day of the change", () => {
    const r = applyReviewOps(al(), [rate("1", "bizcocho", 4)], IDS, NOW);
    expect(r.changed).toBe(true);
    expect(r.results).toEqual([{ id: "1", status: "applied" }]);
    expect(r.rated).toEqual(["bizcocho"]);
    expect(r.reviews.ratings).toEqual({ bizcocho: 4 });
    expect(r.text).toContain("bizcocho: {stars: 4, date: 2026-10-30}");
    expect(r.text).toContain("updated: 2026-10-30T10:00:00-05:00");
    expect(r.text).toContain("# Al's opinions about recipes.");
    expect(parseReviews(r.text)?.ratings.bizcocho.stars).toBe(4);
  });

  it("changes the stars and the date but keeps the comment", () => {
    const r = applyReviewOps(withRating(), [rate("1", "bizcocho", 2)], IDS, NOW);
    expect(r.results[0].status).toBe("applied");
    const entry = parseReviews(r.text)?.ratings.bizcocho;
    expect(entry).toMatchObject({ stars: 2, comment: "Mejor con cebolla" });
    expect(String(entry?.date)).toContain("2026-10-30");
  });

  it("is unchanged when the rating is already that value, and still reports it as rated", () => {
    const r = applyReviewOps(withRating(), [rate("1", "bizcocho", 4)], IDS, NOW);
    expect(r.changed).toBe(false);
    expect(r.results[0].status).toBe("unchanged");
    expect(r.rated).toEqual(["bizcocho"]);
    expect(r.text).toBe(withRating());
  });

  it("removes the whole entry, comment included, and does not mark the recipe as rated", () => {
    const r = applyReviewOps(withRating(), [rate("1", "bizcocho", null)], IDS, NOW);
    expect(r.results[0].status).toBe("applied");
    expect(r.rated).toEqual([]);
    expect(r.reviews.ratings).toEqual({});
    expect(parseReviews(r.text)?.ratings).toEqual({});
  });

  it("removing a rating that does not exist changes nothing", () => {
    const r = applyReviewOps(al(), [rate("1", "bizcocho", null)], IDS, NOW);
    expect(r.changed).toBe(false);
    expect(r.results[0].status).toBe("unchanged");
  });

  it("rejects values outside 1 to 5 and unknown recipes, keeping the rest of the batch", () => {
    const r = applyReviewOps(
      al(),
      [
        rate("1", "bizcocho", 6),
        rate("2", "bizcocho", 2.5),
        rate("3", "no-existe", 3),
        rate("4", "bizcocho", 5),
      ],
      IDS,
      NOW,
    );
    expect(r.results.map((x) => x.status)).toEqual(["rejected", "rejected", "rejected", "applied"]);
    expect(r.reviews.ratings).toEqual({ bizcocho: 5 });
  });

  it("treats an invalid stored value as no rating and replaces it on the next rating", () => {
    const text = al().replace("ratings: {}", "ratings:\n  bizcocho: { stars: 9 }");
    const r = applyReviewOps(text, [rate("1", "bizcocho", 3)], IDS, NOW);
    expect(r.results[0].status).toBe("applied");
    expect(parseReviews(r.text)?.ratings.bizcocho.stars).toBe(3);
  });

  it("applies favorites and ratings in one write, the last rating of a recipe winning", () => {
    const r = applyReviewOps(
      al(),
      [op("1", "bizcocho"), rate("2", "bizcocho", 5), rate("3", "bizcocho", 1)],
      IDS,
      NOW,
    );
    const parsed = parseReviews(r.text);
    expect(parsed?.favorites).toEqual(["bizcocho"]);
    expect(parsed?.ratings.bizcocho.stars).toBe(1);
  });

  it("keeps unknown fields of other entries", () => {
    const text = al().replace(
      "ratings: {}",
      'ratings:\n  pasta-bolonesa: { stars: 5, comment: "Rica", extra: x }',
    );
    const r = applyReviewOps(text, [rate("1", "bizcocho", 3)], IDS, NOW);
    expect(r.text).toContain("extra: x");
  });
});

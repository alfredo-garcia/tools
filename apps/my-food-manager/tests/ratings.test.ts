import { describe, expect, it } from "vitest";
import { activeFilterCount, filterOptions, filterRecipes } from "@/lib/domain/filters";
import { favoritesWithPending } from "@/lib/domain/favorites";
import type { PendingOp } from "@/lib/domain/pantry-view";
import {
  nextRating,
  ratingsWithPending,
  sortByRating,
  storedRatings,
  withRatings,
} from "@/lib/domain/ratings";
import type { Library, Recipe } from "@/lib/schema";

const recipe = (id: string, over: Partial<Recipe> = {}): Recipe =>
  ({
    id,
    title: id,
    category: "mains",
    tags: {},
    ingredients: [],
    curated: false,
    missing: [],
    steps: [],
    notes: "",
    variations: "",
    ...over,
  }) as Recipe;

const library = (ratings: Record<string, unknown>, ids = ["a", "b", "c", "d"]) =>
  ({
    recipes: ids.map((id) => recipe(id)),
    reviews: { al: { user: "al", favorites: [], ratings } },
  }) as unknown as Pick<Library, "recipes" | "reviews">;

const set = (recipeId: string, value: number | null, id = "x"): PendingOp => ({
  id,
  kind: "review.setRating",
  recipe: recipeId,
  value,
});

describe("storedRatings", () => {
  it("reads integers from 1 to 5 and ignores anything else", () => {
    const r = storedRatings(
      library({ a: { stars: 4 }, b: { stars: 9 }, c: { stars: 2.5 }, d: { comment: "x" } }),
    );
    expect([...r]).toEqual([["a", 4]]);
  });

  it("is empty without a reviews file", () => {
    expect(storedRatings({ reviews: {} }).size).toBe(0);
  });
});

describe("ratingsWithPending", () => {
  it("applies set and remove in order and drops ids that are not recipes", () => {
    const lib = library({ a: { stars: 4 }, ghost: { stars: 3 } });
    const r = ratingsWithPending(lib, [set("b", 5), set("a", null), set("c", 2), set("c", 3)]);
    expect([...r].sort()).toEqual([
      ["b", 5],
      ["c", 3],
    ]);
  });

  it("does not mistake rating operations for favorites", () => {
    const lib = library({});
    expect(favoritesWithPending(lib, [set("a", 4)]).size).toBe(0);
  });
});

describe("nextRating", () => {
  it("sets a new star and removes the one that is already the rating", () => {
    expect(nextRating(undefined, 4)).toBe(4);
    expect(nextRating(4, 2)).toBe(2);
    expect(nextRating(4, 4)).toBeNull();
  });
});

describe("withRatings", () => {
  it("attaches the rating and leaves unrated recipes as they are", () => {
    const lib = library({});
    const out = withRatings(lib.recipes, new Map([["a", 4]]), []);
    expect(out[0].userRating).toBe(4);
    expect(out[1]).toBe(lib.recipes[1]);
  });

  it("reads a recipe with a pending rating as tried, but not one that only lost its rating", () => {
    const recipes = [
      recipe("a", { status: "to-try" }),
      recipe("b", { status: "discarded" }),
      recipe("c", { status: "to-try" }),
      recipe("d", { status: "tried" }),
    ];
    const out = withRatings(
      recipes,
      new Map([
        ["a", 3],
        ["b", 5],
        ["d", 1],
      ]),
      [set("a", 3, "1"), set("b", 5, "2"), set("c", null, "3")],
    );
    expect(out.map((r) => r.status)).toEqual(["tried", "tried", "to-try", "tried"]);
  });
});

describe("sortByRating", () => {
  it("orders by stars descending, unrated last, ties by title in Spanish", () => {
    const rated = (id: string, title: string, userRating?: number) => ({
      ...recipe(id, { title }),
      userRating,
    });
    const out = sortByRating([
      rated("1", "Zanahorias"),
      rated("2", "Ñoquis", 3),
      rated("3", "Ajiaco", 5),
      rated("4", "Arepas", 3),
      rated("5", "Natillas"),
      rated("6", "Brownie", 5),
    ]);
    expect(out.map((r) => r.title)).toEqual([
      "Ajiaco",
      "Brownie",
      "Arepas",
      "Ñoquis",
      "Natillas",
      "Zanahorias",
    ]);
  });
});

const EMPTY_VOCAB = { categories: {}, tags: {}, units: {}, families: {} };

describe("rating filter", () => {
  const recipes = withRatings(
    ["a", "b", "c", "d", "e"].map((id) => recipe(id)),
    new Map([
      ["a", 5],
      ["b", 4],
      ["c", 2],
    ]),
    [],
  );
  const ids = (state: Record<string, string>) => filterRecipes(recipes, state).map((r) => r.id);

  it("N+ matches N stars or more, 5 exactly five, none the unrated", () => {
    expect(ids({ rating: "1" })).toEqual(["a", "b", "c"]);
    expect(ids({ rating: "3" })).toEqual(["a", "b"]);
    expect(ids({ rating: "4" })).toEqual(["a", "b"]);
    expect(ids({ rating: "5" })).toEqual(["a"]);
    expect(ids({ rating: "none" })).toEqual(["d", "e"]);
    expect(ids({})).toHaveLength(5);
  });

  it("combines with other filters and counts as an active filter", () => {
    expect(ids({ rating: "1", category: "desserts" })).toEqual([]);
    expect(activeFilterCount({ status: "tried", rating: "3" })).toBe(2);
  });

  it("lists the six options with counts that respect the other filters", () => {
    const opts = filterOptions({ recipes, vocab: EMPTY_VOCAB }, "rating", {});
    expect(opts.map((o) => [o.label, o.count])).toEqual([
      ["1+ ★", 3],
      ["2+ ★", 3],
      ["3+ ★", 2],
      ["4+ ★", 2],
      ["5 ★", 1],
      ["Sin rating", 2],
    ]);
    const tried = filterOptions({ recipes, vocab: EMPTY_VOCAB }, "rating", {
      category: "none-here",
    });
    expect(tried.every((o) => o.count === 0)).toBe(true);
  });
});

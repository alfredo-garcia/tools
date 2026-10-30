import { describe, expect, it } from "vitest";
import { canWriteFavorites, favoriteRecipes, favoritesWithPending } from "@/lib/domain/favorites";
import type { PendingOp } from "@/lib/domain/pantry-view";
import type { Library, Recipe } from "@/lib/schema";

const recipes = ["a", "b", "c"].map((id) => ({ id, title: id })) as Recipe[];
const library = {
  recipes,
  reviews: { al: { user: "al", favorites: ["a", "zzz"], ratings: {} } },
} as unknown as Library;
const fav = (id: string, recipe: string, value: boolean): PendingOp => ({
  id,
  kind: "review.setFavorite",
  recipe,
  value,
});

describe("favoritesWithPending", () => {
  it("reads Al's stored favorites and drops ids that are not recipes", () => {
    expect([...favoritesWithPending(library, [])]).toEqual(["a"]);
  });

  it("applies pending changes in order", () => {
    const set = favoritesWithPending(library, [
      fav("1", "b", true),
      fav("2", "a", false),
      fav("3", "c", true),
      fav("4", "c", false),
    ]);
    expect([...set]).toEqual(["b"]);
  });

  it("ignores pantry and plan operations", () => {
    const pending: PendingOp[] = [
      { id: "1", kind: "pantry.setHave", ingredient: "a", value: true },
    ];
    expect([...favoritesWithPending(library, pending)]).toEqual(["a"]);
  });

  it("is empty without a library or without Al's file", () => {
    expect(favoritesWithPending(undefined, []).size).toBe(0);
    expect(favoritesWithPending({ recipes, reviews: {} } as unknown as Library, []).size).toBe(0);
  });
});

describe("canWriteFavorites", () => {
  it("needs Al's reviews file", () => {
    expect(canWriteFavorites(library)).toBe(true);
    expect(canWriteFavorites({ reviews: {} } as unknown as Library)).toBe(false);
    expect(canWriteFavorites(undefined)).toBe(false);
  });
});

describe("favoriteRecipes", () => {
  it("keeps the library order and includes the kept ones", () => {
    expect(favoriteRecipes(recipes, new Set(["c"]), new Set(["a"])).map((r) => r.id)).toEqual([
      "a",
      "c",
    ]);
    expect(favoriteRecipes(recipes, new Set()).length).toBe(0);
  });
});

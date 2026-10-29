import { describe, expect, it } from "vitest";
import {
  ParseError,
  parseRecipe,
  parseIngredients,
  parsePantry,
  parseReviews,
} from "@/lib/domain/parse";
import { fixtureDrive } from "./helpers";

const { contents } = fixtureDrive();

describe("parseRecipe", () => {
  it("parses a real recipe with frontmatter, ingredients and steps", () => {
    const r = parseRecipe(contents.get("recipes/items/05-mains/pollo-al-ajillo.md")!);
    expect(r.id).toBe("pollo-al-ajillo");
    expect(r.title).toBe("Pollo al ajillo");
    expect(r.category).toBe("mains");
    expect(r.difficulty).toBe("easy");
    expect(r.time?.cook).toBe(25);
    expect(r.ingredients.length).toBeGreaterThan(5);
    expect(r.ingredients[0]).toMatchObject({ ing: "pollo", qty: 1.5, unit: "kg" });
    expect(r.steps).toHaveLength(7);
    expect(r.steps[0]).toMatch(/^Salpimentar/);
    expect(r.notes).toMatch(/quemar el ajo/);
  });

  it("accepts empty optional fields (servings:, photo:) and keeps them empty", () => {
    const r = parseRecipe(contents.get("recipes/items/05-mains/pollo-al-ajillo.md")!);
    expect(r.servings).toBeUndefined();
    expect(r.curated).toBe(false);
    expect(r.missing).toContain("servings");
  });

  it("preserves unknown frontmatter fields", () => {
    const r = parseRecipe("---\nid: x\ntitle: X\nweird: 1\n---\n\n## Steps\n\n1. a\n");
    expect((r as Record<string, unknown>).weird).toBe(1);
  });

  it("joins wrapped step lines", () => {
    const r = parseRecipe("---\nid: x\ntitle: X\n---\n\n## Steps\n\n1. uno\n   dos\n2. tres\n");
    expect(r.steps).toEqual(["uno dos", "tres"]);
  });

  it("rejects missing frontmatter, bad yaml and missing title", () => {
    expect(() => parseRecipe("# solo texto")).toThrow(ParseError);
    expect(() => parseRecipe("---\nid: [\n---\n")).toThrow(ParseError);
    expect(() => parseRecipe("---\nid: x\n---\n")).toThrow(ParseError);
  });
});

describe("catalog, pantry, reviews", () => {
  it("parses the ingredient catalog", () => {
    const c = parseIngredients(contents.get("ingredients/items.yaml")!);
    expect(c["sal"]).toMatchObject({ name: "sal", staple: true, family: "spices-and-herbs" });
    expect(c["patata"].synonyms).toContain("papa");
  });
  it("parses pantry and reviews", () => {
    expect(parsePantry(contents.get("pantry/pantry.yaml")!).have).toContain("arroz");
    const r = parseReviews(contents.get("reviews/ana.yaml")!);
    expect(r.ratings["bizcocho"].stars).toBe(5);
    expect(r.favorites).toEqual(["bizcocho"]);
  });
  it("tolerates empty reviews files", () => {
    expect(parseReviews("user: al\n").ratings).toEqual({});
  });
});

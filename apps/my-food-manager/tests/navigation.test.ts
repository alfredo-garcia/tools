import { describe, expect, it } from "vitest";
import {
  DESTINATIONS,
  badgeText,
  currentDestination,
  showBottomNav,
  sidebarExpanded,
} from "@/lib/domain/navigation";

describe("currentDestination", () => {
  it("maps each address to its destination", () => {
    expect(currentDestination("/")).toBe("recipes");
    expect(currentDestination("/plan")).toBe("plan");
    expect(currentDestination("/shopping-list")).toBe("shopping");
    expect(currentDestination("/ingredients")).toBe("ingredients");
    expect(currentDestination("/profile")).toBe("profile");
  });
  it("keeps the recipe detail inside Recetas", () => {
    expect(currentDestination("/recipes/ajiaco")).toBe("recipes");
  });
  it("accepts child addresses", () => {
    expect(currentDestination("/ingredients/list")).toBe("ingredients");
    expect(currentDestination("/plan/2026-11-02")).toBe("plan");
  });
  it("does not match look-alike prefixes or unknown addresses", () => {
    expect(currentDestination("/planning")).toBeNull();
    expect(currentDestination("/ingredientsx")).toBeNull();
    expect(currentDestination("/nope")).toBeNull();
  });
});

describe("sidebarExpanded", () => {
  it("defaults by layout without a stored choice", () => {
    expect(sidebarExpanded(null, "large")).toBe(true);
    expect(sidebarExpanded(null, "medium")).toBe(false);
  });
  it("lets a stored choice win on both sizes", () => {
    expect(sidebarExpanded(false, "large")).toBe(false);
    expect(sidebarExpanded(true, "medium")).toBe(true);
  });
});

describe("showBottomNav", () => {
  it("shows on small windows except over a recipe detail", () => {
    expect(showBottomNav("small", "/")).toBe(true);
    expect(showBottomNav("small", "/plan")).toBe(true);
    expect(showBottomNav("small", "/recipes/ajiaco")).toBe(false);
  });
  it("never shows on medium or large windows", () => {
    expect(showBottomNav("medium", "/")).toBe(false);
    expect(showBottomNav("large", "/plan")).toBe(false);
  });
});

describe("destinations", () => {
  it("lists the five sections in order", () => {
    expect(DESTINATIONS.map((d) => d.label)).toEqual([
      "Recetas",
      "Plan",
      "Compra",
      "Despensa",
      "Perfil",
    ]);
  });
});

describe("badgeText", () => {
  it("shows the count and caps it at 99+", () => {
    expect(badgeText(5)).toBe("5");
    expect(badgeText(99)).toBe("99");
    expect(badgeText(100)).toBe("99+");
  });
});

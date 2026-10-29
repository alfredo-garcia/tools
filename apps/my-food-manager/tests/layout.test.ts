import { describe, expect, it } from "vitest";
import { layoutForWidth } from "@/lib/domain/layout";

describe("layoutForWidth", () => {
  it("is small below 640 px", () => {
    expect(layoutForWidth(0)).toBe("small");
    expect(layoutForWidth(390)).toBe("small");
    expect(layoutForWidth(639)).toBe("small");
  });
  it("is medium from 640 px to 1279 px", () => {
    expect(layoutForWidth(640)).toBe("medium");
    expect(layoutForWidth(820)).toBe("medium");
    expect(layoutForWidth(1279)).toBe("medium");
  });
  it("is large from 1280 px", () => {
    expect(layoutForWidth(1280)).toBe("large");
    expect(layoutForWidth(1440)).toBe("large");
    expect(layoutForWidth(5120)).toBe("large");
  });
  it("handles fractional widths from browser zoom", () => {
    expect(layoutForWidth(639.5)).toBe("small");
    expect(layoutForWidth(1279.9)).toBe("medium");
  });
});

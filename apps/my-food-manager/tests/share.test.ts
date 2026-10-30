import { describe, expect, it } from "vitest";
import { buildShare, shareLink } from "@/lib/domain/share";

describe("shareLink", () => {
  it("is the absolute address of the detail", () => {
    expect(shareLink("https://food.example.com", "ajiaco")).toBe(
      "https://food.example.com/recipes/ajiaco",
    );
  });

  it("encodes the recipe id like the detail address does", () => {
    expect(shareLink("http://localhost:3000", "arroz con/pollo")).toBe(
      "http://localhost:3000/recipes/arroz%20con%2Fpollo",
    );
  });
});

describe("buildShare", () => {
  const link = "https://food.example.com/recipes/ajiaco";

  it("carries the link in the text, next to the photo, when there is a photo", () => {
    const photo = new File(["x"], "ajiaco.jpg", { type: "image/jpeg" });
    const data = buildShare("Ajiaco", link, photo);
    expect(data).toEqual({ title: "Ajiaco", text: `Ajiaco\n${link}`, files: [photo] });
    expect(data.url).toBeUndefined();
  });

  it("uses the url field when there is no photo", () => {
    expect(buildShare("Ajiaco", link)).toEqual({ title: "Ajiaco", text: "Ajiaco", url: link });
  });
});

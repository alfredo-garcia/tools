import { describe, expect, it } from "vitest";
import { markRecipeTried } from "@/lib/domain/recipe-status";
import { fixtureDrive } from "./helpers";

const NOW = new Date("2026-11-02T15:00:00Z");
const bizcocho = () => fixtureDrive().contents.get("recipes/items/09-desserts/bizcocho.md")!;
const withStatus = (value: string) =>
  bizcocho().replace("title: Bizcocho", `title: Bizcocho\nstatus: ${value}`);

describe("markRecipeTried", () => {
  it("moves to-try and discarded to tried, touching only status and updated", () => {
    for (const from of ["to-try", "discarded"]) {
      const r = markRecipeTried(withStatus(from), NOW);
      expect(r.changed).toBe(true);
      expect(r.text).toBe(
        withStatus(from)
          .replace(`status: ${from}`, "status: tried")
          .replace("updated: 2026-10-28T10:46:32-05:00", "updated: 2026-11-02T10:00:00-05:00"),
      );
    }
  });

  it("leaves tried, a missing status and unknown values untouched", () => {
    for (const text of [withStatus("tried"), bizcocho(), withStatus("weird")]) {
      const r = markRecipeTried(text, NOW);
      expect(r.changed).toBe(false);
      expect(r.text).toBe(text);
    }
  });

  it("understands quotes and trailing comments", () => {
    expect(markRecipeTried(withStatus('"to-try"'), NOW).changed).toBe(true);
    expect(markRecipeTried(withStatus("discarded # no me gusta"), NOW).text).toContain(
      "status: tried\n",
    );
  });

  it("adds updated when the file has none", () => {
    const text = withStatus("to-try").replace(/updated: .*\n/, "");
    const r = markRecipeTried(text, NOW);
    expect(r.text).toContain("updated: 2026-11-02T10:00:00-05:00\n---");
  });

  it("keeps CRLF line endings", () => {
    const r = markRecipeTried(withStatus("to-try").replace(/\n/g, "\r\n"), NOW);
    expect(r.text).toContain("status: tried\r\n");
    expect(r.text).not.toMatch(/[^\r]\n/);
  });

  it("never edits the body", () => {
    const text = withStatus("to-try") + "\nstatus: to-try\n";
    expect(markRecipeTried(text, NOW).text.endsWith("\nstatus: to-try\n")).toBe(true);
  });

  it("ignores files without frontmatter", () => {
    expect(markRecipeTried("status: to-try\n", NOW).changed).toBe(false);
  });
});

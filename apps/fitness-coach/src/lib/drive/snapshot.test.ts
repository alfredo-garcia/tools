/** [fitness-coach/001] Extra buildSnapshot cases from the T1 review (empty YAML keys, drafts). */
process.env.TZ = "America/Bogota";

import { describe, expect, it } from "vitest";
import { buildSnapshot } from "@/lib/drive/snapshot";
import { NOW, kbFiles, programFile, withFile } from "../../../tests/fixtures/kb";

const PLANCHA = "exercises/items/01-core/plancha-sintetica.md";
const EXPRES = "routines/items/04-express/expres-sintetica.md";
const content = (path: string) => kbFiles().find((f) => f.path === path)!.content;

describe("[fitness-coach/001] buildSnapshot, empty values allowed by schema.md", () => {
  it("FR-2: an exercise with `stresses:` left empty is kept", () => {
    const files = withFile(
      kbFiles(),
      PLANCHA,
      content(PLANCHA).replace("stresses: []", "stresses:"),
    );
    const s = buildSnapshot(files, NOW);
    expect(s.skipped).toEqual([]);
    expect(s.exercises.map((e) => e.id)).toContain("plancha-sintetica");
  });

  it("FR-2: a routine with `days:` left empty is kept", () => {
    const files = withFile(kbFiles(), EXPRES, content(EXPRES).replace("days: []", "days:"));
    const s = buildSnapshot(files, NOW);
    expect(s.skipped).toEqual([]);
    expect(s.routines.map((r) => r.id)).toContain("expres-sintetica");
  });

  it("FR-3: a program with an empty weekday is kept", () => {
    const files = withFile(
      kbFiles(),
      programFile.path,
      programFile.content.replace("tue: []", "tue:"),
    );
    const s = buildSnapshot(files, NOW);
    expect(s.skipped).toEqual([]);
    expect(s.program).not.toBeNull();
  });

  it("FR-4: a draft routine that breaks the schema is not counted as skipped", () => {
    const draft = {
      path: "routines/items/02-strength/borrador-roto.md",
      content: "---\nid: borrador-roto\nstatus: draft\n---\n\n## Guidelines\n",
    };
    const s = buildSnapshot([...kbFiles(), draft], NOW);
    expect(s.skipped).toEqual([]);
  });
});

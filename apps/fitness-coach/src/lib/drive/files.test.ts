/** [fitness-coach/001] FR-2: which Drive files `readKbFilesWith` returns, against a fake Drive. */
import { describe, expect, it } from "vitest";
import type { drive_v3 } from "@googleapis/drive";
import { readKbFilesWith } from "@/lib/drive/files";

const FOLDER = "application/vnd.google-apps.folder";
type Node = { id: string; name: string; parent: string; folder?: boolean };

/** root/{exercises/items/01-core, routines/items/02-strength, routines/_system, program, sessions/_archive, _system, _inbox} */
const TREE: Node[] = [
  { id: "ex", name: "exercises", parent: "root", folder: true },
  { id: "ex-items", name: "items", parent: "ex", folder: true },
  { id: "ex-core", name: "01-core", parent: "ex-items", folder: true },
  { id: "f1", name: "plancha.md", parent: "ex-core" },
  { id: "f2", name: "plancha.png", parent: "ex-core" },
  { id: "f3", name: "index.md", parent: "ex" },
  { id: "rt", name: "routines", parent: "root", folder: true },
  { id: "rt-items", name: "items", parent: "rt", folder: true },
  { id: "rt-str", name: "02-strength", parent: "rt-items", folder: true },
  { id: "f4", name: "fuerza.md", parent: "rt-str" },
  { id: "rt-sys", name: "_system", parent: "rt", folder: true },
  { id: "f5", name: "categories.yaml", parent: "rt-sys" },
  { id: "f6", name: "other.yaml", parent: "rt-sys" },
  { id: "pg", name: "program", parent: "root", folder: true },
  { id: "f7", name: "al.yaml", parent: "pg" },
  { id: "f8", name: "otro.yaml", parent: "pg" },
  { id: "ss", name: "sessions", parent: "root", folder: true },
  { id: "f9", name: "al.yaml", parent: "ss" },
  { id: "ss-arch", name: "_archive", parent: "ss", folder: true },
  { id: "f10", name: "al-2025.yaml", parent: "ss-arch" },
  { id: "sys", name: "_system", parent: "root", folder: true },
  { id: "f11", name: "regions.yaml", parent: "sys" },
  { id: "f12", name: "schema.md", parent: "sys" },
  { id: "sys-sub", name: "nested", parent: "sys", folder: true },
  { id: "f13", name: "x.yaml", parent: "sys-sub" },
  { id: "inbox", name: "_inbox", parent: "root", folder: true },
  { id: "f14", name: "nota.md", parent: "inbox" },
];

let instance = 0;

/** Each fake Drive has its own modifiedTime, so the module's download cache never leaks between tests. */
function fakeDrive() {
  const modifiedTime = `2026-11-01T00:00:${String(instance++).padStart(2, "0")}Z`;
  const calls = { list: 0, get: [] as string[] };
  const client = {
    files: {
      list: async ({ q, pageToken }: { q: string; pageToken?: string }) => {
        calls.list++;
        const parents = [...q.matchAll(/'([^']+)' in parents/g)].map((m) => m[1]);
        const all = TREE.filter((n) => parents.includes(n.parent));
        // two pages, to cover nextPageToken
        const half = Math.ceil(all.length / 2);
        const page = pageToken ? all.slice(half) : all.slice(0, half);
        return {
          data: {
            nextPageToken: pageToken || all.length <= 1 ? undefined : "p2",
            files: page.map((n) => ({
              id: n.id,
              name: n.name,
              parents: [n.parent],
              mimeType: n.folder ? FOLDER : "text/plain",
              modifiedTime,
            })),
          },
        };
      },
      get: async ({ fileId }: { fileId: string }) => {
        calls.get.push(fileId);
        return { data: `content of ${fileId}` };
      },
    },
  };
  return { client: client as unknown as drive_v3.Drive, calls };
}

describe("[fitness-coach/001] readKbFilesWith", () => {
  it("FR-2: returns only the snapshot files, with paths relative to the fitness folder", async () => {
    const { client } = fakeDrive();
    const files = await readKbFilesWith(client, "root");
    expect(files.map((f) => f.path).sort()).toEqual([
      "_system/regions.yaml",
      "exercises/items/01-core/plancha.md",
      "program/al.yaml",
      "routines/_system/categories.yaml",
      "routines/items/02-strength/fuerza.md",
      "sessions/al.yaml",
    ]);
    expect(files.find((f) => f.path === "program/al.yaml")!.content).toBe("content of f7");
  });

  it("FR-2: never downloads archives, the inbox or files outside the contract", async () => {
    const { client, calls } = fakeDrive();
    await readKbFilesWith(client, "root");
    expect(calls.get.sort()).toEqual(["f1", "f11", "f4", "f5", "f7", "f9"]);
    for (const id of ["f2", "f3", "f6", "f8", "f10", "f12", "f13", "f14"]) {
      expect(calls.get).not.toContain(id);
    }
  });

  it("tech_standards §11: an unchanged file is not downloaded twice", async () => {
    const { client, calls } = fakeDrive();
    await readKbFilesWith(client, "root");
    const first = calls.get.length;
    expect(first).toBe(6);
    await readKbFilesWith(client, "root");
    expect(calls.get.length).toBe(first);
  });
});

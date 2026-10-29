import fs from "node:fs";
import path from "node:path";
import type { DriveFileRef } from "@/lib/domain/snapshot";

const ROOT = path.resolve(__dirname, "fixtures/food");

function walk(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

/** Fixture folder as Drive file refs (id = path) and a reader over it. */
export function fixtureDrive(extra: Record<string, string> = {}) {
  const contents = new Map<string, string>();
  for (const f of walk(ROOT))
    contents.set(path.relative(ROOT, f).split(path.sep).join("/"), fs.readFileSync(f, "utf8"));
  for (const [p, c] of Object.entries(extra)) contents.set(p, c);
  const files: DriveFileRef[] = [...contents.keys()].map((p) => ({
    id: p,
    path: p,
    modifiedTime: "2026-10-28T10:00:00.000Z",
  }));
  return { files, contents, read: async (f: DriveFileRef) => contents.get(f.path)! };
}

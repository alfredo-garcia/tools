import fs from "node:fs/promises";
import path from "node:path";
import type { DriveFileRef } from "@/lib/domain/snapshot";
import type { FoodSource } from "./types";

/** Development-only source: a local mirror of the Drive folder (e.g. ~/knowledge-base/food). */
export function createLocalSource(root: string): FoodSource {
  const walk = async (dir: string, prefix: string): Promise<DriveFileRef[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (e) => {
        const full = path.join(dir, e.name);
        const rel = prefix + e.name;
        if (e.isDirectory()) return walk(full, rel + "/");
        const stat = await fs.stat(full);
        return [{ id: rel, path: rel, modifiedTime: stat.mtime.toISOString() }];
      }),
    );
    return nested.flat();
  };
  return {
    list: () => walk(root, ""),
    readText: (f) => fs.readFile(path.join(root, f.path), "utf8"),
    readBytes: async (f) => new Uint8Array(await fs.readFile(path.join(root, f.path))),
  };
}

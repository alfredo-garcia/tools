/**
 * Reads the files of the `fitness` folder that the snapshot needs (PRD FR-2). The only module
 * that talks to the Drive. Paths are relative to the `fitness` folder.
 *
 * The folder tree is listed one level at a time with a single query per level, so a full read is a
 * handful of list calls plus one download per file. Downloads are cached in memory per instance by
 * file id + modifiedTime (tech_standards §11); the cache is an optimisation, never needed for
 * correctness.
 */
import type { drive_v3 } from "@googleapis/drive";
import { readServerConfig } from "./config";
import { driveClient } from "./client";
import type { KbFile } from "./snapshot";

const FOLDER = "application/vnd.google-apps.folder";
const DOWNLOAD_CONCURRENCY = 8;

/** Folders worth walking into, and the files kept (same rules as FR-2). */
const WALK = [
  /^exercises$/,
  /^exercises\/items$/,
  /^exercises\/items\/[^/]+$/,
  /^routines$/,
  /^routines\/items$/,
  /^routines\/items\/[^/]+$/,
  /^routines\/_system$/,
  /^program$/,
  /^sessions$/,
  /^_system$/,
];
const KEEP = [
  /^exercises\/items\/[^/]+\/[^/]+\.md$/,
  /^routines\/items\/[^/]+\/[^/]+\.md$/,
  /^routines\/_system\/categories\.yaml$/,
  /^program\/al\.yaml$/,
  /^sessions\/al\.yaml$/,
  /^_system\/[^/]+\.yaml$/,
];

type Entry = { id: string; path: string; modifiedTime: string };
type Child = drive_v3.Schema$File & { parentPath: string };
const contentCache = new Map<string, { modifiedTime: string; content: string }>();

async function listChildren(
  client: drive_v3.Drive,
  parents: { id: string; path: string }[],
): Promise<Child[]> {
  const out: Child[] = [];
  const pathById = new Map(parents.map((p) => [p.id, p.path]));
  // Drive limits query length; 40 parents per query is far below it.
  for (let i = 0; i < parents.length; i += 40) {
    const chunk = parents.slice(i, i + 40);
    const q = `(${chunk.map((p) => `'${p.id}' in parents`).join(" or ")}) and trashed = false`;
    let pageToken: string | undefined;
    do {
      const res = await client.files.list({
        q,
        pageSize: 1000,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType, modifiedTime, parents)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      for (const f of res.data.files ?? []) {
        const parent = f.parents?.find((p) => pathById.has(p));
        if (parent !== undefined) out.push({ ...f, parentPath: pathById.get(parent)! });
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  }
  return out;
}

async function listKbEntries(client: drive_v3.Drive, folderId: string): Promise<Entry[]> {
  const entries: Entry[] = [];
  let level = [{ id: folderId, path: "" }];
  while (level.length > 0) {
    const children = await listChildren(client, level);
    const next: { id: string; path: string }[] = [];
    for (const f of children) {
      if (!f.id || !f.name) continue;
      const path = f.parentPath ? `${f.parentPath}/${f.name}` : f.name;
      if (f.mimeType === FOLDER) {
        if (WALK.some((r) => r.test(path))) next.push({ id: f.id, path });
      } else if (KEEP.some((r) => r.test(path))) {
        entries.push({ id: f.id, path, modifiedTime: f.modifiedTime ?? "" });
      }
    }
    level = next;
  }
  return entries;
}

async function download(client: drive_v3.Drive, entry: Entry): Promise<string> {
  const hit = contentCache.get(entry.id);
  if (hit && entry.modifiedTime && hit.modifiedTime === entry.modifiedTime) return hit.content;
  const res = await client.files.get(
    { fileId: entry.id, alt: "media", supportsAllDrives: true },
    { responseType: "text" },
  );
  const content = typeof res.data === "string" ? res.data : String(res.data);
  contentCache.set(entry.id, { modifiedTime: entry.modifiedTime, content });
  return content;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function readKbFiles(): Promise<KbFile[]> {
  const config = readServerConfig();
  if (!config) throw new Error("server_misconfigured");
  const client = driveClient(config.serviceAccountJson);
  const entries = await listKbEntries(client, config.folderId);
  const contents = await mapLimit(entries, DOWNLOAD_CONCURRENCY, (e) => download(client, e));
  return entries.map((e, i) => ({ path: e.path, content: contents[i] }));
}

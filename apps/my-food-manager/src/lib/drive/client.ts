import { auth, drive_v3, drive } from "@googleapis/drive";
import type { DriveFileRef } from "@/lib/domain/snapshot";
import { ApiError } from "@/lib/api/errors";
import { DriveConflictError, DriveReadError, type FoodSource } from "./types";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const CONCURRENCY = 8;

function statusOf(e: unknown): number | undefined {
  const err = e as { code?: number | string; status?: number; response?: { status?: number } };
  const s = err.response?.status ?? err.status ?? err.code;
  return typeof s === "number" ? s : undefined;
}

function toReadError(e: unknown): DriveReadError {
  const status = statusOf(e);
  if (status === 401 || status === 403 || status === 404) {
    // 403 can also be a rate limit; Drive reports that with a reason string.
    const message = (e as Error).message ?? "";
    if (status === 403 && /rate|quota/i.test(message))
      return new DriveReadError("Drive limitó las peticiones", "DRIVE_UNAVAILABLE");
    return new DriveReadError(
      "La carpeta no está compartida con la cuenta de servicio",
      "DRIVE_FORBIDDEN",
    );
  }
  return new DriveReadError("Google Drive no está disponible", "DRIVE_UNAVAILABLE");
}

async function pooled<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return out;
}

export function createDriveSource(credentialsJson: string, rootFolderId: string): FoodSource {
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch {
    throw new ApiError("CONFIG_MISSING", 500, "GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido");
  }
  const client: drive_v3.Drive = drive({
    version: "v3",
    auth: new auth.GoogleAuth({
      credentials,
      // Writes only update existing files of the shared `food` folder (the account sees nothing else).
      scopes: ["https://www.googleapis.com/auth/drive"],
    }),
  });

  const listChildren = async (parentId: string) => {
    const files: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined;
    do {
      const res = await client.files.list({
        q: `'${parentId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
        pageSize: 1000,
        pageToken,
      });
      files.push(...(res.data.files ?? []));
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return files;
  };

  const textCache = new Map<string, { modifiedTime: string; text: string }>();

  return {
    async list() {
      try {
        const out: DriveFileRef[] = [];
        let level: { id: string; prefix: string }[] = [{ id: rootFolderId, prefix: "" }];
        while (level.length) {
          const children = await pooled(level, async (f) => ({
            f,
            kids: await listChildren(f.id),
          }));
          const nextLevel: typeof level = [];
          for (const { f, kids } of children) {
            for (const k of kids) {
              if (!k.id || !k.name) continue;
              const path = f.prefix + k.name;
              if (k.mimeType === FOLDER_MIME) nextLevel.push({ id: k.id, prefix: path + "/" });
              else out.push({ id: k.id, path, modifiedTime: k.modifiedTime ?? "" });
            }
          }
          level = nextLevel;
        }
        return out;
      } catch (e) {
        throw toReadError(e);
      }
    },

    async readText(file) {
      const hit = textCache.get(file.id);
      if (hit && hit.modifiedTime === file.modifiedTime) return hit.text;
      try {
        const res = await client.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "text" },
        );
        const text = typeof res.data === "string" ? res.data : String(res.data);
        textCache.set(file.id, { modifiedTime: file.modifiedTime, text });
        return text;
      } catch (e) {
        throw toReadError(e);
      }
    },

    async writeText(file, text) {
      try {
        const current = await client.files.get({ fileId: file.id, fields: "modifiedTime" });
        if (current.data.modifiedTime !== file.modifiedTime) throw new DriveConflictError();
        await client.files.update({
          fileId: file.id,
          media: { mimeType: "text/plain", body: text },
          fields: "id",
        });
        textCache.delete(file.id);
      } catch (e) {
        if (e instanceof DriveConflictError) throw e;
        throw toReadError(e);
      }
    },

    async readBytes(file) {
      try {
        const res = await client.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "arraybuffer" },
        );
        return new Uint8Array(res.data as ArrayBuffer);
      } catch (e) {
        throw toReadError(e);
      }
    },
  };
}

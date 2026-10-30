import { ApiError } from "@/lib/api/errors";
import { buildSnapshot, computeEtag, photoFiles, type DriveFileRef } from "@/lib/domain/snapshot";
import type { SnapshotResponse } from "@/lib/schema";
import { createDriveSource } from "./client";
import { createLocalSource } from "./local";
import { DriveReadError, type FoodSource } from "./types";

// Photos reuse a listing for a while; sync checks always list fresh so a refresh never misses a new recipe.
const PHOTO_LISTING_TTL_MS = 10_000;
// currentSnapshot reuses the listing the validator check just made.
const SAME_REQUEST_TTL_MS = 2_000;

let source: FoodSource | undefined;
let listing: { at: number; files: DriveFileRef[] } | undefined;
let lastSnapshot: SnapshotResponse | undefined;

export function getSource(): FoodSource {
  if (source) return source;
  const local = process.env.LOCAL_FOOD_DIR;
  if (local && !process.env.VERCEL) {
    source = createLocalSource(local);
    return source;
  }
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!json || !folder)
    throw new ApiError(
      "CONFIG_MISSING",
      500,
      "Faltan GOOGLE_SERVICE_ACCOUNT_JSON o GOOGLE_DRIVE_FOLDER_ID",
    );
  source = createDriveSource(json, folder);
  return source;
}

/** Maps Drive failures to API errors (tech_standards §6). */
export function asApiError(e: unknown): unknown {
  if (e instanceof DriveReadError)
    return new ApiError(e.code, e.code === "DRIVE_FORBIDDEN" ? 502 : 503, e.message);
  return e;
}

/** Forget the cached listing, e.g. after a write changed a file. */
export function invalidateListing() {
  listing = undefined;
}

async function listFiles(maxAgeMs: number): Promise<DriveFileRef[]> {
  if (listing && Date.now() - listing.at < maxAgeMs) return listing.files;
  const files = await getSource().list();
  listing = { at: Date.now(), files };
  return files;
}

/** Cheap validator: one listing, no file contents. */
/** Fresh listing, bypassing the cache (used before and after a write). */
export async function freshListing(): Promise<DriveFileRef[]> {
  try {
    return await listFiles(0);
  } catch (e) {
    throw asApiError(e);
  }
}

export async function currentEtag(): Promise<string> {
  try {
    return computeEtag(await listFiles(0));
  } catch (e) {
    throw asApiError(e);
  }
}

export async function currentSnapshot(): Promise<SnapshotResponse> {
  try {
    const files = await listFiles(SAME_REQUEST_TTL_MS);
    const etag = computeEtag(files);
    if (lastSnapshot?.etag === etag) return lastSnapshot;
    const src = getSource();
    lastSnapshot = await buildSnapshot(files, (f) => src.readText(f));
    return lastSnapshot;
  } catch (e) {
    throw asApiError(e);
  }
}

export async function findPhoto(
  recipeId: string,
): Promise<{ file: DriveFileRef; bytes: Uint8Array } | null> {
  try {
    const file = photoFiles(await listFiles(PHOTO_LISTING_TTL_MS)).get(recipeId);
    if (!file) return null;
    return { file, bytes: await getSource().readBytes(file) };
  } catch (e) {
    throw asApiError(e);
  }
}

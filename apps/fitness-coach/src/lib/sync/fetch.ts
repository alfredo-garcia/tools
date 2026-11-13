/**
 * The one network call of feature 001: GET /api/snapshot (PRD §8). The key travels only in the
 * `x-app-key` header, never in the URL.
 */
import { SNAPSHOT_FORMAT, type Snapshot } from "@/lib/schema/snapshot";

export const SYNC_TIMEOUT_MS = 15_000;

export type FetchResult =
  | { kind: "ok"; snapshot: Snapshot; etag: string | null }
  | { kind: "not_modified" }
  | { kind: "invalid_key" }
  | { kind: "client_outdated" }
  | { kind: "offline" }
  | { kind: "error" };

/** Minimal shape check: anything else is treated as `error` and the copy is not touched. */
export function isSnapshot(x: unknown): x is Snapshot {
  if (typeof x !== "object" || x === null) return false;
  const s = x as Record<string, unknown>;
  return (
    s.format === SNAPSHOT_FORMAT &&
    typeof s.generated_at === "string" &&
    Array.isArray(s.exercises) &&
    Array.isArray(s.routines) &&
    Array.isArray(s.sessions) &&
    Array.isArray(s.skipped) &&
    typeof s.vocabularies === "object" &&
    s.vocabularies !== null &&
    (s.program === null || typeof s.program === "object")
  );
}

export async function fetchSnapshot(opts: {
  key: string;
  etag?: string | null;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<FetchResult> {
  const { key, etag, timeoutMs = SYNC_TIMEOUT_MS, fetchImpl = fetch } = opts;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    let res: Response;
    const headers: Record<string, string> = {
      "x-app-key": key,
      "x-client-format": String(SNAPSHOT_FORMAT),
    };
    if (etag) headers["if-none-match"] = etag;
    try {
      res = await fetchImpl("/api/snapshot", {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      // Timeout (FR-13) is an error; any other failure to reach the server means no connection.
      return timedOut ? { kind: "error" } : { kind: "offline" };
    }
    if (res.status === 304) return { kind: "not_modified" };
    if (res.status === 401) return { kind: "invalid_key" };
    if (res.status === 409) return { kind: "client_outdated" };
    if (!res.ok) return { kind: "error" };
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return { kind: "error" }; // broken JSON or a cut body (PRD §10)
    }
    if (!isSnapshot(body)) return { kind: "error" };
    return { kind: "ok", snapshot: body, etag: res.headers.get("etag") };
  } finally {
    clearTimeout(timer);
  }
}

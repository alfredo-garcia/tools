/**
 * GET /api/snapshot (PRD §8, tech_standards §3–§5, §10): the whole knowledge-base snapshot,
 * read-only, behind the shared access key. Logs carry only method, route, status, duration,
 * counts, the names of missing or invalid environment variables and a filtered error kind (class,
 * status, codes); never values, file contents, error messages from the Drive, or the key.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { readServerConfig, serverConfigProblems } from "@/lib/drive/config";
import { DRIVE_TIMEOUT, driveErrorKind } from "@/lib/drive/errors";
import { readKbFiles } from "@/lib/drive/files";
import { buildSnapshot } from "@/lib/drive/snapshot";
import { SNAPSHOT_FORMAT, type Snapshot } from "@/lib/schema/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

/** The client gives up at 15 s (FR-13); the server stops waiting for the Drive a bit earlier. */
const DRIVE_TIMEOUT_MS = 14_000;
const NO_STORE = "private, no-store";

type ErrorCode = "invalid_key" | "client_outdated" | "drive_unavailable" | "server_misconfigured";
const MESSAGES: Record<ErrorCode, string> = {
  invalid_key: "La clave de acceso no es válida.",
  client_outdated: "La app está desactualizada; recarga.",
  drive_unavailable: "No se pudo leer el Drive.",
  server_misconfigured: "El servidor no está configurado.",
};
const STATUS: Record<ErrorCode, number> = {
  invalid_key: 401,
  client_outdated: 409,
  drive_unavailable: 502,
  server_misconfigured: 500,
};

function log(
  status: number,
  startedAt: number,
  extra: Record<string, string | number | string[]> = {},
) {
  console.log(
    JSON.stringify({
      method: "GET",
      route: "/api/snapshot",
      status,
      ms: Date.now() - startedAt,
      ...extra,
    }),
  );
}

function errorResponse(
  code: ErrorCode,
  startedAt: number,
  extra: Record<string, string[]> = {},
): Response {
  const status = STATUS[code];
  log(status, startedAt, { code, ...extra });
  return Response.json(
    { error: { code, message: MESSAGES[code] } },
    { status, headers: { "cache-control": NO_STORE } },
  );
}

function sha256(s: string): Buffer {
  return createHash("sha256").update(s).digest();
}

/** Constant-time comparison of the received key with APP_ACCESS_KEY. */
function keyMatches(received: string | null, expected: string): boolean {
  if (!received) return false;
  return timingSafeEqual(sha256(received), sha256(expected));
}

/** ETag from the content only, so an unchanged Drive gives the same ETag (FR-7). */
function etagOf(snapshot: Snapshot): string {
  const { generated_at: _generatedAt, ...content } = snapshot;
  void _generatedAt;
  return `"${sha256(JSON.stringify(content)).toString("base64url")}"`;
}

function etagMatches(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch
    .split(",")
    .map((t) => t.trim().replace(/^W\//, ""))
    .some((t) => t === etag || t === "*");
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(DRIVE_TIMEOUT)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

export async function GET(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const config = readServerConfig();
  // Variable names only (never values), so the Vercel log says what to fix.
  if (!config) return errorResponse("server_misconfigured", startedAt, serverConfigProblems());

  if (!keyMatches(request.headers.get("x-app-key"), config.accessKey)) {
    return errorResponse("invalid_key", startedAt);
  }
  if (request.headers.get("x-client-format") !== String(SNAPSHOT_FORMAT)) {
    return errorResponse("client_outdated", startedAt);
  }

  let files: Awaited<ReturnType<typeof readKbFiles>>;
  try {
    files = await withTimeout(readKbFiles(), DRIVE_TIMEOUT_MS);
  } catch (error) {
    // The message may quote file contents or credentials: only its kind is logged, never returned.
    return errorResponse("drive_unavailable", startedAt, { cause: driveErrorKind(error) });
  }

  let snapshot: Snapshot;
  try {
    snapshot = buildSnapshot(files, new Date());
  } catch {
    // Defensive: buildSnapshot handles bad files one by one; a throw here is a bug, never logged
    // with its message because it could quote file contents.
    log(500, startedAt, { code: "build_failed" });
    return Response.json(
      { error: { code: "server_error", message: "Error interno." } },
      { status: 500, headers: { "cache-control": NO_STORE } },
    );
  }
  const etag = etagOf(snapshot);
  const counts = { files: files.length, skipped: snapshot.skipped.length };

  if (etagMatches(request.headers.get("if-none-match"), etag)) {
    log(304, startedAt, counts);
    return new Response(null, { status: 304, headers: { etag, "cache-control": NO_STORE } });
  }
  log(200, startedAt, counts);
  return Response.json(snapshot, { headers: { etag, "cache-control": NO_STORE } });
}

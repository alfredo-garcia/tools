/**
 * [fitness-coach/001] GET /api/snapshot contract (PRD §8; FR-7, FR-10, FR-12, FR-13; tech_standards §3, §5, §10).
 *
 * Seams required from the implementation (test contract, see tests/README.md):
 *   src/app/api/snapshot/route.ts   export async function GET(request: Request): Promise<Response>
 *   src/lib/drive/files.ts          export async function readKbFiles(): Promise<{ path: string; content: string }[]>
 * The Drive is never called: readKbFiles is mocked.
 */
process.env.TZ = "America/Bogota";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HEALTH_MARKERS, kbFiles, withFile } from "../fixtures/kb";

const readKbFiles = vi.fn();
vi.mock("@/lib/drive/files", () => ({ readKbFiles: () => readKbFiles() }));

const KEY = "clave-de-test";

async function loadGET() {
  vi.resetModules();
  const mod = await import("@/app/api/snapshot/route");
  return mod.GET as (req: Request) => Promise<Response>;
}

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/snapshot", {
    method: "GET",
    headers: { "x-client-format": "1", ...headers },
  });
}

let logged: string[] = [];

beforeEach(() => {
  process.env.APP_ACCESS_KEY = KEY;
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{"type":"test-only"}';
  process.env.GOOGLE_DRIVE_FOLDER_ID = "folder-de-test";
  readKbFiles.mockReset();
  readKbFiles.mockResolvedValue(kbFiles());
  logged = [];
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...args: unknown[]) => {
      logged.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("[fitness-coach/001] GET /api/snapshot", () => {
  it("[fitness-coach/001] AC-10: 200 with the snapshot, an ETag and Cache-Control: private, no-store", async () => {
    const GET = await loadGET();
    const res = await GET(req({ "x-app-key": KEY }));
    expect(res.status).toBe(200);
    expect(res.headers.get("etag")).toBeTruthy();
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.format).toBe(1);
    expect(body.exercises).toHaveLength(3);
  });

  it("[fitness-coach/001] AC-11: 401 invalid_key when the key is missing", async () => {
    const GET = await loadGET();
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("invalid_key");
    expect(readKbFiles).not.toHaveBeenCalled();
  });

  it("[fitness-coach/001] AC-11 / AC-12: 401 invalid_key when the key does not match", async () => {
    const GET = await loadGET();
    const res = await GET(req({ "x-app-key": "otra-clave" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_key");
    expect(typeof body.error.message).toBe("string");
    expect(readKbFiles).not.toHaveBeenCalled();
  });

  it("[fitness-coach/001] AC-8: 304 without body when If-None-Match matches", async () => {
    const GET = await loadGET();
    const first = await GET(req({ "x-app-key": KEY }));
    const etag = first.headers.get("etag")!;
    const second = await GET(req({ "x-app-key": KEY, "if-none-match": etag }));
    expect(second.status).toBe(304);
    expect(await second.text()).toBe("");
  });

  it("[fitness-coach/001] FR-7: the ETag depends on the content, not on generated_at", async () => {
    const GET = await loadGET();
    const a = (await GET(req({ "x-app-key": KEY }))).headers.get("etag");
    await new Promise((r) => setTimeout(r, 15));
    const b = (await GET(req({ "x-app-key": KEY }))).headers.get("etag");
    expect(a).toBe(b);

    readKbFiles.mockResolvedValue(
      withFile(kbFiles(), "routines/items/03-mobility/movilidad-sintetica.md", null),
    );
    const c = await GET(req({ "x-app-key": KEY, "if-none-match": a! }));
    expect(c.status).toBe(200);
    expect(c.headers.get("etag")).not.toBe(a);
  });

  it("[fitness-coach/001] tech_standards §3: 409 client_outdated when x-client-format differs", async () => {
    const GET = await loadGET();
    const res = await GET(req({ "x-app-key": KEY, "x-client-format": "0" }));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("client_outdated");
  });

  it("[fitness-coach/001] AC-14: 502 drive_unavailable when the Drive fails", async () => {
    readKbFiles.mockRejectedValue(new Error("drive down"));
    const GET = await loadGET();
    const res = await GET(req({ "x-app-key": KEY }));
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("drive_unavailable");
  });

  it("[fitness-coach/001] PRD §8: 500 server_misconfigured when an env var is missing", async () => {
    delete process.env.GOOGLE_DRIVE_FOLDER_ID;
    const GET = await loadGET();
    const res = await GET(req({ "x-app-key": KEY }));
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("server_misconfigured");
  });

  it("[fitness-coach/001] PRD §8 / tech_standards §5, §10: logs never carry health data or the key", async () => {
    const GET = await loadGET();
    await GET(req({ "x-app-key": KEY }));
    readKbFiles.mockRejectedValue(new Error(`drive down ${HEALTH_MARKERS.constraintText}`));
    await GET(req({ "x-app-key": KEY }));
    await GET(req({ "x-app-key": "otra-clave" }));
    const all = logged.join("\n");
    expect(all).not.toContain(HEALTH_MARKERS.constraintText);
    expect(all).not.toContain(HEALTH_MARKERS.journalText);
    expect(all).not.toContain("Fuerza sintética");
    expect(all).not.toContain("Texto de ejecución inventado");
    expect(all).not.toContain(KEY);
    expect(all).not.toContain("otra-clave");
  });

  it("[fitness-coach/001] PRD §8: error bodies never carry health data", async () => {
    readKbFiles.mockRejectedValue(new Error(`drive down ${HEALTH_MARKERS.constraintText}`));
    const GET = await loadGET();
    const res = await GET(req({ "x-app-key": KEY }));
    expect(await res.text()).not.toContain(HEALTH_MARKERS.constraintText);
  });
});

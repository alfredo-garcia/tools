import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/drive/files", () => ({
  readKbFiles: vi.fn(async () => {
    const e = Object.assign(new Error("File not found: lumbar notes"), {
      response: { status: 404, data: { error: { errors: [{ reason: "notFound" }] } } },
    });
    throw e;
  }),
}));

const { GET } = await import("./route");

const KEY = "synthetic-key";
const ENV = {
  APP_ACCESS_KEY: KEY,
  GOOGLE_SERVICE_ACCOUNT_JSON: '{"synthetic":true}',
  GOOGLE_DRIVE_FOLDER_ID: "synthetic-folder",
};

function request(): Request {
  return new Request("http://localhost/api/snapshot", {
    headers: { "x-app-key": KEY, "x-client-format": "1" },
  });
}

let logs: string[];
beforeEach(() => {
  logs = [];
  vi.spyOn(console, "log").mockImplementation((line: string) => void logs.push(line));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /api/snapshot diagnostics", () => {
  it("500: logs the names of missing or invalid variables, never in the body", async () => {
    vi.stubEnv("APP_ACCESS_KEY", "");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "not-json");
    vi.stubEnv("GOOGLE_DRIVE_FOLDER_ID", ENV.GOOGLE_DRIVE_FOLDER_ID);
    const res = await GET(request());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: "server_misconfigured", message: "El servidor no está configurado." },
    });
    const line = JSON.parse(logs.at(-1)!);
    expect(line).toMatchObject({
      status: 500,
      missing: ["APP_ACCESS_KEY"],
      invalid: ["GOOGLE_SERVICE_ACCOUNT_JSON"],
    });
    expect(logs.join("\n")).not.toContain("not-json");
  });

  it("502: logs the error kind, never its message, and the body is unchanged", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    const res = await GET(request());
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({
      error: { code: "drive_unavailable", message: "No se pudo leer el Drive." },
    });
    const line = JSON.parse(logs.at(-1)!);
    expect(line).toMatchObject({ status: 502, cause: ["Error", "404", "notFound"] });
    expect(logs.join("\n")).not.toContain("lumbar");
  });
});

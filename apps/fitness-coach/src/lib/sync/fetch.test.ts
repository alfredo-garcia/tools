/** [fitness-coach/001] GET /api/snapshot from the client (PRD §8, FR-7, FR-13). */
import { describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../../tests/fixtures/snapshot";
import { fetchSnapshot } from "./fetch";

const respond = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  vi.fn(
    async () => new Response(body === undefined ? null : JSON.stringify(body), { status, headers }),
  );

describe("[fitness-coach/001] fetchSnapshot", () => {
  it("PRD §8: sends the key and the format in headers, never in the URL, and If-None-Match", async () => {
    const f = respond(200, makeSnapshot(), { etag: '"e"' });
    const r = await fetchSnapshot({ key: "k", etag: '"old"', fetchImpl: f });
    expect(r).toMatchObject({ kind: "ok", etag: '"e"' });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/snapshot");
    expect(init.headers).toEqual({
      "x-app-key": "k",
      "x-client-format": "1",
      "if-none-match": '"old"',
    });
  });

  it.each([
    [304, "not_modified"],
    [401, "invalid_key"],
    [409, "client_outdated"],
    [502, "error"],
    [500, "error"],
  ])("maps %i to %s", async (status, kind) => {
    expect((await fetchSnapshot({ key: "k", fetchImpl: respond(status) })).kind).toBe(kind);
  });

  it("PRD §10: an unexpected body is an error", async () => {
    expect((await fetchSnapshot({ key: "k", fetchImpl: respond(200, { format: 2 }) })).kind).toBe(
      "error",
    );
  });

  it("no connection is offline", async () => {
    const f = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect((await fetchSnapshot({ key: "k", fetchImpl: f })).kind).toBe("offline");
  });

  it("FR-13: no answer within the timeout is an error", async () => {
    const hang = vi.fn(
      (_: unknown, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          ),
        ),
    );
    expect(
      (await fetchSnapshot({ key: "k", timeoutMs: 20, fetchImpl: hang as unknown as typeof fetch }))
        .kind,
    ).toBe("error");
  });
});

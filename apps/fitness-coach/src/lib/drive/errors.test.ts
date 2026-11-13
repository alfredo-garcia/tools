import { describe, expect, it } from "vitest";
import { driveErrorKind } from "./errors";

function googleError(status: number, reason: string, message: string): Error {
  const e = new Error(message) as Error & { response: unknown; status: number };
  e.name = "GaxiosError";
  e.status = status;
  e.response = { status, data: { error: { errors: [{ reason }] } } };
  return e;
}

describe("driveErrorKind", () => {
  it("keeps class, HTTP status and Google's reason code", () => {
    expect(driveErrorKind(googleError(404, "notFound", "File not found: abc"))).toEqual([
      "GaxiosError",
      "404",
      "notFound",
    ]);
  });

  it("keeps an uppercase network code", () => {
    const e = Object.assign(new Error("connect ECONNRESET 1.2.3.4"), { code: "ECONNRESET" });
    expect(driveErrorKind(e)).toEqual(["Error", "ECONNRESET"]);
  });

  it("marks the route's own timeout", () => {
    expect(driveErrorKind(new Error("timeout"))).toEqual(["Error", "timeout"]);
  });

  it("never carries the message or free-text fields", () => {
    const secret = "routine notes: lumbar pain";
    const e = googleError(400, "bad reason with spaces", secret) as Error & { code: string };
    e.code = secret;
    const text = JSON.stringify(driveErrorKind(e));
    expect(text).not.toContain("lumbar");
    expect(text).not.toContain("spaces");
  });

  it("describes non-Error throws by type only", () => {
    expect(driveErrorKind("private_key leaked")).toEqual(["string"]);
  });
});

describe("driveErrorKind filters every field", () => {
  it("replaces a free-text error name", () => {
    const e = new Error("x");
    e.name = "lumbar pain notes";
    expect(driveErrorKind(e)).toEqual(["Error"]);
  });

  it("drops statuses outside 100..599 or not integers", () => {
    for (const status of [NaN, 42, 1e9, 404.5]) {
      const e = Object.assign(new Error("x"), { status });
      expect(driveErrorKind(e)).toEqual(["Error"]);
    }
  });

  it("keeps codes with digits and Google's string error such as invalid_grant", () => {
    const e = Object.assign(new Error("x"), {
      code: "EAI_AGAIN2",
      response: { status: 400, data: { error: "invalid_grant" } },
    });
    expect(driveErrorKind(e)).toEqual(["Error", "400", "EAI_AGAIN2", "invalid_grant"]);
  });

  it("drops over-long codes and reasons", () => {
    const e = Object.assign(new Error("x"), {
      code: "A".repeat(60),
      response: { data: { error: "a".repeat(60) } },
    });
    expect(driveErrorKind(e)).toEqual(["Error"]);
  });
});

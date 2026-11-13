import { describe, expect, it } from "vitest";
import { readServerConfig, serverConfigProblems } from "./config";

const OK = {
  APP_ACCESS_KEY: "synthetic-key",
  GOOGLE_SERVICE_ACCOUNT_JSON: '{"synthetic":true}',
  GOOGLE_DRIVE_FOLDER_ID: "synthetic-folder",
};

describe("serverConfigProblems", () => {
  it("reports nothing when the config is complete", () => {
    expect(serverConfigProblems(OK)).toEqual({ missing: [], invalid: [] });
    expect(readServerConfig(OK)).not.toBeNull();
  });

  it("names every missing or empty variable", () => {
    const env = { ...OK, APP_ACCESS_KEY: "", GOOGLE_DRIVE_FOLDER_ID: undefined };
    expect(serverConfigProblems(env)).toEqual({
      missing: ["APP_ACCESS_KEY", "GOOGLE_DRIVE_FOLDER_ID"],
      invalid: [],
    });
    expect(readServerConfig(env)).toBeNull();
  });

  it.each([
    ["not JSON", "not-json"],
    ["a quoted JSON string", JSON.stringify('{"synthetic":true}')],
    ["an array", "[]"],
    ["null", "null"],
  ])("marks the service-account JSON invalid when it is %s", (_label, value) => {
    const env = { ...OK, GOOGLE_SERVICE_ACCOUNT_JSON: value };
    expect(serverConfigProblems(env)).toEqual({
      missing: [],
      invalid: ["GOOGLE_SERVICE_ACCOUNT_JSON"],
    });
    expect(readServerConfig(env)).toBeNull();
  });

  it("never returns values, only variable names", () => {
    const env = { APP_ACCESS_KEY: "secret-value", GOOGLE_SERVICE_ACCOUNT_JSON: "bad-secret" };
    const text = JSON.stringify(serverConfigProblems(env));
    expect(text).not.toContain("secret-value");
    expect(text).not.toContain("bad-secret");
  });
});

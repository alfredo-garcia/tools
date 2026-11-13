/**
 * Server-only configuration (tech_standards §10). Values come from environment variables
 * (Vercel, or a gitignored .env.local); they never reach the client.
 */
export type ServerConfig = {
  accessKey: string;
  serviceAccountJson: string;
  folderId: string;
};

/** Names only, never values, so they can go to the logs (tech_standards §5). */
export type ServerConfigProblems = { missing: string[]; invalid: string[] };

type Env = Record<string, string | undefined>;

const REQUIRED = [
  "APP_ACCESS_KEY",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_DRIVE_FOLDER_ID",
] as const;

/** Which variables are missing or empty, and which are present but unusable. */
export function serverConfigProblems(env: Env = process.env): ServerConfigProblems {
  const missing = REQUIRED.filter((name) => !env[name]);
  const json = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const invalid = json && !isServiceAccountJson(json) ? ["GOOGLE_SERVICE_ACCOUNT_JSON"] : [];
  return { missing, invalid };
}

/** Returns null when any variable is missing, empty or invalid (→ 500 server_misconfigured). */
export function readServerConfig(env: Env = process.env): ServerConfig | null {
  const { missing, invalid } = serverConfigProblems(env);
  if (missing.length > 0 || invalid.length > 0) return null;
  return {
    accessKey: env.APP_ACCESS_KEY!,
    serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON!,
    folderId: env.GOOGLE_DRIVE_FOLDER_ID!,
  };
}

function isServiceAccountJson(json: string): boolean {
  try {
    const v: unknown = JSON.parse(json);
    return typeof v === "object" && v !== null && !Array.isArray(v);
  } catch {
    return false;
  }
}

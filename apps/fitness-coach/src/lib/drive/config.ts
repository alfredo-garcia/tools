/**
 * Server-only configuration (tech_standards §10). Values come from environment variables
 * (Vercel, or a gitignored .env.local); they never reach the client.
 */
export type ServerConfig = {
  accessKey: string;
  serviceAccountJson: string;
  folderId: string;
};

/** Returns null when any variable is missing or empty (→ 500 server_misconfigured). */
export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig | null {
  const accessKey = env.APP_ACCESS_KEY;
  const serviceAccountJson = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const folderId = env.GOOGLE_DRIVE_FOLDER_ID;
  if (!accessKey || !serviceAccountJson || !folderId) return null;
  return { accessKey, serviceAccountJson, folderId };
}

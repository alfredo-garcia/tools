/**
 * Google Drive v3 client authenticated as the service account (ADR 002). Read-only scope:
 * feature fitness-coach/001 never writes to the Drive.
 */
import { auth, drive, type drive_v3 } from "@googleapis/drive";

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

let cached: { json: string; client: drive_v3.Drive } | null = null;

export function driveClient(serviceAccountJson: string): drive_v3.Drive {
  if (cached?.json === serviceAccountJson) return cached.client;
  const credentials = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
  };
  const googleAuth = new auth.GoogleAuth({
    credentials: { client_email: credentials.client_email, private_key: credentials.private_key },
    scopes: SCOPES,
  });
  const client = drive({ version: "v3", auth: googleAuth });
  cached = { json: serviceAccountJson, client };
  return client;
}

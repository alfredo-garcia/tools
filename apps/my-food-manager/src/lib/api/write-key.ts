import { createHash, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Checks the shared write key (tech_standards §9). Throws the API error to return when it fails. */
export function assertWriteKey(sent: string | null, expected = process.env.APP_WRITE_KEY): void {
  if (!expected) throw new ApiError("CONFIG_MISSING", 500, "Falta APP_WRITE_KEY en el servidor");
  if (!sent || !timingSafeEqual(digest(sent), digest(expected)))
    throw new ApiError("UNAUTHORIZED", 401, "La clave de escritura no es correcta");
}

/** Safe-to-log description of a Drive failure (tech_standards §5): no message, no contents. */

/** Message of the error thrown when the route stops waiting for the Drive. */
export const DRIVE_TIMEOUT = "timeout";

const NAME = /^[A-Za-z][A-Za-z0-9]{0,40}$/;
const CODE = /^[A-Z][A-Z0-9_]{1,40}$/;
const REASON = /^[A-Za-z][A-Za-z_]{0,40}$/;

/**
 * Error class, HTTP status, network code and Google's reason code (fixed vocabularies such as
 * `notFound` or `invalid_grant`), each kept only if it matches a strict pattern, so the log says
 * why the Drive failed without quoting any message.
 */
export function driveErrorKind(error: unknown): string[] {
  if (!(error instanceof Error)) return [typeof error];
  const e = error as Error & {
    code?: unknown;
    status?: unknown;
    response?: {
      status?: unknown;
      data?: { error?: unknown };
    };
  };
  const status = e.response?.status ?? e.status;
  const dataError = e.response?.data?.error;
  const reason =
    typeof dataError === "string"
      ? dataError
      : (dataError as { errors?: { reason?: unknown }[] } | undefined)?.errors?.[0]?.reason;

  const parts = [NAME.test(e.name) ? e.name : "Error"];
  if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599) {
    parts.push(String(status));
  }
  if (typeof e.code === "string" && CODE.test(e.code)) parts.push(e.code);
  if (typeof reason === "string" && REASON.test(reason)) parts.push(reason);
  if (e.message === DRIVE_TIMEOUT) parts.push(DRIVE_TIMEOUT);
  return parts;
}

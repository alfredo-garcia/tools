/** Safe-to-log description of a Drive failure (tech_standards §5): no message, no contents. */

/**
 * Error class, HTTP status and Google's reason code (a fixed vocabulary such as `notFound`), so
 * the log says why the Drive failed without quoting any message.
 */
export function driveErrorKind(error: unknown): string[] {
  if (!(error instanceof Error)) return [typeof error];
  const e = error as Error & {
    code?: unknown;
    status?: unknown;
    response?: { status?: unknown; data?: { error?: { errors?: { reason?: unknown }[] } } };
  };
  const status = e.response?.status ?? e.status;
  const reason = e.response?.data?.error?.errors?.[0]?.reason;
  const parts = [e.name];
  if (typeof status === "number") parts.push(String(status));
  if (typeof e.code === "string" && /^[A-Z_]+$/.test(e.code)) parts.push(e.code);
  if (typeof reason === "string" && /^[A-Za-z]+$/.test(reason)) parts.push(reason);
  if (e.message === "timeout") parts.push("timeout");
  return parts;
}

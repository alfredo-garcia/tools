export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Error format from tech_standards §6. */
export function errorResponse(e: unknown): Response {
  const err =
    e instanceof ApiError ? e : new ApiError("INTERNAL", 500, "Error inesperado en el servidor");
  if (!(e instanceof ApiError)) console.error("[api] unexpected error", e);
  return Response.json({ error: { code: err.code, message: err.message } }, { status: err.status });
}

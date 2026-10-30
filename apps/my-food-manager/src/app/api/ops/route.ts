import { ApiError, errorResponse } from "@/lib/api/errors";
import { assertWriteKey } from "@/lib/api/write-key";
import { applyOps } from "@/lib/drive/ops";
import { opsRequestSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertWriteKey(request.headers.get("x-app-key"));
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("INVALID_BODY", 400, "El cuerpo no es JSON válido");
    }
    const parsed = opsRequestSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("INVALID_BODY", 400, "Operaciones no válidas");
    return Response.json(await applyOps(parsed.data.ops), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

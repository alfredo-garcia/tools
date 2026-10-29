import { errorResponse } from "@/lib/api/errors";
import { currentEtag, currentSnapshot } from "@/lib/drive/library";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const etag = await currentEtag();
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": "no-cache" },
      });
    }
    const snapshot = await currentSnapshot();
    return Response.json(snapshot, {
      headers: { ETag: snapshot.etag, "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

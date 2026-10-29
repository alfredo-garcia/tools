import { ApiError, errorResponse } from "@/lib/api/errors";
import { findPhoto } from "@/lib/drive/library";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const photo = await findPhoto(id);
    if (!photo) throw new ApiError("NO_PHOTO", 404, "La receta no tiene foto");
    return new Response(Buffer.from(photo.bytes), {
      headers: {
        "Content-Type": "image/jpeg",
        // The URL carries ?v=<modifiedTime>, so a replaced photo gets a new cache key.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

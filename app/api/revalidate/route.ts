import { NextResponse } from "next/server";
import { revalidateContent } from "@/lib/content/store";
import { isRecord, jsonError, readJsonBody } from "@/app/api/_lib/http";

export const runtime = "nodejs";

/**
 * POST { secret } (or x-revalidate-secret header) → revalidates the "content"
 * cache tag. Used by external hooks (e.g. a GitHub Action after a manual
 * content commit).
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const expected = process.env.REVALIDATE_SECRET;
    if (!expected) return jsonError("Revalidation is not configured.", 401);

    const header = req.headers.get("x-revalidate-secret");
    let provided = header ?? "";
    if (!provided) {
      const body = await readJsonBody(req);
      if (isRecord(body) && typeof body.secret === "string") {
        provided = body.secret;
      }
    }
    if (provided !== expected) return jsonError("Unauthorized", 401);

    revalidateContent();
    return NextResponse.json({ ok: true, revalidated: true });
  } catch (err) {
    console.error("[revalidate] error:", err);
    return jsonError("Something went wrong", 500);
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllNews, saveNews } from "@/lib/content/store";
import type { NewsPost } from "@/lib/content/types";
import {
  ensureWritable,
  errorResponse,
  isArrayOfRecords,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/http";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();
    return NextResponse.json(await getAllNews());
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const body = await readJsonBody(req);
    if (!isArrayOfRecords(body, ["id", "title", "slug", "publishedAt"])) {
      return jsonError("Invalid news payload.", 400);
    }
    const posts = body as unknown as NewsPost[];
    await saveNews(posts, session.email);
    return NextResponse.json(posts);
  } catch (err) {
    return errorResponse(err);
  }
}

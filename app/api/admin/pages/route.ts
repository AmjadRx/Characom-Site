import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getPage, getPageIndex, savePage } from "@/lib/content/store";
import {
  ensureWritable,
  errorResponse,
  isRecord,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/http";
import { parsePage } from "@/app/api/_lib/pages";

export const runtime = "nodejs";

/** GET → page index (slug, title, status, updatedAt). */
export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();
    return NextResponse.json(await getPageIndex());
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST { page: Page } → creates a new page. 409 when the slug exists. */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const body = await readJsonBody(req);
    const page = isRecord(body) ? parsePage(body.page) : null;
    if (!page) {
      return jsonError("Invalid page payload.", 400);
    }
    const existing = await getPage(page.slug);
    if (existing) {
      return jsonError(`A page with slug "${page.slug}" already exists.`, 409);
    }
    page.updatedAt = new Date().toISOString();
    await savePage(page, session.email);
    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

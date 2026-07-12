import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { appendAudit, deletePage, getPage, savePage } from "@/lib/content/store";
import {
  ensureWritable,
  errorResponse,
  isRecord,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/http";
import { isValidPageSlug, parsePage } from "@/app/api/_lib/pages";

export const runtime = "nodejs";

function slugFrom(req: NextRequest): string | null {
  const slug = req.nextUrl.searchParams.get("slug");
  return isValidPageSlug(slug) ? slug : null;
}

/** GET ?slug= → Page. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireSession();
    const slug = slugFrom(req);
    if (!slug) return jsonError("Missing or invalid ?slug parameter.", 400);
    const page = await getPage(slug);
    if (!page) return jsonError("Page not found.", 404);
    return NextResponse.json(page);
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PUT ?slug= { page: Page, publish?: boolean } → saves the page.
 * publish=true copies draftSections → sections, clears draftSections and
 * sets status "published".
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const body = await readJsonBody(req);
    const page = isRecord(body) ? parsePage(body.page) : null;
    if (!page) return jsonError("Invalid page payload.", 400);

    const publish = isRecord(body) && body.publish === true;
    if (publish) {
      page.sections = page.draftSections ?? page.sections;
      page.draftSections = null;
      page.status = "published";
    }
    page.updatedAt = new Date().toISOString();

    await savePage(page, session.email);
    if (publish) {
      await appendAudit(session.email, "page", page.slug, "publish");
    }
    return NextResponse.json(page);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE ?slug= → removes the page + index entry. */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const slug = slugFrom(req);
    if (!slug) return jsonError("Missing or invalid ?slug parameter.", 400);
    await deletePage(slug, session.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

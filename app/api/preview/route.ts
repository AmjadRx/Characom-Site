import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const SLUG_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

/**
 * GET /api/preview?slug=<slug> — admin-only. Enables Next draft mode (public
 * routes then render draftSections) and redirects to the page.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (req.nextUrl.searchParams.get("slug") ?? "home")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  const slug = SLUG_RE.test(raw) ? raw : "home";
  const target = slug === "home" || slug === "" ? "/" : `/${slug}`;

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(target, req.url));
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getNavigation, saveNavigation } from "@/lib/content/store";
import type { NavigationData } from "@/lib/content/types";
import {
  ensureWritable,
  errorResponse,
  isRecord,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/http";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();
    return NextResponse.json(await getNavigation());
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const body = await readJsonBody(req);
    if (
      !isRecord(body) ||
      !Array.isArray(body.header) ||
      !Array.isArray(body.footer_1) ||
      !Array.isArray(body.footer_2) ||
      !Array.isArray(body.footer_3) ||
      !Array.isArray(body.social) ||
      !isRecord(body.footerColumnTitles)
    ) {
      return jsonError("Invalid navigation payload.", 400);
    }
    const nav = body as unknown as NavigationData;
    await saveNavigation(nav, session.email);
    return NextResponse.json(nav);
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getSettings, saveSettings } from "@/lib/content/store";
import type { SiteSettings } from "@/lib/content/types";
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
    return NextResponse.json(await getSettings());
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
      typeof body.siteName !== "string" ||
      !isRecord(body.contact) ||
      !isRecord(body.branding) ||
      !isRecord(body.seoDefaults) ||
      !Array.isArray(body.stats) ||
      !isRecord(body.heroMedia)
    ) {
      return jsonError("Invalid settings payload.", 400);
    }
    const settings = body as unknown as SiteSettings;
    await saveSettings(settings, session.email);
    return NextResponse.json(settings);
  } catch (err) {
    return errorResponse(err);
  }
}

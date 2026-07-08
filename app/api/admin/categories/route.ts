import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getCategories, saveCategories } from "@/lib/content/store";
import type { Category } from "@/lib/content/types";
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
    return NextResponse.json(await getCategories());
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const body = await readJsonBody(req);
    if (!isArrayOfRecords(body, ["id", "name", "slug", "themeColor"])) {
      return jsonError("Invalid categories payload.", 400);
    }
    const categories = body as unknown as Category[];
    await saveCategories(categories, session.email);
    return NextResponse.json(categories);
  } catch (err) {
    return errorResponse(err);
  }
}

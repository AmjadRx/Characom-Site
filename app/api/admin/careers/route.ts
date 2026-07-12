import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllCareers, saveCareers } from "@/lib/content/store";
import type { CareerPosition } from "@/lib/content/types";
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
    return NextResponse.json(await getAllCareers());
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const body = await readJsonBody(req);
    if (!isArrayOfRecords(body, ["id", "title", "department"])) {
      return jsonError("Invalid careers payload.", 400);
    }
    const positions = body as unknown as CareerPosition[];
    await saveCareers(positions, session.email);
    return NextResponse.json(positions);
  } catch (err) {
    return errorResponse(err);
  }
}

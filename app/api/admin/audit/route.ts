import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAuditLog } from "@/lib/content/store";
import { errorResponse } from "@/app/api/_lib/http";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();
    return NextResponse.json(await getAuditLog());
  } catch (err) {
    return errorResponse(err);
  }
}

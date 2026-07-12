import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { errorResponse } from "@/app/api/_lib/http";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    return NextResponse.json({ email: session.email, role: session.role });
  } catch (err) {
    return errorResponse(err);
  }
}

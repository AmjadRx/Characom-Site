import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { errorResponse } from "@/app/api/_lib/http";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

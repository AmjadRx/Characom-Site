import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/auth/users";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  errorResponse,
  getClientIp,
  jsonError,
  rateLimit,
  readJsonBody,
} from "@/app/api/_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    if (!rateLimit("admin-login", ip, 5)) {
      return jsonError("Too many attempts. Try again in a minute.", 429);
    }

    const parsed = bodySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) {
      return jsonError("Enter a valid email and password.", 400);
    }

    const user = await authenticate(parsed.data.email, parsed.data.password);
    if (!user) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = await createSessionToken(user);
    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge middleware guarding /admin pages and /api/admin routes (defense in
 * depth — every admin API handler also calls requireSession()).
 *
 * NOTE: does NOT import lib/auth/session.ts (that module uses next/headers +
 * server-only and is Node-only). JWT verification is inlined here with the
 * same cookie name, secret resolution and claim shape.
 */

const SESSION_COOKIE = "characom_admin";

function secretKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "development") {
      return new TextEncoder().encode("characom-dev-secret-do-not-use-in-prod");
    }
    return null;
  }
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const key = secretKey();
  if (!key) return false;
  try {
    const { payload } = await jwtVerify(token, key);
    return (
      typeof payload.email === "string" &&
      (payload.role === "owner" || payload.role === "editor")
    );
  } catch {
    return false;
  }
}

function withNoindex(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const isAdminApi = pathname.startsWith("/api/admin");

  // Public exceptions: the login page and the login endpoint.
  if (pathname === "/api/admin/auth/login") {
    return NextResponse.next();
  }
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return withNoindex(NextResponse.next());
  }

  const authed = await hasValidSession(req);
  if (!authed) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return withNoindex(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

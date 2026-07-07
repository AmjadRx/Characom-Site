import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/content/types";

export const SESSION_COOKIE = "characom_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

export interface AdminSession {
  email: string;
  role: Role;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "development") {
      return new TextEncoder().encode("characom-dev-secret-do-not-use-in-prod");
    }
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const email = payload.email;
    const role = payload.role;
    if (typeof email !== "string") return null;
    if (role !== "owner" && role !== "editor") return null;
    return { email, role };
  } catch {
    return null;
  }
}

/** Read the current admin session from cookies (server components / routes). */
export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Throws when unauthenticated — use at the top of admin API handlers. */
export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireOwner(): Promise<AdminSession> {
  const session = await requireSession();
  if (session.role !== "owner") throw new Error("FORBIDDEN");
  return session;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

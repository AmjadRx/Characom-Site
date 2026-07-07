import { NextResponse } from "next/server";
import { canWrite } from "@/lib/content/source";

/**
 * Shared helpers for API route handlers: JSON error responses, error → status
 * mapping (requireSession/requireOwner throw typed messages), an in-memory
 * rate limiter and client-IP extraction.
 */

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Map thrown errors to JSON responses. `requireSession()` throws
 * "UNAUTHORIZED", `requireOwner()` throws "FORBIDDEN", `ensureWritable()`
 * throws "READONLY". Everything else becomes a generic 500 — internals are
 * logged server-side, never leaked to the client.
 */
export function errorResponse(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "";
  if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
  if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
  if (message === "READONLY") {
    return jsonError(
      "Content source is read-only — configure GITHUB_TOKEN and GITHUB_REPO to enable saving.",
      503,
    );
  }
  console.error("[api] unhandled error:", err);
  return jsonError("Something went wrong", 500);
}

/** Throws "READONLY" when the content source cannot accept writes. */
export function ensureWritable(): void {
  if (!canWrite()) throw new Error("READONLY");
}

/* ── In-memory rate limiting (per serverless instance — best effort) ────── */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true when the call is allowed, false when the limit is exceeded.
 * Fixed window per (scope, key).
 */
export function rateLimit(
  scope: string,
  key: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  // Opportunistic pruning so the map never grows unbounded.
  if (buckets.size > 2_000) {
    for (const [id, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(id);
    }
  }
  const id = `${scope}:${key}`;
  const entry = buckets.get(id);
  if (!entry || entry.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Parse a JSON body, returning null instead of throwing on bad input. */
export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/* ── Zod-light structural validation ─────────────────────────────────────── */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Every element is an object containing all of `keys`. */
export function isArrayOfRecords(
  value: unknown,
  keys: string[],
): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.every((item) => isRecord(item) && keys.every((k) => k in item))
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { getSource } from "@/lib/content/source";

export const runtime = "nodejs";

/**
 * Serves media binaries from the content source (repo /media directory in
 * dev, GitHub Contents API on Vercel). Media URLs in content are
 * `/api/media/<file>` — next/image-compatible (relative same-origin src).
 */

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  pdf: "application/pdf",
};

const SEGMENT_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function sanitizeSegments(segments: string[]): string | null {
  if (segments.length === 0 || segments.length > 4) return null;
  for (const segment of segments) {
    if (!SEGMENT_RE.test(segment) || segment.includes("..")) return null;
  }
  return segments.join("/");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  try {
    const { path } = await params;
    const relative = sanitizeSegments(path ?? []);
    if (!relative) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const ext = relative.slice(relative.lastIndexOf(".") + 1).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType || !relative.includes(".")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buf = await getSource().readBinary(`media/${relative}`);
    if (!buf) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": String(buf.byteLength),
      "Cache-Control":
        "public, max-age=300, s-maxage=31536000, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    });
    if (ext === "svg" || ext === "pdf") {
      // Defang scriptable formats served from user uploads.
      headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      headers.set("Content-Disposition", "inline");
    }
    return new NextResponse(new Uint8Array(buf), { headers });
  } catch (err) {
    console.error("[media] serve failed:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

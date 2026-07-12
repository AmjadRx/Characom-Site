import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getMediaIndex, saveMediaIndex } from "@/lib/content/store";
import { getSource } from "@/lib/content/source";
import type { MediaItem } from "@/lib/content/types";
import {
  ensureWritable,
  errorResponse,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/http";
import { probeImageSize } from "@/app/api/_lib/image-size";

export const runtime = "nodejs";

const ALLOWED_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
  "svg",
  "mp4",
  "pdf",
]);

/** Vercel request bodies cap out around 4.5MB — reject slightly above that. */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Reduce an arbitrary client filename to a safe "stem.ext" (no slashes, no
 * dot segments, allowlisted extension). Returns null when unusable.
 */
function sanitizeMediaName(name: string): string | null {
  const base = name.split(/[\\/]/).pop() ?? "";
  const lower = base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  const match = lower.match(/^(.+)\.([a-z0-9]+)$/);
  if (!match) return null;
  const ext = match[2];
  if (!ALLOWED_EXT.has(ext)) return null;
  const stem = match[1]
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 80);
  if (!stem) return null;
  return `${stem}.${ext}`;
}

export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();
    return NextResponse.json(await getMediaIndex());
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST multipart (file, alt) → stores binary at media/<name>, returns MediaItem. */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonError("Expected multipart form data.", 400);
    }
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Missing file upload.", 400);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError("File is too large (max 8MB).", 413);
    }
    const altEntry = form.get("alt");
    const alt = typeof altEntry === "string" ? altEntry.trim() : "";

    const safeName = sanitizeMediaName(file.name || "upload.bin");
    if (!safeName) {
      return jsonError(
        "Unsupported file type. Allowed: jpg, jpeg, png, webp, avif, gif, svg, mp4, pdf.",
        400,
      );
    }

    const index = await getMediaIndex();
    // Never silently overwrite an existing binary — uniquify on collision.
    let name = safeName;
    if (index.items.some((i) => i.file === name)) {
      const dot = safeName.lastIndexOf(".");
      const suffix = Date.now().toString(36);
      name = `${safeName.slice(0, dot)}-${suffix}${safeName.slice(dot)}`;
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = name.slice(name.lastIndexOf(".") + 1);
    const size = probeImageSize(buf, ext);

    await getSource().writeBinary(
      `media/${name}`,
      buf,
      `cms: upload media "${name}"`,
    );

    const item: MediaItem = {
      file: name,
      alt,
      ...(size ? { width: size.width, height: size.height } : {}),
      tags: [],
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.email,
    };
    index.items = [item, ...index.items.filter((i) => i.file !== name)];
    await saveMediaIndex(index, session.email);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

const patchSchema = z.object({
  file: z.string().min(1),
  alt: z.string().max(400).optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
});

/** PATCH { file, alt?, tags? } → updates index metadata. */
export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const parsed = patchSchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return jsonError("Invalid media update.", 400);

    const index = await getMediaIndex();
    const item = index.items.find((i) => i.file === parsed.data.file);
    if (!item) return jsonError("Media item not found.", 404);

    if (parsed.data.alt !== undefined) item.alt = parsed.data.alt;
    if (parsed.data.tags !== undefined) item.tags = parsed.data.tags;
    await saveMediaIndex(index, session.email);
    return NextResponse.json(item);
  } catch (err) {
    return errorResponse(err);
  }
}

const deleteSchema = z.object({
  file: z.string().min(1),
});

/** DELETE { file } → removes the binary and its index entry. */
export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const parsed = deleteSchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return jsonError("Invalid delete request.", 400);

    const name = sanitizeMediaName(parsed.data.file);
    if (!name || name !== parsed.data.file) {
      return jsonError("Invalid file name.", 400);
    }

    await getSource().remove(`media/${name}`, `cms: delete media "${name}"`);
    const index = await getMediaIndex();
    index.items = index.items.filter((i) => i.file !== name);
    await saveMediaIndex(index, session.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getInquiries, updateInquiry } from "@/lib/content/store";
import {
  ensureWritable,
  errorResponse,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/http";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();
    return NextResponse.json(await getInquiries());
  } catch (err) {
    return errorResponse(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "read", "replied", "archived"]),
});

/** PATCH { id, status } → updates one inquiry's status. */
export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    await requireSession();
    ensureWritable();
    const parsed = patchSchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return jsonError("Invalid inquiry update.", 400);

    const inquiries = await getInquiries();
    const inquiry = inquiries.find((i) => i.id === parsed.data.id);
    if (!inquiry) return jsonError("Inquiry not found.", 404);

    inquiry.status = parsed.data.status;
    if (parsed.data.status === "replied" && !inquiry.repliedAt) {
      inquiry.repliedAt = new Date().toISOString();
    }
    await updateInquiry(inquiry);
    return NextResponse.json(inquiry);
  } catch (err) {
    return errorResponse(err);
  }
}

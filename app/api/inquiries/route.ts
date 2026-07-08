import { NextResponse, after } from "next/server";
import { z } from "zod";
import { saveInquiry } from "@/lib/content/store";
import { canWrite } from "@/lib/content/source";
import type { Inquiry } from "@/lib/content/types";
import { newId } from "@/lib/utils";
import { sendInquiryEmail } from "@/lib/notify";
import {
  getClientIp,
  jsonError,
  rateLimit,
  readJsonBody,
} from "@/app/api/_lib/http";

export const runtime = "nodejs";

/** Minimum ms between form render (startedAt) and submit — bots are faster. */
const MIN_FILL_MS = 3_000;

const inquirySchema = z.object({
  subjectType: z.enum(["general", "project", "partnership", "careers"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10).max(5_000),
  consent: z.literal(true),
  /** honeypot — humans never fill this */
  website: z.string().max(0).optional(),
  /** time-trap — Date.now() when the form was rendered */
  startedAt: z.number(),
});

function sourcePageFrom(req: Request): string {
  const referer = req.headers.get("referer");
  if (!referer) return "/";
  try {
    return new URL(referer).pathname || "/";
  } catch {
    return "/";
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const generic = "Something went wrong. Please try again.";
  try {
    const ip = getClientIp(req);
    if (!rateLimit("inquiries", ip, 3)) {
      return jsonError("Too many messages. Please try again in a minute.", 429);
    }

    const parsed = inquirySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) {
      return jsonError("Please check the form and try again.", 400);
    }
    const data = parsed.data;

    // Time-trap: reject submissions faster than a human could type.
    const elapsed = Date.now() - data.startedAt;
    if (elapsed < MIN_FILL_MS) {
      return jsonError(generic, 400);
    }

    const now = new Date().toISOString();
    const inquiry: Inquiry = {
      id: newId("inq"),
      subjectType: data.subjectType,
      name: data.name,
      email: data.email,
      ...(data.phone ? { phone: data.phone } : {}),
      message: data.message,
      sourcePage: sourcePageFrom(req),
      status: "new",
      consentAt: now,
      createdAt: now,
    };

    let stored = false;
    if (canWrite()) {
      try {
        await saveInquiry(inquiry);
        stored = true;
      } catch (err) {
        console.error("[inquiries] store failed:", err);
      }
    }

    // Fire-and-forget notification — never blocks or fails the response.
    after(async () => {
      try {
        await sendInquiryEmail(inquiry);
      } catch (err) {
        console.error("[inquiries] notify failed:", err);
      }
    });

    return NextResponse.json(stored ? { ok: true } : { ok: true, stored: false });
  } catch (err) {
    console.error("[inquiries] unhandled error:", err);
    return jsonError(generic, 500);
  }
}

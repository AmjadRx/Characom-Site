import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { errorResponse, jsonError, readJsonBody } from "@/app/api/_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  password: z.string().min(8).max(200),
});

/** POST { password } → { hash } (owner only) for env-var user provisioning. */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireOwner();
    const parsed = bodySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) {
      return jsonError("Password must be at least 8 characters.", 400);
    }
    const hash = await hashPassword(parsed.data.password);
    return NextResponse.json({ hash });
  } catch (err) {
    return errorResponse(err);
  }
}

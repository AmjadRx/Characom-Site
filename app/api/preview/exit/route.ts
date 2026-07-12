import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/** GET /api/preview/exit — disables draft mode and returns to the live site. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", req.url));
}

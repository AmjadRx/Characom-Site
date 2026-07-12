import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllProjects, saveProjects } from "@/lib/content/store";
import type { Project } from "@/lib/content/types";
import {
  ensureWritable,
  errorResponse,
  isArrayOfRecords,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/http";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();
    return NextResponse.json(await getAllProjects());
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    ensureWritable();
    const body = await readJsonBody(req);
    if (!isArrayOfRecords(body, ["id", "categoryId", "name", "slug"])) {
      return jsonError("Invalid projects payload.", 400);
    }
    const projects = body as unknown as Project[];
    await saveProjects(projects, session.email);
    return NextResponse.json(projects);
  } catch (err) {
    return errorResponse(err);
  }
}

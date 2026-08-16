// ============================================================
// Landing Page CMS — shared API route plumbing
// Authorization is enforced here on every admin write, not in the UI.
// ============================================================

import { NextResponse } from "next/server";
import { getAdminEmail, logAdminAction } from "@/lib/admin-auth";
import { CmsError } from "./server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_RE.test(value);

/** Runs the handler only for a signed-in admin, mapping CmsError to its status. */
export async function withAdmin(
  handler: (adminEmail: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return await handler(adminEmail);
  } catch (error) {
    if (error instanceof CmsError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[cms] unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    throw new CmsError("Invalid request body");
  }
}

export function validationFailed(errors: Record<string, string>) {
  return NextResponse.json(
    { error: "Please fix the highlighted fields", fieldErrors: errors },
    { status: 422 },
  );
}

export function requireUuid(value: unknown, label = "id"): string {
  const v = String(value ?? "");
  if (!isUuid(v)) throw new CmsError(`Invalid ${label}`, 400);
  return v;
}

export function requireIdList(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((id) => !isUuid(String(id)))) {
    throw new CmsError("A valid list of ids is required");
  }
  return value.map((id) => String(id));
}

export async function auditCms(
  adminEmail: string,
  action: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  await logAdminAction(adminEmail, action, "landing_cms", entityId, details);
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// TEMPORARY diagnostic endpoint — token-gated. Remove once admin login works.
const DIAG_TOKEN = "pdx-diag-8f3a2c";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("t") !== DIAG_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectRef = rawUrl.replace(/^https?:\/\//, "").split(".")[0];
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const result: Record<string, unknown> = {
    marker: "debug-auth-v1",
    projectRef,
    hasServiceKey: !!serviceKey,
    serviceKeyLen: serviceKey.length,
    serviceKeyTrimmedLen: serviceKey.trim().length,
    anonKeyLen: anonKey.length,
    adminClientConfigured: !!supabaseAdmin,
  };

  if (supabaseAdmin) {
    const a = await supabaseAdmin.from("admins").select("email,is_active");
    result.admins = a.data?.map((r: { email: string }) => r.email) ?? null;
    result.adminsError = a.error?.message ?? null;

    const c = await supabaseAdmin.from("admin_credentials").select("email");
    result.credentials = c.data?.map((r: { email: string }) => r.email) ?? null;
    result.credentialsError = c.error?.message ?? null;
  }

  return NextResponse.json(result);
}

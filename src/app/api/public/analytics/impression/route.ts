import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public endpoint — track a section view impression (fire-and-forget from public page)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { section_id, partner_id, section_type } = body;

    if (!partner_id || !section_type) {
      return NextResponse.json({ error: "partner_id and section_type required" }, { status: 400 });
    }

    await supabase.from("partner_section_impressions").insert({
      partner_id,
      section_id: section_id || null,
      section_type,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

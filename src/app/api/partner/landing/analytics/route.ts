import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const supabase = supabaseAdmin!;

// GET — return impression counts grouped by section_id for authenticated partner
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Aggregate impressions by section_id over the last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("partner_section_impressions")
    .select("section_id")
    .eq("partner_id", user.id)
    .gte("viewed_at", since);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate counts per section_id
  const counts: Record<string, number> = {};
  for (const row of rows || []) {
    if (row.section_id) {
      counts[row.section_id] = (counts[row.section_id] || 0) + 1;
    }
  }

  return NextResponse.json({ impressions: counts, total: (rows || []).length });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const supabase = supabaseAdmin!;

async function getPartnerId(email: string): Promise<string | null> {
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  return user?.id ?? null;
}

// POST — toggle or set published/draft status
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const newStatus: "draft" | "published" = body.status ?? "published";

  if (!["draft", "published"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Upsert landing page record
  const { data: landingPage, error } = await supabase
    .from("partner_landing_pages")
    .upsert(
      {
        partner_id: partnerId,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "partner_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also sync is_published on partner_branding so the existing render engine can see it
  await supabase
    .from("partner_branding")
    .update({
      is_published: newStatus === "published",
      updated_at: new Date().toISOString(),
    })
    .eq("partner_id", partnerId);

  return NextResponse.json({ landingPage, status: newStatus });
}

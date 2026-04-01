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

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: landingPage, error } = await supabase
    .from("partner_landing_pages")
    .select("*")
    .eq("partner_id", partnerId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ landingPage: landingPage ?? null });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { meta_title, meta_description, og_image_url, status } = body;

  const payload: Record<string, unknown> = {
    partner_id: partnerId,
    updated_at: new Date().toISOString(),
  };

  if (meta_title !== undefined) payload.meta_title = meta_title;
  if (meta_description !== undefined) payload.meta_description = meta_description;
  if (og_image_url !== undefined) payload.og_image_url = og_image_url;
  if (status !== undefined && ["draft", "published"].includes(status)) {
    payload.status = status;
  }

  const { data: landingPage, error } = await supabase
    .from("partner_landing_pages")
    .upsert(payload, { onConflict: "partner_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ landingPage });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, profiles(full_name, phone, avatar_url)")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    email: user.email,
    full_name: (user.profiles as any)?.full_name || "",
    phone: (user.profiles as any)?.phone || "",
    avatar_url: (user.profiles as any)?.avatar_url || "",
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const { full_name, phone } = await request.json();

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("profiles")
      .update({ full_name, phone })
      .eq("user_id", user.id);
  } else {
    await supabaseAdmin
      .from("profiles")
      .insert({ user_id: user.id, full_name, phone });
  }

  return NextResponse.json({ success: true });
}

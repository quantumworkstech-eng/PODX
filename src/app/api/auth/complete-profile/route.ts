import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { email, token, name, mobile, businessName, role } = await request.json();

  if (!email || !token) {
    return NextResponse.json({ error: "Email and token are required" }, { status: 400 });
  }

  // Verify the token is valid (matches email, not expired)
  const { data: otpRow } = await supabaseAdmin
    .from("email_otps")
    .select("id, email, expires_at")
    .eq("email", email)
    .eq("verification_token", token)
    .maybeSingle();

  if (!otpRow) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  // Get user
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Append the new role to the user's existing roles (supports multi-role).
  // e.g. a "user" signing up as partner becomes "user,partner".
  if (role === "partner" || role === "user") {
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const existing = ((currentUser as any)?.role as string | null) || "user";
    const parts = existing.split(",").map((r: string) => r.trim()).filter(Boolean);
    if (!parts.includes(role)) {
      parts.push(role);
      await supabaseAdmin
        .from("users")
        .update({ role: parts.join(",") })
        .eq("id", user.id);
    }
  }

  // Upsert profile
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfile) {
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: name || undefined,
        phone: mobile || undefined,
        business_name: businessName || undefined,
      })
      .eq("user_id", user.id);
  } else {
    await supabaseAdmin.from("profiles").insert({
      user_id: user.id,
      full_name: name || email.split("@")[0],
      phone: mobile || null,
      business_name: businessName || null,
    });
  }

  return NextResponse.json({ success: true });
}

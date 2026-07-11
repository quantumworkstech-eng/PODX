import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

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

  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  // Find a valid, unused OTP for this email
  const { data: otpRow, error: otpError } = await supabaseAdmin
    .from("email_otps")
    .select("id, code, expires_at, used")
    .eq("email", email)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError || !otpRow) {
    return NextResponse.json({ error: "Invalid or expired code. Please request a new one." }, { status: 400 });
  }

  if (otpRow.used) {
    return NextResponse.json({ error: "This code has already been used." }, { status: 400 });
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
  }

  if (otpRow.code !== code) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  // Generate a secure verification token (valid for 15 minutes)
  const verificationToken = crypto.randomUUID();

  // Mark OTP as used and store verification token
  await supabaseAdmin
    .from("email_otps")
    .update({ used: true, verification_token: verificationToken })
    .eq("id", otpRow.id);

  // Find or create user
  let { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        auth_provider: "email",
        email_verified: true,
      })
      .select("id, email")
      .single();

    if (createError || !newUser) {
      console.error("Error creating user:", createError);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    user = newUser;
  } else {
    // Mark existing user email as verified if not already
    await supabaseAdmin
      .from("users")
      .update({ email_verified: true })
      .eq("id", user.id);
  }

  return NextResponse.json({
    verified: true,
    token: verificationToken,
    isNewUser,
  });
}

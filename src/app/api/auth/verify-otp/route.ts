import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { createAuditLog, requestContextFrom } from "@/lib/audit";

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
    // No unused code on file — someone is submitting a stale or guessed code.
    await createAuditLog({
      action: "LOGIN_FAILED",
      module: "Authentication",
      description: `Verification attempted for ${email} with no valid outstanding code`,
      actor: { email, name: email.split("@")[0], role: "user" },
      status: "FAILED",
      errorMessage: "No valid or unexpired verification code on file",
      recordType: "user",
      recordId: email,
      request: requestContextFrom(request),
    });
    return NextResponse.json({ error: "Invalid or expired code. Please request a new one." }, { status: 400 });
  }

  if (otpRow.used) {
    return NextResponse.json({ error: "This code has already been used." }, { status: 400 });
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    await createAuditLog({
      action: "LOGIN_FAILED",
      module: "Authentication",
      description: `Expired verification code submitted for ${email}`,
      actor: { email, name: email.split("@")[0], role: "user" },
      status: "FAILED",
      errorMessage: "Verification code expired",
      recordType: "user",
      recordId: email,
      request: requestContextFrom(request),
    });
    return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
  }

  if (otpRow.code !== code) {
    await createAuditLog({
      action: "LOGIN_FAILED",
      module: "Authentication",
      description: `Incorrect verification code entered for ${email}`,
      actor: { email, name: email.split("@")[0], role: "user" },
      status: "FAILED",
      errorMessage: "Incorrect verification code",
      recordType: "user",
      recordId: email,
      request: requestContextFrom(request),
    });
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

  const context = requestContextFrom(request);

  if (isNewUser) {
    await createAuditLog({
      action: "USER_CREATED",
      module: "Users",
      description: `New account created for ${email} via email verification`,
      actor: { id: user.id, email, name: email.split("@")[0], role: "user" },
      recordType: "user",
      recordId: user.id,
      recordName: email,
      newValues: { email, auth_provider: "email", email_verified: true },
      request: context,
    });
  }

  await createAuditLog({
    action: "LOGIN",
    module: "Authentication",
    description: `${email} signed in with a verification code`,
    actor: { id: user.id, email, name: email.split("@")[0], role: "user" },
    recordType: "user",
    recordId: user.id,
    metadata: { method: "otp", new_account: isNewUser },
    request: context,
  });

  return NextResponse.json({
    verified: true,
    token: verificationToken,
    isNewUser,
  });
}

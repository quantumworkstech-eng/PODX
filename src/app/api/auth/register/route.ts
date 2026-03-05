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

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha256")
    .toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { email, password, name, mobile } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const password_hash = hashPassword(password);

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      email,
      password_hash,
      auth_provider: "credentials",
      email_verified: false,
    })
    .select("id")
    .single();

  if (userError || !user) {
    console.error("Error creating user:", userError);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // Create profile
  await supabaseAdmin.from("profiles").insert({
    user_id: user.id,
    full_name: name || email.split("@")[0],
    phone: mobile || null,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

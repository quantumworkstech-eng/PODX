import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emitNotification } from "@/lib/notifications";

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { email, audience } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  // Rate limit: max 3 OTPs per email per 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("email_otps")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", tenMinutesAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Too many OTP requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.from("email_otps").insert({
    email,
    code,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Error storing OTP:", error);
    return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
  }

  // The OTP row is committed before the mail goes out, so the code in the
  // inbox always exists in the database.
  const [result] = await emitNotification(
    audience === "partner" ? "PARTNER_OTP_REQUESTED" : "CLIENT_OTP_REQUESTED",
    { email, metadata: { code, expiresInMinutes: 10 } }
  );

  if (result?.status === "skipped") {
    return NextResponse.json(
      { error: "Failed to send OTP email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

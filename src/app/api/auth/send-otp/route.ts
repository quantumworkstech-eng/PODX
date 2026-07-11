import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.SUPPORT_EMAIL || "onboarding@resend.dev";
  const isDev = process.env.NODE_ENV !== "production";

  // In development or when no real API key is configured, just log OTP to console
  if (!apiKey || apiKey === "re_..." || apiKey.endsWith("...")) {
    console.log(`\n[DEV] ✉️  OTP for ${email}: ${code}\n`);
    return true;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Yanisa Studios <${fromEmail}>`,
      to: [email],
      subject: `Your Yanisa Studios verification code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fff; padding: 40px; border-radius: 16px;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">
            <span style="color: #fff;">Yanisa </span><span style="color: #D9FC67;">Studios</span>
          </h1>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 32px;">Your verification code</p>
          <div style="background: #141414; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 16px;">Enter this code to verify your email</p>
            <div style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #D9FC67;">${code}</div>
            <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 16px;">Expires in 10 minutes</p>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error("Resend error:", errBody);

    // In development, fall back to console logging so OTP flow still works
    if (isDev) {
      console.log(`\n[DEV FALLBACK] ✉️  OTP for ${email}: ${code}\n`);
      return true;
    }
  }

  return res.ok;
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { email } = await request.json();

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

  const sent = await sendOTPEmail(email, code);

  if (!sent) {
    return NextResponse.json({ error: "Failed to send OTP email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

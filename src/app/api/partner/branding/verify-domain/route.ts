import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
const supabase = supabaseAdmin!;
import dns from "dns/promises";
import crypto from "crypto";

// POST /api/partner/branding/verify-domain
// Step 1: generate verification token
// Step 2 (verify=true): check DNS TXT record
export async function POST(req: NextRequest) {
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

  const { verify } = await req.json();

  const { data: branding } = await supabase
    .from("partner_branding")
    .select("*")
    .eq("partner_id", user.id)
    .single();

  if (!branding?.custom_domain) {
    return NextResponse.json({ error: "No custom domain configured" }, { status: 400 });
  }

  // Step 1: generate token
  if (!verify) {
    const token = `podx-verify=${crypto.randomBytes(16).toString("hex")}`;
    await supabase
      .from("partner_branding")
      .update({ domain_verification_token: token, domain_verified: false })
      .eq("partner_id", user.id);

    return NextResponse.json({
      token,
      instruction: `Add a DNS TXT record to ${branding.custom_domain} with value: ${token}`,
      record_type: "TXT",
      record_name: "_podx-verify",
      record_value: token,
    });
  }

  // Step 2: verify DNS
  try {
    const records = await dns.resolveTxt(`_podx-verify.${branding.custom_domain}`);
    const flat = records.flat();
    if (flat.includes(branding.domain_verification_token)) {
      await supabase
        .from("partner_branding")
        .update({
          domain_verified: true,
          domain_verified_at: new Date().toISOString(),
        })
        .eq("partner_id", user.id);
      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json({ verified: false, error: "TXT record not found or mismatch" });
    }
  } catch {
    return NextResponse.json({ verified: false, error: "DNS lookup failed — record may not have propagated yet" });
  }
}

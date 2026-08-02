import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/admin/login
// action: "check"        → is email in admin_credentials?
// action: "set_password" → first-time password setup
// action: "verify"       → verify email + password (returns token for NextAuth)
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const { email, password, action } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { data: admin, error: lookupErr } = await supabaseAdmin
    .from("admin_credentials")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  // Surface DB/connection errors instead of masking them as "not authorized"
  // (e.g. an invalid SUPABASE_SERVICE_ROLE_KEY returns a 401 here).
  if (lookupErr) {
    console.error("admin/login lookup error:", lookupErr.message);
    return NextResponse.json({ error: `Admin lookup failed: ${lookupErr.message}` }, { status: 500 });
  }

  if (!admin) {
    return NextResponse.json({ error: "Not authorized. This email is not registered as admin." }, { status: 403 });
  }

  // Check: is email in the table? and does it have a password?
  if (action === "check") {
    return NextResponse.json({ hasPassword: !!admin.password_hash });
  }

  // Set password for first-time login
  if (action === "set_password") {
    if (admin.password_hash) {
      return NextResponse.json({ error: "Password already set. Please login normally." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 12);
    await supabaseAdmin
      .from("admin_credentials")
      .update({ password_hash: hash })
      .eq("id", admin.id);
    return NextResponse.json({ success: true });
  }

  // Verify password for subsequent logins
  if (action === "verify") {
    if (!admin.password_hash) {
      return NextResponse.json({ error: "Please set your password first." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password required." }, { status: 400 });
    }
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

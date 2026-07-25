"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Must match the resolution used to verify the admin_session cookie in
// middleware.ts and admin/layout.tsx — NextAuth v5 uses AUTH_SECRET.
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "admin-fallback-secret"
);

export async function adminSetPassword(email: string, password: string): Promise<{ error: string } | { success: true }> {
  if (!supabaseAdmin) return { error: "DB not configured." };

  const { data: admin, error: dbErr } = await supabaseAdmin
    .from("admin_credentials")
    .select("id, password_hash")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (dbErr) return { error: "Database error. Make sure admin_credentials table exists." };
  if (!admin) return { error: "Not authorized." };
  if (admin.password_hash) return { error: "Password already set. Please login normally." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const hash = await bcrypt.hash(password, 12);
  const { error: updateErr } = await supabaseAdmin
    .from("admin_credentials")
    .update({ password_hash: hash })
    .eq("id", admin.id);

  if (updateErr) return { error: "Failed to save password." };
  return { success: true };
}

export async function adminCheckEmail(email: string): Promise<{ error: string } | { hasPassword: boolean }> {
  if (!supabaseAdmin) return { error: "DB not configured." };

  const { data: admin, error: dbErr } = await supabaseAdmin
    .from("admin_credentials")
    .select("id, password_hash")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (dbErr) return { error: "Database error. Make sure admin_credentials table exists." };
  if (!admin) return { error: "Not authorized. This email is not registered as admin." };

  return { hasPassword: !!admin.password_hash };
}

// Signs in admin by setting a custom cookie — no NextAuth involved.
// Returns { success: true } instead of redirect()ing: the client then does a
// HARD navigation to /admin so the freshly-set cookie is guaranteed to be sent
// on the next request. redirect() from a Server Action triggers a soft RSC
// navigation where the just-set cookie can be missing, bouncing the user back.
export async function adminSignIn(email: string, password: string, rememberMe = true): Promise<{ error: string } | { success: true }> {
  if (!supabaseAdmin) return { error: "DB not configured." };

  const { data: admin, error: dbErr } = await supabaseAdmin
    .from("admin_credentials")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (dbErr) return { error: "Database error." };
  if (!admin) return { error: "Not authorized." };
  if (!admin.password_hash) return { error: "Please set your password first." };

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return { error: "Incorrect password." };

  // Create signed JWT stored as httpOnly cookie (always 30-day session)
  const token = await new SignJWT({ email: admin.email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return { success: true };
}

export async function adminSignOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}

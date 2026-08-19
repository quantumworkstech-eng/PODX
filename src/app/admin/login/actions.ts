"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";

// Must match the resolution used to verify the admin_session cookie in
// middleware.ts and admin/layout.tsx — NextAuth v5 uses AUTH_SECRET.
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "admin-fallback-secret"
);

/**
 * Authorization is based on the `admins` table (the admin panel's source of
 * truth). `admin_credentials` only stores the password — its row is created on
 * demand so admins added directly in the DB (not via the Admins UI) can still
 * log in and set a password on first sign-in.
 */
type AdminLookup =
  | { ok: true; email: string }
  | { ok: false; reason: "no_client" | "query_error" | "not_found" | "inactive"; detail?: string };

/**
 * Resolve an admin from the `admins` roster. Compares email in JS (trimmed +
 * lowercased) so stray whitespace / case in a manually-entered row still
 * matches. The `admins` table is small, so fetching all rows is fine.
 */
async function lookupAdmin(email: string): Promise<AdminLookup> {
  if (!supabaseAdmin) return { ok: false, reason: "no_client" };
  const normalized = email.toLowerCase().trim();
  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("email, is_active");
  if (error) {
    console.error("adminLogin lookupAdmin error:", error.message);
    return { ok: false, reason: "query_error", detail: error.message };
  }
  const row = (data ?? []).find(
    (r: any) => String(r.email ?? "").trim().toLowerCase() === normalized
  );
  if (!row) return { ok: false, reason: "not_found" };
  if (row.is_active === false) return { ok: false, reason: "inactive" };
  return { ok: true, email: normalized };
}

/**
 * Resolve an active admin or return a *specific* error. Distinguishes a DB/query
 * failure from a genuinely-missing row so a misconfigured live database (wrong
 * Supabase URL/key, missing table, RLS) surfaces the real cause instead of being
 * masked as "Not authorized" — which looks identical to the row simply not
 * existing. Mirrors the hardened /api/admin/login route.
 */
async function resolveActiveAdmin(email: string): Promise<{ email: string } | { error: string }> {
  const result = await lookupAdmin(email);
  if (result.ok) return { email: result.email };
  if (result.reason === "no_client") return { error: "DB not configured." };
  if (result.reason === "inactive") return { error: "Your admin account is inactive. Contact an administrator." };
  if (result.reason === "query_error") {
    return { error: `Admin lookup failed: ${result.detail || "database error"}. Check the live database configuration.` };
  }
  return { error: "Not authorized. This email is not registered as admin." };
}

/** Returns the admin_credentials row for this email, creating it if missing. */
async function ensureCredentials(
  email: string
): Promise<{ id: string; password_hash: string | null } | null> {
  if (!supabaseAdmin) return null;
  const normalized = email.toLowerCase().trim();

  const { data: existing } = await supabaseAdmin
    .from("admin_credentials")
    .select("id, password_hash")
    .eq("email", normalized)
    .maybeSingle();
  if (existing) return existing as { id: string; password_hash: string | null };

  const { data: created } = await supabaseAdmin
    .from("admin_credentials")
    .insert({ email: normalized })
    .select("id, password_hash")
    .maybeSingle();
  return (created as { id: string; password_hash: string | null }) ?? null;
}

export async function adminSetPassword(email: string, password: string): Promise<{ error: string } | { success: true }> {
  if (!supabaseAdmin) return { error: "DB not configured." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = await resolveActiveAdmin(email);
  if ("error" in admin) return { error: admin.error };

  const cred = await ensureCredentials(admin.email);
  if (!cred) return { error: "Database error. Make sure admin_credentials table exists." };
  if (cred.password_hash) return { error: "Password already set. Please login normally." };

  const hash = await bcrypt.hash(password, 12);
  const { error: updateErr } = await supabaseAdmin
    .from("admin_credentials")
    .update({ password_hash: hash })
    .eq("id", cred.id);

  if (updateErr) return { error: "Failed to save password." };

  await createAuditLog({
    action: "PASSWORD_CHANGED",
    module: "Authentication",
    description: `Admin ${admin.email} set their password`,
    actor: { email: admin.email, name: admin.email.split("@")[0], role: "admin" },
    recordType: "admin",
    recordId: admin.email,
  });

  return { success: true };
}

export async function adminCheckEmail(email: string): Promise<{ error: string } | { hasPassword: boolean }> {
  if (!supabaseAdmin) return { error: "DB not configured." };

  const lookup = await resolveActiveAdmin(email);
  if ("error" in lookup) return { error: lookup.error };

  const cred = await ensureCredentials(lookup.email);
  if (!cred) return { error: "Database error. Make sure admin_credentials table exists." };

  return { hasPassword: !!cred.password_hash };
}

// Signs in admin by setting a custom cookie — no NextAuth involved.
// Returns { success: true } instead of redirect()ing: the client then does a
// HARD navigation to /admin so the freshly-set cookie is guaranteed to be sent
// on the next request. redirect() from a Server Action triggers a soft RSC
// navigation where the just-set cookie can be missing, bouncing the user back.
export async function adminSignIn(email: string, password: string, rememberMe = true): Promise<{ error: string } | { success: true }> {
  if (!supabaseAdmin) return { error: "DB not configured." };

  const admin = await resolveActiveAdmin(email);
  if ("error" in admin) return { error: admin.error };

  const cred = await ensureCredentials(admin.email);
  if (!cred) return { error: "Database error." };
  if (!cred.password_hash) return { error: "Please set your password first." };

  const valid = await bcrypt.compare(password, cred.password_hash);
  if (!valid) {
    // Failed sign-in attempts are recorded too — the actor is passed explicitly
    // because there is no session to resolve one from.
    await createAuditLog({
      action: "LOGIN_FAILED",
      module: "Authentication",
      description: `Failed admin sign-in for ${admin.email}`,
      actor: { email: admin.email, name: admin.email.split("@")[0], role: "admin" },
      status: "FAILED",
      errorMessage: "Incorrect password",
      recordType: "admin",
      recordId: admin.email,
    });
    return { error: "Incorrect password." };
  }

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

  await createAuditLog({
    action: "LOGIN",
    module: "Authentication",
    description: `Admin ${admin.email} signed in`,
    actor: { email: admin.email, name: admin.email.split("@")[0], role: "admin" },
    recordType: "admin",
    recordId: admin.email,
    metadata: { rememberMe },
  });

  return { success: true };
}

export async function adminSignOut(): Promise<void> {
  // Resolve the actor from the cookie before clearing it.
  await createAuditLog({
    action: "LOGOUT",
    module: "Authentication",
    description: "Admin signed out",
    recordType: "admin",
  });

  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}

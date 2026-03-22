/**
 * /partner/google-onboarding
 *
 * Intermediate server-side page that runs immediately after a partner completes
 * Google OAuth.  Its sole job is to ensure the authenticated user has
 * role = "partner" in the database, then redirect to the partner dashboard.
 *
 * This is necessary because the NextAuth signIn callback has no way to know
 * whether a Google sign-in originated from the partner portal or the customer
 * portal — both use the same provider.  By routing partner Google OAuth through
 * this page (via callbackUrl) we can safely upgrade the role server-side.
 *
 * The page is intentionally excluded from middleware auth-protection so that
 * the fresh post-OAuth redirect reaches it without being blocked.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

export default async function PartnerGoogleOnboardingPage() {
  const session = await auth();

  // If no session, send to partner login
  if (!session?.user?.email) {
    redirect("/partner/login");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current role
    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", session.user.email)
      .maybeSingle();

    if (user && user.role !== "partner") {
      // Upgrade to partner
      await supabase
        .from("users")
        .update({ role: "partner" })
        .eq("id", user.id);
    }
  }

  // Redirect to partner dashboard — session cookie is already set by NextAuth
  redirect("/partner/dashboard");
}

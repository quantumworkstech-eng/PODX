/**
 * /partner/google-onboarding
 *
 * Server-side intermediate page for PARTNER Google OAuth.
 * 1. Verifies the user is authenticated.
 * 2. Appends "partner" to their DB role (supports multi-role; never overwrites).
 * 3. Renders <PartnerSessionRefresher> which triggers a client-side session
 *    refresh so the JWT cookie is updated with the new role BEFORE navigating
 *    to the partner dashboard (ensuring the middleware sees the correct role).
 *
 * The page is intentionally excluded from middleware auth-protection so that
 * the fresh post-OAuth redirect reaches it without being blocked.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { PartnerSessionRefresher } from "./SessionRefresher";

export default async function PartnerGoogleOnboardingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/partner/login");
  }

  // Append "partner" role to the user's existing roles in the DB.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", session.user.email)
      .maybeSingle();

    if (user) {
      const existing = ((user as any).role as string | null) || "user";
      const parts = existing.split(",").map((r: string) => r.trim()).filter(Boolean);
      if (!parts.includes("partner")) {
        parts.push("partner");
        await supabase
          .from("users")
          .update({ role: parts.join(",") })
          .eq("id", user.id);
      }
    }
  }

  // Render a client component that refreshes the NextAuth session (so the JWT
  // cookie is updated with the new role) and then navigates to the dashboard.
  return <PartnerSessionRefresher />;
}

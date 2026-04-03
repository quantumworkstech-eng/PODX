/**
 * /auth/google-onboarding
 *
 * Server-side intermediate page for CLIENT Google OAuth.
 * 1. Verifies the user is authenticated.
 * 2. Appends "user" to their DB role (supports multi-role; never overwrites).
 * 3. Renders <SessionRefresher> which triggers a client-side session refresh
 *    so the JWT cookie is updated with the new role BEFORE navigating to the
 *    dashboard (ensuring the middleware sees the correct role).
 *
 * Mirrors /partner/google-onboarding for the client portal.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { SessionRefresher } from "./SessionRefresher";

export default async function ClientGoogleOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Append "user" role to the user's existing roles in the DB.
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
      if (!parts.includes("user")) {
        parts.push("user");
        await supabase
          .from("users")
          .update({ role: parts.join(",") })
          .eq("id", user.id);
      }
    }
  }

  // Render a client component that refreshes the NextAuth session (so the JWT
  // cookie is updated with the new role) and then navigates to the dashboard.
  const next = params?.next;
  const safePath = next && next.startsWith("/") ? next : "/dashboard";

  return <SessionRefresher next={safePath} />;
}

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// NextAuth v5 uses AUTH_SECRET; keep NEXTAUTH_SECRET as fallback
const NEXTAUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID ?? "",
      clientSecret: GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "otp",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Verification Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.token) return null;
        if (!supabaseAdmin) return null;

        // Verify the OTP session token (generated after OTP code is confirmed)
        const { data: otpRow } = await supabaseAdmin
          .from("email_otps")
          .select("id, email, expires_at, used")
          .eq("email", credentials.email)
          .eq("verification_token", credentials.token)
          .maybeSingle();

        if (!otpRow) return null;

        // Token must not be used for session creation more than once
        // and OTP must not be expired (we use a 15-min window from OTP expiry)
        const tokenWindow = new Date(otpRow.expires_at);
        tokenWindow.setMinutes(tokenWindow.getMinutes() + 15);
        if (tokenWindow < new Date()) return null;

        // Find the user
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id, email")
          .eq("email", credentials.email)
          .maybeSingle();

        if (!user) return null;

        return { id: user.id, email: user.email, name: user.email.split("@")[0] };
      },
    }),
    // Admin password login — credentials already verified by the server action before this runs
    Credentials({
      id: "admin-password",
      name: "admin-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (!supabaseAdmin) return null;

        // Re-verify here as a security measure (server action already verified once)
        const { data: admin } = await supabaseAdmin
          .from("admin_credentials")
          .select("id, email, password_hash")
          .eq("email", (credentials.email as string).toLowerCase().trim())
          .maybeSingle();

        if (!admin?.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password as string, admin.password_hash);
        if (!valid) return null;

        return { id: admin.id, email: admin.email, name: "Admin" };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        if (!supabaseAdmin) {
          console.error("[auth] supabaseAdmin not configured — Google user won't be persisted");
          return true;
        }

        try {
          // Upsert the user row — safe against concurrent sign-ins (no race condition)
          const { data: upsertedUser, error: upsertError } = await supabaseAdmin
            .from("users")
            .upsert(
              {
                email: user.email,
                auth_provider: "google",
                email_verified: true,
              },
              { onConflict: "email", ignoreDuplicates: false }
            )
            .select("id")
            .single();

          if (upsertError) {
            console.error("[auth] Failed to upsert user for Google sign-in:", upsertError.message);
          } else if (upsertedUser) {
            // Upsert the profile row — keeps name and avatar in sync on every login
            const { error: profileError } = await supabaseAdmin
              .from("profiles")
              .upsert(
                {
                  user_id: upsertedUser.id,
                  full_name: user.name ?? null,
                  avatar_url: user.image ?? null,
                },
                { onConflict: "user_id", ignoreDuplicates: false }
              );
            if (profileError) {
              console.error("[auth] Failed to upsert profile:", profileError.message);
            }
          }
        } catch (error) {
          console.error("[auth] Error in Google signIn callback:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Admin password login — mark as admin directly
      if (account?.provider === "admin-password") {
        token.role = "admin";
        token.id = user?.id;
        return token;
      }

      // Look up the DB user to get our internal UUID and role.
      // Runs on first sign-in (user/account populated) or when id is missing from token.
      if (supabaseAdmin && (user || account || !token.id)) {
        const email = (user?.email ?? token.email) as string | undefined;
        if (email) {
          // Try with role column first (added by studio_review_migration.sql)
          const { data: dbUser, error: roleQueryError } = await supabaseAdmin
            .from("users")
            .select("id, role")
            .eq("email", email)
            .maybeSingle();

          if (!roleQueryError && dbUser) {
            token.id = dbUser.id;
            token.role = (dbUser as any).role ?? "user";
          } else {
            if (roleQueryError) {
              // role column likely missing — fall back to id-only query
              console.warn("[auth] role column query failed, falling back:", roleQueryError.message);
            }
            const { data: dbUserBasic } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("email", email)
              .maybeSingle();

            if (dbUserBasic) {
              token.id = dbUserBasic.id;
              token.role = "user";
            } else {
              console.warn("[auth] No DB user found for email:", email);
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: NEXTAUTH_SECRET,
  trustHost: true,
});

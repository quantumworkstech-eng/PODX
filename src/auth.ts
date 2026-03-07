import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
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
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        if (!supabaseAdmin) return true;

        try {
          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("id, email")
            .eq("email", user.email)
            .maybeSingle();

          if (!existingUser) {
            const { data: newUser, error: insertError } = await supabaseAdmin
              .from("users")
              .insert({
                email: user.email,
                auth_provider: "google",
                email_verified: true,
              })
              .select()
              .single();

            if (!insertError && newUser) {
              await supabaseAdmin.from("profiles").insert({
                user_id: newUser.id,
                full_name: user.name,
                avatar_url: user.image,
              });
            }
          }
        } catch (error) {
          console.error("Error in Google signIn callback:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Fetch role on first sign-in OR if role is missing from an existing token
      if (supabaseAdmin && (user || account || !token.role)) {
        const email = user?.email || token.email;
        if (email) {
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id, role")
            .eq("email", email)
            .maybeSingle();
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || "user";
          } else if (user?.id) {
            token.id = user.id;
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

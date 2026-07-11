import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth config — no Node.js-only modules (e.g. bcryptjs).
 *
 * Used in middleware (Edge Runtime) to verify NextAuth sessions without
 * importing the full auth setup (which pulls in bcryptjs and other Node APIs).
 * The main auth.ts file imports this config and extends it with Credentials
 * providers and Supabase callbacks.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: { strategy: "jwt" as const },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  /**
   * Middleware runs `NextAuth(authConfig)` only (Edge — no Supabase in jwt).
   * Without this, `token.role` / `token.id` from the encrypted JWT are never copied
   * onto `session.user`, so `request.auth.user.role` is always undefined and role
   * checks redirect partners to client signup (wrongRole).
   */
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id =
          (token as { id?: string }).id ?? (token.sub as string | undefined);
        (session.user as { id?: string; role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

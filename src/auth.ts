import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID ?? "",
      clientSecret: GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        return {
          id: `dev-${Date.now()}`,
          email: credentials.email as string,
          name: (credentials.email as string).split("@")[0],
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
          if (!supabaseAdmin) {
            console.log("⚠️ Supabase admin not configured, skipping user creation");
            return true;
          }

          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", user.email)
            .single();

          if (!existingUser) {
            const { data: newUser, error } = await supabaseAdmin
              .from("users")
              .insert({
                email: user.email,
                auth_provider: "google",
                email_verified: true,
              })
              .select()
              .single();

            if (error) {
              console.error("❌ Error creating user:", error);
            } else if (newUser) {
              await supabaseAdmin.from("profiles").insert({
                user_id: newUser.id,
                full_name: user.name,
                avatar_url: user.image,
              });
              console.log("✅ User created in Supabase:", newUser.id);
            }
          } else {
            console.log("✅ User already exists:", existingUser.id);
          }
        } catch (error) {
          console.error("❌ SignIn error:", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/partner/login",
    error: "/partner/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: NEXTAUTH_SECRET,
  trustHost: true,
});

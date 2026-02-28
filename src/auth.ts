import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔧 Auth Initialization:", {
  hasGoogleClientId: !!GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!GOOGLE_CLIENT_SECRET,
  hasNextAuthSecret: !!NEXTAUTH_SECRET,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_KEY,
});

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

console.log("🔧 Supabase Admin initialized:", !!supabaseAdmin);

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
      console.log("🔍 SignIn callback:", { provider: account?.provider, email: user?.email });
      
      if (account?.provider === "google" && user?.email) {
        console.log("🔍 Processing Google sign in for:", user.email);
        
        if (!supabaseAdmin) {
          console.error("❌ Supabase admin is null - service key not configured");
          return true;
        }

        try {
          // Check if user already exists
          const { data: existingUser, error: checkError } = await supabaseAdmin
            .from("users")
            .select("id, email")
            .eq("email", user.email)
            .maybeSingle();

          if (checkError) {
            console.error("❌ Error checking existing user:", checkError);
          }

          if (existingUser) {
            console.log("✅ User already exists in DB:", existingUser.id);
            return true;
          }

          // Create new user
          console.log("📝 Creating new user for:", user.email);
          const { data: newUser, error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
              email: user.email,
              auth_provider: "google",
              email_verified: true,
            })
            .select()
            .single();

          if (insertError) {
            console.error("❌ Error inserting user:", insertError);
          } else if (newUser) {
            console.log("✅ User created:", newUser.id);

            // Create profile
            const { error: profileError } = await supabaseAdmin
              .from("profiles")
              .insert({
                user_id: newUser.id,
                full_name: user.name,
                avatar_url: user.image,
              });

            if (profileError) {
              console.error("❌ Error creating profile:", profileError);
            } else {
              console.log("✅ Profile created");
            }
          }
        } catch (error) {
          console.error("❌ Exception in signIn:", error);
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

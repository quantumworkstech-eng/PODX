import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import pool from "@/db";

// Simple in-memory user store for fallback when database is unavailable
const devUsers: Map<string, { id: string; email: string; name: string; image?: string }> = new Map();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Try database authentication first
        try {
          const result = await pool.query(
            "SELECT u.*, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = $1",
            [email]
          );

          const user = result.rows[0];

          if (user && user.password_hash) {
            // TODO: Use bcrypt in production
            const isValid = password === user.password_hash;

            if (isValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.full_name,
              };
            }
          }
        } catch (error) {
          console.error("Database auth error:", error);
        }

        // Fallback for development: accept any email/password (min 6 chars)
        if (password.length >= 6) {
          return {
            id: `dev-${Date.now()}`,
            email: email,
            name: email.split("@")[0],
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Try database persistence first
        try {
          console.log("🔍 Checking if user exists:", user.email);
          
          // Check if user exists
          const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [user.email!]
          );

          if (existingUser.rows.length === 0) {
            console.log("📝 Creating new user...");
            
            // Create new user
            const newUser = await pool.query(
              "INSERT INTO users (email, auth_provider, email_verified) VALUES ($1, $2, $3) RETURNING *",
              [user.email, "google", true]
            );

            const userId = newUser.rows[0].id;
            console.log("✅ User created with ID:", userId);

            // Create profile
            await pool.query(
              "INSERT INTO profiles (user_id, full_name, avatar_url) VALUES ($1, $2, $3)",
              [userId, user.name, user.image]
            );
            console.log("✅ Profile created");

            // Assign podcaster role
            await pool.query(
              `INSERT INTO user_roles (user_id, role_id) 
               SELECT $1, id FROM roles WHERE name = 'podcaster'`,
              [userId]
            );
            console.log("✅ Role assigned");
          } else {
            console.log("✅ User already exists:", existingUser.rows[0].id);
          }

          return true;
        } catch (error) {
          console.error("❌ Google sign in error:", error);
          
          // Fallback to in-memory storage
          devUsers.set(user.email!, {
            id: `google-${Date.now()}`,
            email: user.email!,
            name: user.name ?? "",
            image: user.image ?? undefined,
          });
          console.log("⚠️ Using in-memory fallback");
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      
      // Get user ID from database or dev store
      if (!token.id && token.email) {
        // Check dev store first
        const devUser = devUsers.get(token.email);
        if (devUser) {
          token.id = devUser.id;
        } else {
          // Try database
          try {
            const result = await pool.query(
              "SELECT id FROM users WHERE email = $1",
              [token.email]
            );
            if (result.rows[0]) {
              token.id = result.rows[0].id;
            }
          } catch (error) {
            console.error("Error fetching user ID:", error);
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
});

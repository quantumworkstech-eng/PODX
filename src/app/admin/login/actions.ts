"use server";

import { signIn } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function adminSignIn(email: string, password: string): Promise<{ error: string } | never> {
  if (!supabaseAdmin) return { error: "DB not configured." };

  const { data: admin } = await supabaseAdmin
    .from("admin_credentials")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (!admin) return { error: "Not authorized." };
  if (!admin.password_hash) return { error: "Please set your password first." };

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return { error: "Incorrect password." };

  // This throws NEXT_REDIRECT — Next.js catches it and navigates to /admin
  await signIn("admin-password", { email, password, redirectTo: "/admin" });
}

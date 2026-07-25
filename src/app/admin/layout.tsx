import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { AdminSidebar } from "./AdminSidebar";

// Must match the secret used to sign the admin_session cookie (login/actions.ts)
// and verify it in middleware.ts — NextAuth v5 uses AUTH_SECRET.
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "admin-fallback-secret"
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Login page — render without sidebar or auth check
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Verify admin_session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  let email = "";
  try {
    const { payload } = await jwtVerify(token!, secret);
    if (payload.role !== "admin") throw new Error("Not admin");
    email = payload.email as string;
  } catch {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <AdminSidebar email={email} name={email.split("@")[0]}>
        {children}
      </AdminSidebar>
    </div>
  );
}

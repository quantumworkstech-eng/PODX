import { headers } from "next/headers";
import { auth } from "@/auth";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Login page — render without sidebar or auth check
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">Access Denied</p>
          <p className="text-white/40 text-sm mb-4">This account does not have admin privileges.</p>
          <a href="/admin/login" className="text-white/60 hover:text-white text-sm underline">Back to Admin Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <AdminSidebar email={session.user?.email ?? ""} name={session.user?.name ?? "Admin"}>
        {children}
      </AdminSidebar>
    </div>
  );
}

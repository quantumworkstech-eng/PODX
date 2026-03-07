"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Calendar, CreditCard,
  Star, UserCheck, BarChart3, Settings, LogOut, Menu, X, Shield, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminSignOut } from "./login/actions";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { id: "users", label: "Users", icon: Users, href: "/admin/users" },
  { id: "studios", label: "Studios", icon: Building2, href: "/admin/studios" },
  { id: "bookings", label: "Bookings", icon: Calendar, href: "/admin/bookings" },
  { id: "payments", label: "Payments", icon: CreditCard, href: "/admin/payments" },
  { id: "reviews", label: "Reviews", icon: Star, href: "/admin/reviews" },
  { id: "partners", label: "Partners", icon: UserCheck, href: "/admin/partners" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
];

export function AdminSidebar({ email, name, children }: { email: string; name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPage = menuItems.find((m) =>
    m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href)
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-r border-white/5 transform transition-transform lg:translate-x-0 flex-shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <Link href="/admin">
              <span className="text-2xl font-bold tracking-tight text-white">
                p<span className="text-[#D9FC67]">o</span>dX
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full font-medium">Admin</span>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{name || "Admin"}</p>
                <p className="text-white/40 text-xs truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        active ? "bg-red-500/10 text-red-400" : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => adminSignOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-h-screen flex flex-col overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">{currentPage?.label || "Admin"}</h1>
                <p className="text-white/40 text-sm">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">Admin Panel</span>
              </div>
              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4 text-white/40 hidden sm:block" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

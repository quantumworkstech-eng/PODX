"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Menu,
  X,
  BarChart3,
  Shield,
  Star,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

const menuItems = [
  { id: "dashboard", label: "Dashboard Overview", icon: BarChart3, href: "/partner/dashboard" },
  { id: "studios", label: "My Studios", icon: Building2, href: "/partner/studios" },
  { id: "bookings", label: "Bookings", icon: Calendar, href: "/partner/bookings" },
  { id: "reviews", label: "Reviews", icon: Star, href: "/partner/reviews" },
  { id: "policies", label: "Policies", icon: Shield, href: "/partner/policies" },
  { id: "earnings", label: "Earnings", icon: DollarSign, href: "/partner/earnings" },
  { id: "settings", label: "Settings", icon: Settings, href: "/partner/settings" },
];

interface PartnerDashboardProps {
  children: React.ReactNode;
}

export default function PartnerDashboardLayout({ children }: PartnerDashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeStudios, setActiveStudios] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAuthPage = pathname === "/partner/login" || pathname === "/partner/signup";

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (status === "unauthenticated" && !isAuthPage) {
      router.push("/partner/login");
    }
  }, [status, isAuthPage, router]);

  // Fetch live stats for sidebar/header once authenticated
  useEffect(() => {
    if (status !== "authenticated" || isAuthPage) return;

    fetch("/api/partner/studios")
      .then((r) => r.json())
      .then((sd) => {
        const studios: any[] = sd.studios || [];
        setActiveStudios(studios.filter((s) => s.status === "active").length);
      })
      .catch(console.error);
  }, [status, isAuthPage]);

  if (status === "loading" && !isAuthPage) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {!isAuthPage && (
        <div className="flex">
          {/* Sidebar */}
          <aside
            className={cn(
              "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-r border-white/5 transform transition-transform lg:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <Link href="/partner/dashboard">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    p<span className="text-[#D9FC67]">o</span>dX
                  </span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60">
                  <X className="w-5 h-5" />
                </button>
                <span className="hidden lg:block text-xs text-[#D9FC67] bg-[#D9FC67]/10 px-2 py-1 rounded-full">
                  Partner
                </span>
              </div>

              {/* User info */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {session?.user?.name || "Partner"}
                    </p>
                    <p className="text-white/40 text-xs truncate">{session?.user?.email || ""}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 overflow-y-auto">
                <ul className="space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          pathname === item.href
                            ? "bg-[#D9FC67]/10 text-[#D9FC67]"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-white/5">
                <Link href="/partner/studios/create">
                  <Button className="w-full bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Studio
                  </Button>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main */}
          <main className="flex-1 min-h-screen">
            <header className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      {menuItems.find((m) => pathname === m.href)?.label || "Dashboard"}
                    </h1>
                    <p className="text-white/40 text-sm">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#D9FC67]/10 rounded-full">
                    <div className="w-2 h-2 bg-[#D9FC67] rounded-full animate-pulse" />
                    <span className="text-xs text-[#D9FC67] font-medium">
                      {activeStudios} Active Studio{activeStudios !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <NotificationBell userEmail={session?.user?.email} />

                  <div ref={profileRef} className="relative pl-3 border-l border-white/10">
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                        {session?.user?.image ? (
                          <img src={session.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <Building2 className="w-4 h-4 text-black" />
                        )}
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-white/40 hidden sm:block transition-transform", profileOpen && "rotate-180")} />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-white text-sm font-medium truncate">{session?.user?.name || "Partner"}</p>
                          <p className="text-white/40 text-xs truncate">{session?.user?.email}</p>
                        </div>
                        <div className="p-1">
                          <Link
                            href="/partner/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          <button
                            onClick={() => { setProfileOpen(false); signOut({ callbackUrl: "/" }); }}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="p-6">{children}</div>
          </main>
        </div>
      )}
      {isAuthPage && <div className="min-h-screen">{children}</div>}
    </div>
  );
}

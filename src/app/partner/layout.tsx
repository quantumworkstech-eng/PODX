"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Bell,
  User,
  Plus,
  ChevronDown,
  Menu,
  X,
  BarChart3,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const menuItems = [
  { id: "dashboard", label: "Dashboard Overview", icon: BarChart3, href: "/partner/dashboard" },
  { id: "studios", label: "My Studios", icon: Building2, href: "/partner/studios" },
  { id: "bookings", label: "Bookings", icon: Calendar, href: "/partner/bookings" },
  { id: "policies", label: "Policies", icon: Shield, href: "/partner/policies" },
  { id: "earnings", label: "Earnings", icon: DollarSign, href: "/partner/earnings" },
  { id: "settings", label: "Settings", icon: Settings, href: "/partner/settings" },
];

interface Studio {
  id: string;
  name: string;
  cover_image: string;
  location: { area: string; city: string };
  price_per_hour: number;
  status: "active" | "inactive";
}

interface Booking {
  id: string;
  studio: { name: string };
  customer: { name: string; email: string };
  date: string;
  timeSlot: string;
  duration: number;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
}

interface PartnerPolicies {
  cancellation: {
    windowDays: number;
    refundPercent: number;
    deductionPercent: number;
  };
  reschedule: {
    windowDays: number;
    windowHours: number;
    deductionPercent: number;
  };
}

const PARTNER_STUDIOS_KEY = "partner_studios";
const PARTNER_BOOKINGS_KEY = "partner_bookings";
const PARTNER_POLICIES_KEY = "partner_policies";

const demoStudios: Studio[] = [
  {
    id: "1",
    name: "Nest Studio",
    cover_image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
    location: { area: "Andheri West", city: "Mumbai" },
    price_per_hour: 1500,
    status: "active",
  },
  {
    id: "2",
    name: "Apex Studio",
    cover_image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
    location: { area: "Bandra Kurla Complex", city: "Mumbai" },
    price_per_hour: 2500,
    status: "active",
  },
  {
    id: "3",
    name: "Eden Studio",
    cover_image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
    location: { area: "Connaught Place", city: "Delhi" },
    price_per_hour: 1800,
    status: "active",
  },
];

const demoBookings: Booking[] = [
  {
    id: "POD-ABC123",
    studio: { name: "Nest Studio" },
    customer: { name: "Rahul Sharma", email: "rahul@example.com" },
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "14:00",
    duration: 2,
    totalPrice: 11000,
    status: "confirmed",
  },
  {
    id: "POD-DEF456",
    studio: { name: "Apex Studio" },
    customer: { name: "Priya Patel", email: "priya@example.com" },
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "10:00",
    duration: 1,
    totalPrice: 5700,
    status: "pending",
  },
  {
    id: "POD-GHI789",
    studio: { name: "Eden Studio" },
    customer: { name: "Amit Kumar", email: "amit@example.com" },
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "16:00",
    duration: 3,
    totalPrice: 11500,
    status: "completed",
  },
  {
    id: "POD-JKL012",
    studio: { name: "Nest Studio" },
    customer: { name: "Sneha Gupta", email: "sneha@example.com" },
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "11:00",
    duration: 2,
    totalPrice: 8000,
    status: "cancelled",
  },
];

const defaultPolicies: PartnerPolicies = {
  cancellation: {
    windowDays: 3,
    refundPercent: 100,
    deductionPercent: 0,
  },
  reschedule: {
    windowDays: 1,
    windowHours: 24,
    deductionPercent: 10,
  },
};

interface PartnerDashboardProps {
  children: React.ReactNode;
}

export default function PartnerDashboardLayout({ children }: PartnerDashboardProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [policies, setPolicies] = useState<PartnerPolicies>(defaultPolicies);

  const isAuthPage = pathname === "/partner/login" || pathname === "/partner/signup";

  useEffect(() => {
    const storedStudios = localStorage.getItem(PARTNER_STUDIOS_KEY);
    if (storedStudios) {
      setStudios(JSON.parse(storedStudios));
    } else {
      setStudios(demoStudios);
      localStorage.setItem(PARTNER_STUDIOS_KEY, JSON.stringify(demoStudios));
    }

    const storedBookings = localStorage.getItem(PARTNER_BOOKINGS_KEY);
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings));
    } else {
      setBookings(demoBookings);
      localStorage.setItem(PARTNER_BOOKINGS_KEY, JSON.stringify(demoBookings));
    }

    const storedPolicies = localStorage.getItem(PARTNER_POLICIES_KEY);
    if (storedPolicies) {
      setPolicies(JSON.parse(storedPolicies));
    } else {
      setPolicies(defaultPolicies);
      localStorage.setItem(PARTNER_POLICIES_KEY, JSON.stringify(defaultPolicies));
    }
  }, []);

  const upcomingBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.date);
    return bookingDate >= new Date() && (b.status === "confirmed" || b.status === "pending");
  });

  const totalRevenue = bookings
    .filter((b) => b.status === "completed" || b.status === "confirmed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingEarnings = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const activeStudios = studios.filter((s) => s.status === "active").length;

  return (
    <div className="min-h-screen bg-[#09090b]">
      {!isAuthPage && (
      <div className="flex">
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-r border-white/5 transform transition-transform lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <Link href="/partner/dashboard" className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">
                  p<span className="text-[#D9FC67]">o</span>dX
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60">
                <X className="w-5 h-5" />
              </button>
              <span className="hidden lg:block text-xs text-[#D9FC67] bg-[#D9FC67]/10 px-2 py-1 rounded-full">Partner</span>
            </div>

            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">Partner Account</p>
                  <p className="text-white/40 text-xs truncate">partner@podx.com</p>
                </div>
              </div>
            </div>

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
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-h-screen">
          <header className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white">
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-white">
                    {menuItems.find((m) => pathname === m.href)?.label || "Dashboard"}
                  </h1>
                  <p className="text-white/40 text-sm">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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

                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {upcomingBookings.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#D9FC67] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                        {upcomingBookings.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <button onClick={() => setShowNotifications(false)} className="text-xs text-white/40 hover:text-white">Close</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {upcomingBookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                            <p className="text-white text-sm font-medium">New Booking</p>
                            <p className="text-white/40 text-xs mt-1">
                              {booking.customer.name} booked {booking.studio.name}
                            </p>
                            <p className="text-white/30 text-xs mt-2">
                              {new Date(booking.date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        {upcomingBookings.length === 0 && (
                          <div className="p-4 text-center text-white/40 text-sm">No new notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-black" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/40 hidden sm:block" />
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      )}
      {isAuthPage && <div className="min-h-screen">{children}</div>}
    </div>
  );
}

export { demoStudios, demoBookings, defaultPolicies };
export type { Studio, Booking, PartnerPolicies };

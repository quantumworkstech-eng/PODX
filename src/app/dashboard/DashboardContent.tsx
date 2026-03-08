"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Settings,
  LogOut,
  User,
  Plus,
  LayoutDashboard,
  ChevronDown,
  CreditCard,
  Home,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { UpcomingBookings } from "@/components/dashboard/bookings/UpcomingBookings";
import { PastBookings } from "@/components/dashboard/bookings/PastBookings";
import { BillingSection } from "@/components/dashboard/bookings/BillingSection";
import { SettingsSection } from "@/components/dashboard/bookings/SettingsSection";
import { DashboardOverview } from "@/components/dashboard/bookings/DashboardOverview";
import { BookingSuccessModal } from "@/components/dashboard/BookingSuccessModal";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "upcoming", label: "Upcoming Bookings", icon: Calendar },
  { id: "past", label: "Past Bookings", icon: Clock },
  { id: "billing", label: "Billing / Invoices", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

interface BookingData {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  participants: number;
  studio: {
    id: string;
    name: string;
    location: { area: string; city: string };
    cover_image: string;
    description?: string;
  };
  package: {
    id: string;
    name: string;
    price_per_hour: number;
  } | null;
  addOns: { id: string; name: string; price: number }[];
  totalPrice: number;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  paymentId: string;
  createdAt: string;
}

const BOOKINGS_STORAGE_KEY = "podx_bookings";

export default function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newBooking, setNewBooking] = useState<BookingData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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

  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        window.location.href = "/auth/login?callbackUrl=/dashboard";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    // Try to load from the Supabase API first, fall back to localStorage + demo
    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const { bookings: apiBookings } = await res.json();
          if (apiBookings && apiBookings.length > 0) {
            const sorted = [...apiBookings].sort((a: BookingData, b: BookingData) => {
              const aDate = new Date(a.date).getTime();
              const bDate = new Date(b.date).getTime();
              const now = Date.now();
              const aUp = aDate >= now;
              const bUp = bDate >= now;
              if (aUp && bUp) return aDate - bDate;
              if (!aUp && !bUp) return bDate - aDate;
              return aUp ? -1 : 1;
            });
            setBookings(sorted);
            return;
          }
        }
      } catch {
        /* Network or API error — fall through to localStorage */
      }

      // Fallback: localStorage only (no demo data)
      const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as BookingData[];
          parsed.sort((a: BookingData, b: BookingData) => {
            const aDate = new Date(a.date).getTime();
            const bDate = new Date(b.date).getTime();
            const now = Date.now();
            const aUp = aDate >= now;
            const bUp = bDate >= now;
            if (aUp && bUp) return aDate - bDate;
            if (!aUp && !bUp) return bDate - aDate;
            return aUp ? -1 : 1;
          });
          setBookings(parsed);
        } catch { /* ignore malformed data */ }
      }
    }

    loadBookings();
  }, []);

  // Handle ?booking=success from payment redirect
  useEffect(() => {
    if (searchParams.get("booking") === "success") {
      const stored = sessionStorage.getItem("podx_new_booking");
      if (stored) {
        try {
          const booking = JSON.parse(stored) as BookingData;
          setNewBooking(booking);
          setShowSuccessModal(true);
          setActiveMenu("upcoming");
          sessionStorage.removeItem("podx_new_booking");
        } catch { /* ignore */ }
      }
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const upcomingBookings = bookings
    .filter((b) => {
      if (!b.date) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= new Date() && (b.status === "confirmed" || b.status === "pending");
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // nearest first

  const pastBookings = bookings
    .filter((b) => {
      if (!b.date) return false;
      const bookingDate = new Date(b.date);
      return bookingDate < new Date() || b.status === "completed" || b.status === "cancelled";
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // most recent first

  const handleCancelBooking = async (bookingId: string) => {
    // Optimistic UI update
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    setBookings(updated);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));

    // Persist to Supabase
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
    } catch {
      /* Already updated locally — ignore API failure */
    }
  };

  const handleRescheduleBooking = async (
    bookingId: string,
    newDate: Date,
    newTime: string
  ) => {
    // Optimistic UI update
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, date: newDate.toISOString(), timeSlot: newTime } : b
    );
    setBookings(updated);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));

    // Persist to Supabase
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          newDate: newDate.toISOString(),
          newTimeSlot: newTime,
        }),
      });
    } catch {
      /* Already updated locally — ignore API failure */
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setNewBooking(null);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <DashboardOverview
            upcomingBookings={upcomingBookings}
            pastBookings={pastBookings}
            onNavigate={setActiveMenu}
          />
        );
      case "upcoming":
        return (
          <UpcomingBookings
            bookings={upcomingBookings}
            onCancel={handleCancelBooking}
            onReschedule={handleRescheduleBooking}
          />
        );
      case "past":
        return <PastBookings bookings={pastBookings} />;
      case "billing":
        return <BillingSection bookings={pastBookings} />;
      case "settings":
        return <SettingsSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="flex">
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-r border-white/5 transform transition-transform lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/5">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">
                  p<span className="text-[#D9FC67]">o</span>dX
                </span>
              </Link>
            </div>

            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                  <User className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {session.user?.name || "User"}
                  </p>
                  <p className="text-white/40 text-xs truncate">{session.user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveMenu(item.id);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        activeMenu === item.id
                          ? "bg-[#D9FC67]/10 text-[#D9FC67]"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t border-white/5">
              <Link href="/book">
                <Button className="w-full bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Book Studio
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

        <main className="flex-1 min-h-screen">
          <header className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-white">
                    {menuItems.find((m) => m.id === activeMenu)?.label || "Dashboard"}
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
                <div className="relative">
                  <NotificationBell userEmail={session?.user?.email} />
                </div>

                <div ref={profileRef} className="relative pl-3 border-l border-white/10">
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", profileOpen && "rotate-180")} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-white text-sm font-medium truncate">{session?.user?.name || "User"}</p>
                        <p className="text-white/40 text-xs truncate">{session?.user?.email}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => { setActiveMenu("settings"); setProfileOpen(false); }}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
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

          <div className="p-6">{renderContent()}</div>
        </main>
      </div>

      {/* Booking success modal */}
      {showSuccessModal && newBooking && (
        <BookingSuccessModal booking={newBooking} onClose={handleCloseSuccessModal} />
      )}
    </div>
  );
}

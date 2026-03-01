"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Settings,
  LogOut,
  Bell,
  User,
  Plus,
  LayoutDashboard,
  ChevronDown,
  CreditCard,
  Home,
} from "lucide-react";
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

const demoBookings: BookingData[] = [
  {
    id: "POD-ABC123",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "14:00",
    duration: 2,
    participants: 3,
    studio: {
      id: "1",
      name: "Nest Studio",
      location: { area: "Andheri West", city: "Mumbai" },
      cover_image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
      description: "Fireside, Cozy, Light & Airy",
    },
    package: { id: "recording-mix", name: "Recording + Live Mix", price_per_hour: 500 },
    addOns: [
      { id: "thumbnail", name: "YouTube Thumbnail", price: 1500 },
      { id: "episode-edit", name: "Episode Editing", price: 3500 },
    ],
    totalPrice: 11000,
    status: "confirmed",
    paymentId: "PAY-XYZ789",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "POD-DEF456",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "10:00",
    duration: 1,
    participants: 2,
    studio: {
      id: "2",
      name: "Apex Studio",
      location: { area: "Bandra Kurla Complex", city: "Mumbai" },
      cover_image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
      description: "Versatile, Industrial, Roundtables",
    },
    package: { id: "recording-edit", name: "Recording + Professional Edit", price_per_hour: 1200 },
    addOns: [],
    totalPrice: 5700,
    status: "pending",
    paymentId: "PAY-PENDING",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "POD-GHI789",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "16:00",
    duration: 3,
    participants: 4,
    studio: {
      id: "3",
      name: "Eden Studio",
      location: { area: "Connaught Place", city: "Delhi" },
      cover_image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
      description: "Urban Jungle, Moody, RGB Lighting",
    },
    package: { id: "recording", name: "Recording", price_per_hour: 0 },
    addOns: [{ id: "reels", name: "Reels", price: 2500 }],
    totalPrice: 11500,
    status: "completed",
    paymentId: "PAY-COMP123",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newBooking, setNewBooking] = useState<BookingData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        window.location.href = "/auth/login?callbackUrl=/dashboard";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    let parsed: BookingData[] = [];
    if (stored) {
      try { parsed = JSON.parse(stored); } catch { parsed = []; }
    }

    if (parsed.length > 0) {
      const all = [...parsed, ...demoBookings];
      const unique = all.filter(
        (b, idx, self) => idx === self.findIndex((x) => x.id === b.id)
      );
      // Sort upcoming nearest-first, past most-recent-first
      unique.sort((a, b) => {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        const now = Date.now();
        const aUp = aDate >= now;
        const bUp = bDate >= now;
        if (aUp && bUp) return aDate - bDate;
        if (!aUp && !bUp) return bDate - aDate;
        return aUp ? -1 : 1;
      });
      setBookings(unique);
    } else {
      setBookings(demoBookings);
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(demoBookings));
    }
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
          setNotifications((n) => n + 1);
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

  const handleCancelBooking = (bookingId: string) => {
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    setBookings(updated);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleRescheduleBooking = (bookingId: string, newDate: Date, newTime: string) => {
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, date: newDate.toISOString(), timeSlot: newTime } : b
    );
    setBookings(updated);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
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
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#D9FC67] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <button
                          onClick={() => {
                            setNotifications(0);
                            setShowNotifications(false);
                          }}
                          className="text-xs text-white/40 hover:text-white"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                          <p className="text-white text-sm font-medium">Booking Confirmed</p>
                          <p className="text-white/40 text-xs mt-1">
                            Your booking at Nest Studio is confirmed
                          </p>
                          <p className="text-white/30 text-xs mt-2">2 hours ago</p>
                        </div>
                        <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                          <p className="text-white text-sm font-medium">Reminder</p>
                          <p className="text-white/40 text-xs mt-1">
                            Your session is in 2 days
                          </p>
                          <p className="text-white/30 text-xs mt-2">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                    <User className="w-4 h-4 text-black" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/40" />
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

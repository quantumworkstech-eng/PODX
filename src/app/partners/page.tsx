"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Star,
  TrendingUp,
  Calendar,
  CreditCard,
  Users,
  BarChart3,
  Globe,
  Palette,
  Zap,
  Shield,
  ChevronDown,
  Mic,
  Building2,
  Check,
  IndianRupee,
  Clock,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Play,
  Sparkles,
  Menu,
  X,
  Layers,
  Bell,
  Settings,
  PieChart,
  BookOpen,
  BadgeCheck,
  ArrowUpRight,
  Quote,
} from "lucide-react";

// ─── FAQ data ────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "How do I get bookings through Yanisa Studios?",
    a: "Once you list your studio, it appears in Yanisa Studios's search results and your own branded booking page. Clients can find you, check availability, and book directly — no back-and-forth required. You also get your own shareable link to promote on social media.",
  },
  {
    q: "Can I use my own branding?",
    a: "Yes! With the white-label feature, you get a fully branded booking page at yourstudio.podx.com or even your own custom domain. Your logo, colors, and studio name — clients never see the Yanisa Studios backend.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed securely via Razorpay. Clients pay online at booking time and the funds are settled directly to your registered bank account. You get real-time earnings tracking in your dashboard.",
  },
  {
    q: "Does Yanisa Studios charge a commission?",
    a: "Yanisa Studios does not charge per-booking commissions. You pay a flat monthly subscription for the platform. This means the more you earn, the better the deal gets for you.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. No lock-in contracts. Cancel any time from your billing settings. Your studio listing stays active until the end of your current billing period.",
  },
  {
    q: "How long does it take to set up?",
    a: "Most studio owners are live within 30 minutes. Sign up, add your studio details, set pricing and availability, and you're ready to receive bookings.",
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Arjun Mehta",
    role: "Studio Owner · Mumbai",
    quote:
      "Before Yanisa Studios I was managing bookings over WhatsApp. Now I get 15–20 bookings a month automatically. My revenue doubled in 60 days.",
    stars: 5,
    initials: "AM",
  },
  {
    name: "Priya Sharma",
    role: "Podcast Studio · Bangalore",
    quote:
      "The white-label feature is a game changer. My clients think I built a custom booking app. It looks so professional — I've won 3 corporate clients just from sharing the link.",
    stars: 5,
    initials: "PS",
  },
  {
    name: "Rohan Kapoor",
    role: "Media Studio · Delhi",
    quote:
      "The analytics dashboard showed me that Friday evenings were my peak. I adjusted pricing and now earn 30% more without any extra marketing.",
    stars: 5,
    initials: "RK",
  },
];

// ─── Pricing plans ───────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    highlight: false,
    description: "Perfect for listing your first studio and testing the platform.",
    features: [
      "1 studio listing",
      "Online booking page",
      "Basic analytics",
      "Razorpay payments",
      "Email support",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: "₹1,999",
    period: "per month",
    highlight: true,
    description: "The complete toolkit for growing your studio business.",
    features: [
      "Up to 5 studio listings",
      "White-label branded website",
      "Custom domain support",
      "Advanced analytics",
      "Client management",
      "Coupon & discount engine",
      "Priority support",
    ],
    cta: "Start Pro Trial",
  },
  {
    name: "Enterprise",
    price: "₹4,999",
    period: "per month",
    highlight: false,
    description: "For studio networks and multi-location operations.",
    features: [
      "Unlimited studio listings",
      "Everything in Pro",
      "Multi-location management",
      "Custom email branding",
      "Dedicated account manager",
      "SLA-backed support",
      "Custom integrations",
    ],
    cta: "Talk to Sales",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function PartnersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setStickyVisible(y > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ─── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/95 backdrop-blur-xl border-b border-white/8"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D9FC67] flex items-center justify-center">
                <Mic className="w-4 h-4 text-black" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Pod<span className="text-[#D9FC67]">X</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {[
                { label: "How it Works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/partner/login" className="hidden sm:block">
                <button className="text-sm text-white/70 hover:text-white px-4 py-2 transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/partner/signup">
                <button className="bg-[#D9FC67] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#E8FF8A] transition-all">
                  Become a Partner
                </button>
              </Link>
              <button
                className="lg:hidden text-white/70 hover:text-white p-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-black/98 border-t border-white/8 px-4 py-6 space-y-4">
            {[
              { label: "How it Works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block text-white/70 hover:text-white py-2 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/8 flex flex-col gap-2">
              <Link href="/partner/login">
                <button className="w-full text-sm text-white/70 border border-white/10 rounded-xl py-2.5 hover:bg-white/5 transition-all">
                  Sign In
                </button>
              </Link>
              <Link href="/partner/signup">
                <button className="w-full bg-[#D9FC67] text-black text-sm font-semibold rounded-xl py-2.5 hover:bg-[#E8FF8A] transition-all">
                  Start Free
                </button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 overflow-hidden"
      >
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#D9FC67]/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#D9FC67]/5 rounded-full blur-[100px]" />
        </div>

        {/* Badge */}
        <div className="relative mb-6 inline-flex items-center gap-2 bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-full px-4 py-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D9FC67]" />
          <span className="text-[#D9FC67] text-xs font-semibold tracking-wider uppercase">
            Partner Program — Now Open
          </span>
        </div>

        {/* Headline */}
        <h1 className="relative text-center font-bold tracking-tight text-white leading-[1.1] max-w-5xl">
          <span className="block text-4xl sm:text-5xl lg:text-7xl mb-2">
            Turn Your Podcast Studio
          </span>
          <span className="block text-4xl sm:text-5xl lg:text-7xl bg-gradient-to-r from-[#D9FC67] via-[#E8FF8A] to-[#B8E050] bg-clip-text text-transparent">
            into a Revenue Machine
          </span>
        </h1>

        <p className="relative mt-6 text-center text-white/60 text-lg sm:text-xl max-w-2xl leading-relaxed">
          Get more bookings, manage clients effortlessly, and grow your studio
          business with Yanisa Studios — India&apos;s podcast studio marketplace platform.
        </p>

        {/* CTA Buttons */}
        <div className="relative mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/partner/signup">
            <button className="group flex items-center gap-2 bg-[#D9FC67] text-black font-bold px-8 py-4 rounded-2xl text-base hover:bg-[#E8FF8A] transition-all shadow-[0_0_40px_#D9FC6740]">
              Start Listing Your Studio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <button className="group flex items-center gap-2 border border-white/15 text-white/80 font-medium px-8 py-4 rounded-2xl text-base hover:bg-white/5 hover:border-white/25 transition-all">
            <Play className="w-4 h-4 text-[#D9FC67]" />
            Book a Demo
          </button>
        </div>

        {/* Trust signals */}
        <div className="relative mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
          {["No commission fees", "Setup in 30 minutes", "Cancel anytime"].map(
            (t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D9FC67]" />
                {t}
              </span>
            )
          )}
        </div>

        {/* Dashboard Mockup */}
        <div className="relative mt-16 w-full max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden shadow-[0_40px_100px_#D9FC6715]">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[#111111]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              <div className="ml-4 flex-1 bg-white/5 rounded-lg h-6 max-w-xs" />
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="hidden sm:flex flex-col w-52 border-r border-white/8 bg-[#0D0D0D] py-6 px-3 gap-1">
                {[
                  { icon: BarChart3, label: "Dashboard", active: true },
                  { icon: Building2, label: "My Studios", active: false },
                  { icon: Calendar, label: "Bookings", active: false },
                  { icon: Users, label: "Clients", active: false },
                  { icon: PieChart, label: "Analytics", active: false },
                  { icon: IndianRupee, label: "Earnings", active: false },
                  { icon: Globe, label: "White-Label", active: false },
                  { icon: Settings, label: "Settings", active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? "bg-[#D9FC67]/15 text-[#D9FC67]"
                        : "text-white/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </div>
                ))}
              </div>

              {/* Main dashboard area */}
              <div className="flex-1 p-5 bg-[#080808] min-h-[400px]">
                {/* Top header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-white/40 mb-0.5">Good morning,</p>
                    <p className="text-sm font-semibold text-white">
                      Mumbai Podcast Studio
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#D9FC67] flex items-center justify-center text-black text-xs font-bold">
                      MS
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: "This Month",
                      value: "₹82,500",
                      change: "+23%",
                      icon: IndianRupee,
                      green: true,
                    },
                    {
                      label: "Bookings",
                      value: "47",
                      change: "+12",
                      icon: Calendar,
                      green: true,
                    },
                    {
                      label: "Clients",
                      value: "34",
                      change: "+8",
                      icon: Users,
                      green: false,
                    },
                    {
                      label: "Occupancy",
                      value: "78%",
                      change: "↑ 5%",
                      icon: TrendingUp,
                      green: true,
                    },
                  ].map(({ label, value, change, icon: Icon, green }) => (
                    <div
                      key={label}
                      className="bg-[#111111] border border-white/6 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white/40 text-[10px]">{label}</p>
                        <Icon className="w-3 h-3 text-white/20" />
                      </div>
                      <p className="text-white text-sm font-bold">{value}</p>
                      <p
                        className={`text-[10px] mt-0.5 ${green ? "text-[#D9FC67]" : "text-white/40"}`}
                      >
                        {change}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart bar */}
                <div className="bg-[#111111] border border-white/6 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/70 text-xs font-medium">
                      Bookings this week
                    </p>
                    <span className="text-[#D9FC67] text-xs">View All →</span>
                  </div>
                  <div className="flex items-end gap-2 h-16">
                    {[40, 65, 50, 80, 95, 70, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md"
                        style={{
                          height: `${h}%`,
                          background:
                            i === 4
                              ? "#D9FC67"
                              : i === 6
                                ? "rgba(217,252,103,0.6)"
                                : "rgba(217,252,103,0.15)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d) => (
                        <span key={d} className="flex-1 text-center text-[9px] text-white/25">
                          {d}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Recent bookings */}
                <div className="bg-[#111111] border border-white/6 rounded-xl p-3">
                  <p className="text-white/70 text-xs font-medium mb-3">
                    Upcoming Sessions
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        name: "Rohit Anand",
                        time: "Today, 2:00 PM",
                        amt: "₹1,500",
                        status: "confirmed",
                      },
                      {
                        name: "Creative Media Co.",
                        time: "Today, 5:30 PM",
                        amt: "₹3,000",
                        status: "confirmed",
                      },
                      {
                        name: "Meera Podcast",
                        time: "Tomorrow, 11 AM",
                        amt: "₹2,000",
                        status: "pending",
                      },
                    ].map((b) => (
                      <div
                        key={b.name}
                        className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0"
                      >
                        <div>
                          <p className="text-white/80 text-[10px] font-medium">
                            {b.name}
                          </p>
                          <p className="text-white/30 text-[9px]">{b.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D9FC67] text-[10px] font-semibold">
                            {b.amt}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              b.status === "confirmed"
                                ? "bg-[#D9FC67]/15 text-[#D9FC67]"
                                : "bg-white/8 text-white/40"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-2 sm:right-8 bg-[#D9FC67] text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
            ₹82,500 earned this month 🎉
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ───────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/8 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Studio Partners" },
              { value: "₹2Cr+", label: "Paid to Partners" },
              { value: "15,000+", label: "Bookings Processed" },
              { value: "4.9★", label: "Partner Satisfaction" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl lg:text-4xl font-bold text-[#D9FC67] mb-1">
                  {value}
                </p>
                <p className="text-white/50 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
              The Problem
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
              Running a podcast studio is harder than it should be
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: Calendar,
                title: "Inconsistent bookings",
                desc: "You rely on word-of-mouth and Instagram DMs. Some weeks are full, others are empty — no predictability.",
              },
              {
                icon: Clock,
                title: "Manual coordination chaos",
                desc: "WhatsApp, phone calls, spreadsheets — each booking takes 15+ minutes of back-and-forth just to confirm.",
              },
              {
                icon: IndianRupee,
                title: "Revenue leakage",
                desc: "No-shows, last-minute cancellations, and informal payments mean money you earn on paper doesn't always reach your bank.",
              },
              {
                icon: Globe,
                title: "No professional online presence",
                desc: "Your studio deserves a proper booking page. Without one, you look less serious than competitors with polished websites.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-5 bg-[#0E0E0E] border border-white/6 rounded-2xl p-6 hover:border-white/12 transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/15 transition-colors">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOLUTION SECTION ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#060606] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D9FC67]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-4">
                The Solution
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Yanisa Studios is your complete studio{" "}
                <span className="text-[#D9FC67]">operating system</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                One platform to manage bookings, clients, payments, and your
                online presence. Built specifically for podcast studios in India.
              </p>
              <div className="space-y-3">
                {[
                  "Online booking system — clients book 24/7",
                  "White-label branded website with your domain",
                  "Razorpay payment integration — get paid instantly",
                  "Client CRM — track relationships and history",
                  "Analytics dashboard — know what&apos;s working",
                  "Automated reminders — cut no-shows by 60%",
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#D9FC67] flex-shrink-0 mt-0.5" />
                    <span
                      className="text-white/70 text-sm"
                      dangerouslySetInnerHTML={{ __html: feat }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/partner/signup">
                  <button className="group flex items-center gap-2 bg-[#D9FC67] text-black font-bold px-7 py-3.5 rounded-xl hover:bg-[#E8FF8A] transition-all">
                    Start for Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Calendar,
                  label: "Smart Booking",
                  desc: "Automated scheduling with real-time availability",
                },
                {
                  icon: CreditCard,
                  label: "Instant Payments",
                  desc: "Razorpay-powered checkout, direct to your bank",
                },
                {
                  icon: Globe,
                  label: "White-Label Site",
                  desc: "Your own branded booking page in minutes",
                },
                {
                  icon: BarChart3,
                  label: "Analytics",
                  desc: "Revenue, occupancy and peak-time insights",
                },
                {
                  icon: Users,
                  label: "Client CRM",
                  desc: "Full client history, notes and communication",
                },
                {
                  icon: Zap,
                  label: "Automation",
                  desc: "Reminders, confirmations, invoices — hands-free",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="bg-[#0D0D0D] border border-white/6 rounded-2xl p-5 hover:border-[#D9FC67]/20 hover:bg-[#D9FC67]/3 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center mb-3 group-hover:bg-[#D9FC67]/20 transition-colors">
                    <Icon className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">{label}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Live in 5 simple steps
            </h2>
            <p className="mt-4 text-white/50 max-w-lg mx-auto">
              From zero to a fully live, bookable studio — in under 30 minutes.
            </p>
          </div>

          <div className="relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[calc(10%+20px)] right-[calc(10%+20px)] h-px bg-gradient-to-r from-transparent via-[#D9FC67]/20 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  step: "01",
                  icon: BadgeCheck,
                  title: "Sign Up as Partner",
                  desc: "Create your partner account in 2 minutes. No credit card needed.",
                },
                {
                  step: "02",
                  icon: Building2,
                  title: "Add Your Studio",
                  desc: "Upload photos, write a description, and showcase your equipment.",
                },
                {
                  step: "03",
                  icon: Clock,
                  title: "Set Pricing & Availability",
                  desc: "Choose your rates, block off personal time, set booking rules.",
                },
                {
                  step: "04",
                  icon: Calendar,
                  title: "Receive Bookings",
                  desc: "Clients find and book your studio online — you get notified instantly.",
                },
                {
                  step: "05",
                  icon: IndianRupee,
                  title: "Get Paid",
                  desc: "Payments are collected upfront and settled to your bank account.",
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="relative flex flex-col items-center text-center group">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-[#111111] border border-white/8 flex items-center justify-center group-hover:border-[#D9FC67]/40 group-hover:bg-[#D9FC67]/5 transition-all">
                      <Icon className="w-8 h-8 text-[#D9FC67]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D9FC67] flex items-center justify-center">
                      <span className="text-black text-[10px] font-black">{step}</span>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link href="/partner/signup">
              <button className="group inline-flex items-center gap-2 bg-[#D9FC67] text-black font-bold px-8 py-4 rounded-2xl text-base hover:bg-[#E8FF8A] transition-all shadow-[0_0_30px_#D9FC6730]">
                Start Your Setup Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 bg-[#060606]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Everything you need to run a{" "}
              <span className="text-[#D9FC67]">pro studio</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "Smart Booking Calendar",
                desc: "Real-time availability management. Block time, set buffer between sessions, handle back-to-back bookings with ease.",
                tag: "Core",
              },
              {
                icon: IndianRupee,
                title: "Automated Payments",
                desc: "Clients pay 100% upfront via Razorpay. No chasing invoices. Funds hit your bank on schedule.",
                tag: "Popular",
              },
              {
                icon: Globe,
                title: "White-Label Website",
                desc: "Your own branded booking page — custom logo, colors, domain. Clients see your brand, not ours.",
                tag: "Pro",
              },
              {
                icon: Users,
                title: "Client Management",
                desc: "Full client profiles with booking history, notes, preferences, and spend tracking.",
                tag: "Core",
              },
              {
                icon: BarChart3,
                title: "Analytics & Insights",
                desc: "Revenue trends, peak hours, top clients, occupancy rates — know your business numbers cold.",
                tag: "Core",
              },
              {
                icon: Bell,
                title: "Automated Reminders",
                desc: "Email & SMS reminders sent to clients before their session. Reduce no-shows by up to 60%.",
                tag: "Popular",
              },
              {
                icon: Palette,
                title: "Custom Branding",
                desc: "Upload your logo, choose your color palette, set your own domain. 100% your brand.",
                tag: "Pro",
              },
              {
                icon: Layers,
                title: "Add-On Services",
                desc: "Sell video editing, photography, or production packages as bookable add-ons.",
                tag: "Core",
              },
              {
                icon: Shield,
                title: "Cancellation Policies",
                desc: "Set your own cancellation and rescheduling rules. Protect your revenue automatically.",
                tag: "Core",
              },
            ].map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="bg-[#0D0D0D] border border-white/6 rounded-2xl p-6 hover:border-[#D9FC67]/20 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tag === "Popular"
                        ? "bg-[#D9FC67]/15 text-[#D9FC67]"
                        : tag === "Pro"
                          ? "bg-white/8 text-white/50"
                          : "bg-white/5 text-white/30"
                    }`}
                  >
                    {tag}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#D9FC67]/8 border border-[#D9FC67]/15 flex items-center justify-center mb-5 group-hover:bg-[#D9FC67]/15 transition-colors">
                  <Icon className="w-6 h-6 text-[#D9FC67]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHITE-LABEL FEATURE ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D9FC67]/6 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* White-label mockup */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl border border-[#D9FC67]/15 bg-[#0A0A0A] overflow-hidden shadow-[0_0_60px_#D9FC6710]">
                {/* Browser chrome */}
                <div className="bg-[#111] border-b border-white/8 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                  </div>
                  <div className="flex-1 bg-white/6 rounded-lg h-6 flex items-center px-3">
                    <span className="text-white/30 text-[10px]">
                      🔒 yourstudio.podx.com
                    </span>
                  </div>
                </div>

                {/* Branded page preview */}
                <div className="p-5 bg-gradient-to-br from-[#0f0f0f] to-[#161616]">
                  {/* Studio nav */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white text-sm font-bold">
                        Mumbai Podcast Studio
                      </span>
                    </div>
                    <button className="text-[10px] bg-purple-500 text-white px-3 py-1 rounded-lg font-medium">
                      Book Now
                    </button>
                  </div>

                  {/* Hero preview */}
                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-5 border border-purple-500/15 mb-4">
                    <p className="text-white/40 text-[10px] mb-1">
                      Professional Podcast Studio · Mumbai
                    </p>
                    <h3 className="text-white font-bold text-sm mb-3">
                      Record Your Story in Style
                    </h3>
                    <div className="flex gap-2">
                      <button className="text-[10px] bg-purple-500 text-white px-3 py-1.5 rounded-lg">
                        Book a Session
                      </button>
                      <button className="text-[10px] border border-white/15 text-white/70 px-3 py-1.5 rounded-lg">
                        View Studios
                      </button>
                    </div>
                  </div>

                  {/* Studios row */}
                  <div className="grid grid-cols-3 gap-2">
                    {["Studio A", "Studio B", "Studio C"].map((s, i) => (
                      <div
                        key={s}
                        className="rounded-xl bg-white/4 border border-white/6 p-2.5"
                      >
                        <div
                          className="w-full h-10 rounded-lg mb-1.5"
                          style={{
                            background: `linear-gradient(135deg, ${
                              i === 0
                                ? "#7c3aed, #4f46e5"
                                : i === 1
                                  ? "#be185d, #9333ea"
                                  : "#0891b2, #4f46e5"
                            })`,
                          }}
                        />
                        <p className="text-white/70 text-[9px] font-medium">
                          {s}
                        </p>
                        <p className="text-purple-400 text-[9px]">₹800/hr</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom domain badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "yourstudio.podx.com",
                  "yourstudio.com (custom domain)",
                ].map((d) => (
                  <div
                    key={d}
                    className="flex items-center gap-1.5 bg-[#D9FC67]/8 border border-[#D9FC67]/15 rounded-lg px-3 py-1.5 text-[#D9FC67] text-xs"
                  >
                    <Globe className="w-3 h-3" />
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-full px-4 py-1.5 mb-5">
                <Sparkles className="w-3.5 h-3.5 text-[#D9FC67]" />
                <span className="text-[#D9FC67] text-xs font-semibold">
                  White-Label — Big Selling Point
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Your own branded{" "}
                <span className="text-[#D9FC67]">booking website</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Clients see{" "}
                <span className="text-white font-medium">your brand</span>, not
                Yanisa Studios. Get a professional booking website with your logo, colors,
                and domain — no developer needed.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: Palette,
                    title: "Custom logo & colors",
                    desc: "Match your exact brand identity down to the hex code.",
                  },
                  {
                    icon: Globe,
                    title: "Custom domain support",
                    desc: "Use yourstudio.podx.com or point your own domain.",
                  },
                  {
                    icon: BookOpen,
                    title: "Fully customizable pages",
                    desc: "Edit headlines, descriptions, and feature lists — no code.",
                  },
                  {
                    icon: Mail,
                    title: "Branded email communications",
                    desc: "Booking confirmations sent from your studio's email.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 border border-[#D9FC67]/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#D9FC67]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{title}</p>
                      <p className="text-white/50 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EARNINGS SECTION ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#060606] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#D9FC67]/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
              Earning Potential
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              How much can you earn?
            </h2>
            <p className="mt-4 text-white/50 max-w-lg mx-auto">
              Real numbers from studios already on the platform.
            </p>
          </div>

          {/* Earnings calculator card */}
          <div className="bg-gradient-to-br from-[#111111] to-[#0D0D0D] border border-[#D9FC67]/15 rounded-3xl p-8 lg:p-12 mb-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-white/50 text-sm mb-6 font-medium uppercase tracking-wider">
                  Example Calculation
                </p>
                <div className="space-y-5">
                  {[
                    { label: "Hourly rate", value: "₹800/hour", sub: "competitive for metro cities" },
                    { label: "Sessions per day", value: "5 sessions", sub: "avg. 2 hours each" },
                    { label: "Daily earnings", value: "₹8,000/day", sub: "", highlight: false },
                    { label: "Working days/month", value: "22 days", sub: "" },
                  ].map(({ label, value, sub, highlight }) => (
                    <div key={label} className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${highlight ? "bg-[#D9FC67]/5 -mx-3 px-3 rounded-xl" : ""}`}>
                      <div>
                        <p className="text-white/70 text-sm">{label}</p>
                        {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
                      </div>
                      <p className="text-white font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center lg:text-left">
                <div className="inline-block bg-[#D9FC67]/8 border border-[#D9FC67]/20 rounded-3xl p-8 text-center w-full">
                  <p className="text-white/50 text-sm mb-2">Monthly Potential</p>
                  <p className="text-5xl lg:text-6xl font-black text-[#D9FC67] mb-2">
                    ₹1.76L
                  </p>
                  <p className="text-white/30 text-sm mb-6">per month</p>

                  <div className="space-y-2">
                    {[
                      { label: "Annual potential", value: "₹21L+" },
                      { label: "Platform fee", value: "₹1,999/mo" },
                      { label: "No commission on bookings", value: "✓" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-white/50">{label}</span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-white/25 text-xs mt-4 text-center">
                  * Based on average studio performance. Actual earnings vary.
                </p>
              </div>
            </div>
          </div>

          {/* Earning tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tier: "New Studio", range: "₹25K–50K/mo", desc: "Just getting started, 2–3 bookings/day", icon: "🌱" },
              { tier: "Growing Studio", range: "₹75K–1.5L/mo", desc: "Established, 5–7 bookings/day", icon: "🚀" },
              { tier: "Power Studio", range: "₹2L–4L/mo", desc: "Multi-room, 10+ sessions/day", icon: "⚡" },
            ].map(({ tier, range, desc, icon }) => (
              <div key={tier} className="bg-[#0D0D0D] border border-white/6 rounded-2xl p-5 text-center hover:border-[#D9FC67]/20 transition-colors">
                <span className="text-2xl mb-3 block">{icon}</span>
                <p className="text-white/50 text-xs mb-1">{tier}</p>
                <p className="text-[#D9FC67] font-bold text-lg mb-2">{range}</p>
                <p className="text-white/30 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
              Social Proof
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Trusted by studios across India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, quote, stars, initials }) => (
              <div
                key={name}
                className="bg-[#0D0D0D] border border-white/6 rounded-2xl p-7 flex flex-col hover:border-[#D9FC67]/15 transition-all group"
              >
                <Quote className="w-8 h-8 text-[#D9FC67]/20 mb-4 group-hover:text-[#D9FC67]/40 transition-colors" />
                <p className="text-white/70 text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D9FC67] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-white/40 text-xs">{role}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-[#D9FC67] fill-[#D9FC67]" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Studio logos / trust badge */}
          <div className="mt-14 text-center">
            <p className="text-white/30 text-sm mb-6">
              Studios using Yanisa Studios across India
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                "Mumbai Studios",
                "Delhi Podcast Hub",
                "Bangalore Pod Co.",
                "Hyderabad Studios",
                "Chennai Media",
                "Pune Podcast Lab",
              ].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-full px-4 py-2"
                >
                  <div className="w-5 h-5 rounded-full bg-[#D9FC67]/30 flex items-center justify-center">
                    <Mic className="w-2.5 h-2.5 text-[#D9FC67]" />
                  </div>
                  <span className="text-white/50 text-xs font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-[#060606]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-white/50 max-w-lg mx-auto">
              No commissions. No hidden fees. Pay a flat monthly fee and keep
              100% of your earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, highlight, description, features, cta }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-7 flex flex-col border transition-all ${
                  highlight
                    ? "bg-[#D9FC67]/5 border-[#D9FC67]/30 shadow-[0_0_50px_#D9FC6710]"
                    : "bg-[#0D0D0D] border-white/6 hover:border-white/12"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#D9FC67] text-black text-xs font-black px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-white font-bold text-lg mb-1">{name}</p>
                  <div className="flex items-end gap-1 mb-3">
                    <span
                      className={`text-4xl font-black ${highlight ? "text-[#D9FC67]" : "text-white"}`}
                    >
                      {price}
                    </span>
                    {period !== "forever" && (
                      <span className="text-white/40 text-sm mb-1">/{period}</span>
                    )}
                    {period === "forever" && (
                      <span className="text-[#D9FC67]/60 text-sm mb-1">
                        forever
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-sm">{description}</p>
                </div>

                <div className="flex-1 space-y-3 mb-8">
                  {features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? "text-[#D9FC67]" : "text-white/40"}`}
                      />
                      <span className="text-white/70 text-sm">{f}</span>
                    </div>
                  ))}
                </div>

                <Link href="/partner/signup" className="block">
                  <button
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      highlight
                        ? "bg-[#D9FC67] text-black hover:bg-[#E8FF8A]"
                        : "border border-white/15 text-white hover:bg-white/5 hover:border-white/25"
                    }`}
                  >
                    {cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9FC67]/4 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D9FC67]/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-full px-4 py-1.5 mb-6">
            <TrendingUp className="w-3.5 h-3.5 text-[#D9FC67]" />
            <span className="text-[#D9FC67] text-xs font-semibold">
              Join 500+ studio partners already growing
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Start getting bookings{" "}
            <span className="text-[#D9FC67]">today</span>
          </h2>

          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Your studio is one signup away from a fully automated booking
            system, a branded website, and consistent revenue.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/partner/signup">
              <button className="group flex items-center gap-2 bg-[#D9FC67] text-black font-bold px-10 py-4 rounded-2xl text-lg hover:bg-[#E8FF8A] transition-all shadow-[0_0_50px_#D9FC6740]">
                Become a Partner
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="group flex items-center gap-2 border border-white/15 text-white/80 font-medium px-10 py-4 rounded-2xl text-lg hover:bg-white/5 hover:border-white/25 transition-all">
              <ArrowUpRight className="w-5 h-5 text-[#D9FC67]" />
              Schedule a Demo
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
            {[
              "Free plan available",
              "No commission on bookings",
              "Cancel anytime",
              "24/7 support",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D9FC67]" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 bg-[#060606]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Questions? We&apos;ve got answers.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }, idx) => (
              <div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-all ${
                  openFaq === idx
                    ? "border-[#D9FC67]/25 bg-[#D9FC67]/3"
                    : "border-white/6 bg-[#0D0D0D] hover:border-white/12"
                }`}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span
                    className={`font-semibold text-sm pr-4 ${openFaq === idx ? "text-white" : "text-white/80"}`}
                  >
                    {q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${
                      openFaq === idx
                        ? "rotate-180 text-[#D9FC67]"
                        : "text-white/30"
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-white/60 text-sm leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm mb-3">
              Still have questions?
            </p>
            <a
              href="mailto:partners@podx.in"
              className="inline-flex items-center gap-2 text-[#D9FC67] font-medium text-sm hover:underline"
            >
              <Mail className="w-4 h-4" />
              partners@podx.in
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-black border-t border-white/5 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#D9FC67] flex items-center justify-center">
                  <Mic className="w-4 h-4 text-black" />
                </div>
                <span className="text-xl font-bold text-white">
                  Pod<span className="text-[#D9FC67]">X</span>
                </span>
              </Link>
              <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
                India&apos;s podcast studio marketplace. Helping studio owners get
                more bookings, manage clients, and grow their business.
              </p>
              <div className="flex items-center gap-3">
                {[Instagram, Linkedin, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Partner links */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-widest">
                Partners
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Become a Partner", href: "/partner/signup" },
                  { label: "Partner Dashboard", href: "/partner/dashboard" },
                  { label: "Partner Login", href: "/partner/login" },
                  { label: "White-Label", href: "/partner/whitelabel" },
                  { label: "Pricing", href: "#pricing" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/40 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-widest">
                Contact
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <span className="text-white/40 text-sm">Mumbai, Delhi, Bangalore & more</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <a href="mailto:partners@podx.in" className="text-white/40 hover:text-white text-sm transition-colors">
                    partners@podx.in
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <a href="tel:+919876543210" className="text-white/40 hover:text-white text-sm transition-colors">
                    +91 98765 43210
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <p className="text-white/20 text-xs">
              &copy; {new Date().getFullYear()} Yanisa Studios. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-white/20 hover:text-white/60 text-xs transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-white/20 hover:text-white/60 text-xs transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-white/20 hover:text-white/60 text-xs transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── STICKY CTA BAR ──────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
          stickyVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D9FC67]/15 border border-[#D9FC67]/20 flex items-center justify-center">
                <Mic className="w-4 h-4 text-[#D9FC67]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">
                  Ready to grow your studio?
                </p>
                <p className="text-white/40 text-xs">
                  Join 500+ partners. Free plan available.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/partner/signup" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D9FC67] text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#E8FF8A] transition-all">
                  Start Listing Your Studio
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
              <button className="text-white/50 hover:text-white text-xs border border-white/10 px-4 py-2.5 rounded-xl hover:border-white/20 transition-all whitespace-nowrap">
                Book Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

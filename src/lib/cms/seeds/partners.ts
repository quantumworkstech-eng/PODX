// ============================================================
// Default content for the Partner landing page (/partners).
// Mirrors the copy the page shipped with, so provisioning the CMS produces the
// same page an admin can then edit freely.
// ============================================================

import type { SeedPage } from "./types";

export const partnersSeed: SeedPage = {
  title: "Partner Landing Page",
  description: "The public page that recruits studio owners onto the platform.",
  path: "/partners",
  seo: {
    seo_title: "Partner with Yanisa Studios — Grow Your Podcast Studio",
    meta_description:
      "List your podcast studio on Yanisa Studios. Get more bookings, a white-label booking website, instant payments and analytics. No commission on bookings.",
    og_title: "Turn Your Podcast Studio into a Revenue Machine",
    og_description:
      "Join 500+ studio partners. Online bookings, branded website, instant payouts — free plan available.",
  },
  sections: [
    {
      type: "nav",
      name: "Navigation",
      content: {
        logo_text: "Pod",
        logo_accent: "X",
        cta_text: "Become a Partner",
        cta_url: "/partner/signup",
        cta_secondary_text: "Sign In",
        cta_secondary_url: "/partner/login",
        sticky_cta_text: "Ready to grow your studio?",
        sticky_cta_button: "Start Listing Your Studio",
        sticky_cta_url: "/partner/signup",
      },
      items: {
        items: [
          { label: "How it Works", url: "#how-it-works" },
          { label: "Features", url: "#features" },
          { label: "Pricing", url: "#pricing" },
          { label: "FAQ", url: "#faq" },
        ],
      },
    },
    {
      type: "hero",
      name: "Hero",
      content: {
        badge_text: "Partner Program — Now Open",
        heading: "Turn Your Podcast Studio",
        heading_accent: "into a Revenue Machine",
        description:
          "Get more bookings, manage clients effortlessly, and grow your studio business with Yanisa Studios — India's podcast studio marketplace platform.",
        cta_text: "Start Listing Your Studio",
        cta_url: "/partner/signup",
        cta_secondary_text: "Book a Demo",
        cta_secondary_url: "/contact",
        media_preset: "dashboard_mockup",
        overlay_opacity: 60,
      },
      settings: { alignment: "center", spacing: "large", width: "wide" },
      items: {
        trust: [
          { text: "No commission fees" },
          { text: "Setup in 30 minutes" },
          { text: "Cancel anytime" },
        ],
      },
    },
    {
      type: "stats",
      name: "Stats bar",
      content: {},
      settings: { columns: 4, width: "wide", spacing: "medium", background: "muted" },
      items: {
        items: [
          { value: "500+", label: "Studio Partners" },
          { value: "₹2Cr+", label: "Paid to Partners" },
          { value: "15,000+", label: "Bookings Processed" },
          { value: "4.9★", label: "Partner Satisfaction" },
        ],
      },
    },
    {
      type: "cards",
      name: "The problem",
      content: {
        eyebrow: "The Problem",
        heading: "Running a podcast studio is harder than it should be",
        card_style: "warning",
      },
      settings: { alignment: "center", columns: 2, width: "wide", spacing: "large" },
      items: {
        items: [
          {
            icon: "calendar",
            title: "Inconsistent bookings",
            description:
              "You rely on word-of-mouth and Instagram DMs. Some weeks are full, others are empty — no predictability.",
          },
          {
            icon: "clock",
            title: "Manual coordination chaos",
            description:
              "WhatsApp, phone calls, spreadsheets — each booking takes 15+ minutes of back-and-forth just to confirm.",
          },
          {
            icon: "indian-rupee",
            title: "Revenue leakage",
            description:
              "No-shows, last-minute cancellations, and informal payments mean money you earn on paper doesn't always reach your bank.",
          },
          {
            icon: "globe",
            title: "No professional online presence",
            description:
              "Your studio deserves a proper booking page. Without one, you look less serious than competitors with polished websites.",
          },
        ],
      },
    },
    {
      type: "image_content",
      name: "The solution",
      content: {
        eyebrow: "The Solution",
        heading: "Yanisa Studios is your complete studio",
        heading_accent: "operating system",
        description:
          "One platform to manage bookings, clients, payments, and your online presence. Built specifically for podcast studios in India.",
        media_preset: "none",
        cta_text: "Start for Free",
        cta_url: "/partner/signup",
      },
      settings: { image_position: "right", width: "wide", spacing: "large", background: "muted" },
      items: {
        checklist: [
          { text: "Online booking system — clients book 24/7" },
          { text: "White-label branded website with your domain" },
          { text: "Razorpay payment integration — get paid instantly" },
          { text: "Client CRM — track relationships and history" },
          { text: "Analytics dashboard — know what's working" },
          { text: "Automated reminders — cut no-shows by 60%" },
        ],
        features: [
          { icon: "calendar", title: "Smart Booking", description: "Automated scheduling with real-time availability" },
          { icon: "credit-card", title: "Instant Payments", description: "Razorpay-powered checkout, direct to your bank" },
          { icon: "globe", title: "White-Label Site", description: "Your own branded booking page in minutes" },
          { icon: "bar-chart", title: "Analytics", description: "Revenue, occupancy and peak-time insights" },
          { icon: "users", title: "Client CRM", description: "Full client history, notes and communication" },
          { icon: "zap", title: "Automation", description: "Reminders, confirmations, invoices — hands-free" },
        ],
      },
    },
    {
      type: "steps",
      name: "How it works",
      content: {
        eyebrow: "How It Works",
        heading: "Live in 5 simple steps",
        description: "From zero to a fully live, bookable studio — in under 30 minutes.",
        cta_text: "Start Your Setup Now",
        cta_url: "/partner/signup",
      },
      settings: { alignment: "center", columns: 5, width: "wide", spacing: "large" },
      items: {
        items: [
          { step: "01", icon: "badge-check", title: "Sign Up as Partner", description: "Create your partner account in 2 minutes. No credit card needed." },
          { step: "02", icon: "building", title: "Add Your Studio", description: "Upload photos, write a description, and showcase your equipment." },
          { step: "03", icon: "clock", title: "Set Pricing & Availability", description: "Choose your rates, block off personal time, set booking rules." },
          { step: "04", icon: "calendar", title: "Receive Bookings", description: "Clients find and book your studio online — you get notified instantly." },
          { step: "05", icon: "indian-rupee", title: "Get Paid", description: "Payments are collected upfront and settled to your bank account." },
        ],
      },
    },
    {
      type: "cards",
      name: "Features",
      content: {
        eyebrow: "Features",
        heading: "Everything you need to run a",
        heading_accent: "pro studio",
        card_style: "accent",
      },
      settings: { alignment: "center", columns: 3, width: "wide", spacing: "large", background: "muted" },
      items: {
        items: [
          { icon: "calendar", title: "Smart Booking Calendar", tag: "Core", description: "Real-time availability management. Block time, set buffer between sessions, handle back-to-back bookings with ease." },
          { icon: "indian-rupee", title: "Automated Payments", tag: "Popular", description: "Clients pay 100% upfront via Razorpay. No chasing invoices. Funds hit your bank on schedule." },
          { icon: "globe", title: "White-Label Website", tag: "Pro", description: "Your own branded booking page — custom logo, colors, domain. Clients see your brand, not ours." },
          { icon: "users", title: "Client Management", tag: "Core", description: "Full client profiles with booking history, notes, preferences, and spend tracking." },
          { icon: "bar-chart", title: "Analytics & Insights", tag: "Core", description: "Revenue trends, peak hours, top clients, occupancy rates — know your business numbers cold." },
          { icon: "bell", title: "Automated Reminders", tag: "Popular", description: "Email & SMS reminders sent to clients before their session. Reduce no-shows by up to 60%." },
          { icon: "palette", title: "Custom Branding", tag: "Pro", description: "Upload your logo, choose your color palette, set your own domain. 100% your brand." },
          { icon: "layers", title: "Add-On Services", tag: "Core", description: "Sell video editing, photography, or production packages as bookable add-ons." },
          { icon: "shield", title: "Cancellation Policies", tag: "Core", description: "Set your own cancellation and rescheduling rules. Protect your revenue automatically." },
        ],
      },
    },
    {
      type: "image_content",
      name: "White-label showcase",
      content: {
        badge_text: "White-Label — Big Selling Point",
        heading: "Your own branded",
        heading_accent: "booking website",
        description:
          "Clients see your brand, not Yanisa Studios. Get a professional booking website with your logo, colors, and domain — no developer needed.",
        media_preset: "browser_mockup",
      },
      settings: { image_position: "left", width: "wide", spacing: "large" },
      items: {
        features: [
          { icon: "palette", title: "Custom logo & colors", description: "Match your exact brand identity down to the hex code." },
          { icon: "globe", title: "Custom domain support", description: "Use yourstudio.yanisastudios.com or point your own domain." },
          { icon: "book-open", title: "Fully customizable pages", description: "Edit headlines, descriptions, and feature lists — no code." },
          { icon: "mail", title: "Branded email communications", description: "Booking confirmations sent from your studio's email." },
        ],
      },
    },
    {
      type: "earnings",
      name: "Earning potential",
      content: {
        eyebrow: "Earning Potential",
        heading: "How much can you earn?",
        description: "Real numbers from studios already on the platform.",
        rows_title: "Example Calculation",
        highlight_label: "Monthly Potential",
        highlight_value: "₹1.76L",
        highlight_caption: "per month",
        footnote: "* Based on average studio performance. Actual earnings vary.",
      },
      settings: { width: "medium", spacing: "large", background: "muted" },
      items: {
        rows: [
          { label: "Hourly rate", value: "₹800/hour", sub: "competitive for metro cities" },
          { label: "Sessions per day", value: "5 sessions", sub: "avg. 2 hours each" },
          { label: "Daily earnings", value: "₹8,000/day", sub: "" },
          { label: "Working days/month", value: "22 days", sub: "" },
        ],
        summary: [
          { label: "Annual potential", value: "₹21L+" },
          { label: "Platform fee", value: "₹1,999/mo" },
          { label: "No commission on bookings", value: "✓" },
        ],
        tiers: [
          { icon_emoji: "🌱", title: "New Studio", value: "₹25K–50K/mo", description: "Just getting started, 2–3 bookings/day" },
          { icon_emoji: "🚀", title: "Growing Studio", value: "₹75K–1.5L/mo", description: "Established, 5–7 bookings/day" },
          { icon_emoji: "⚡", title: "Power Studio", value: "₹2L–4L/mo", description: "Multi-room, 10+ sessions/day" },
        ],
      },
    },
    {
      type: "testimonials",
      name: "Testimonials",
      content: {
        eyebrow: "Social Proof",
        heading: "Trusted by studios across India",
      },
      settings: { alignment: "center", columns: 3, width: "wide", spacing: "large" },
      items: {
        items: [
          {
            name: "Arjun Mehta",
            role: "Studio Owner · Mumbai",
            rating: 5,
            quote:
              "Before Yanisa Studios I was managing bookings over WhatsApp. Now I get 15–20 bookings a month automatically. My revenue doubled in 60 days.",
          },
          {
            name: "Priya Sharma",
            role: "Podcast Studio · Bangalore",
            rating: 5,
            quote:
              "The white-label feature is a game changer. My clients think I built a custom booking app. It looks so professional — I've won 3 corporate clients just from sharing the link.",
          },
          {
            name: "Rohan Kapoor",
            role: "Media Studio · Delhi",
            rating: 5,
            quote:
              "The analytics dashboard showed me that Friday evenings were my peak. I adjusted pricing and now earn 30% more without any extra marketing.",
          },
        ],
      },
    },
    {
      type: "logos",
      name: "Partner logos",
      content: {
        heading: "Studios using Yanisa Studios across India",
        grayscale: true,
      },
      settings: { alignment: "center", columns: 5, width: "wide", spacing: "medium" },
      items: {
        items: [
          { name: "Mumbai Studios" },
          { name: "Delhi Podcast Hub" },
          { name: "Bangalore Pod Co." },
          { name: "Hyderabad Studios" },
          { name: "Chennai Media" },
          { name: "Pune Podcast Lab" },
        ],
      },
    },
    {
      type: "pricing",
      name: "Pricing",
      content: {
        eyebrow: "Pricing",
        heading: "Simple, transparent pricing",
        description:
          "No commissions. No hidden fees. Pay a flat monthly fee and keep 100% of your earnings.",
      },
      settings: { alignment: "center", columns: 3, width: "medium", spacing: "large", background: "muted" },
      items: {
        items: [
          {
            name: "Starter",
            price: "Free",
            period: "forever",
            highlighted: false,
            description: "Perfect for listing your first studio and testing the platform.",
            features: [
              "1 studio listing",
              "Online booking page",
              "Basic analytics",
              "Razorpay payments",
              "Email support",
            ],
            cta_text: "Get Started Free",
            cta_url: "/partner/signup",
          },
          {
            name: "Pro",
            price: "₹1,999",
            period: "per month",
            badge: "MOST POPULAR",
            highlighted: true,
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
            cta_text: "Start Pro Trial",
            cta_url: "/partner/signup",
          },
          {
            name: "Enterprise",
            price: "₹4,999",
            period: "per month",
            highlighted: false,
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
            cta_text: "Talk to Sales",
            cta_url: "/contact",
          },
        ],
      },
    },
    {
      type: "cta",
      name: "Final call to action",
      content: {
        badge_text: "Join 500+ studio partners already growing",
        heading: "Start getting bookings",
        heading_accent: "today",
        description:
          "Your studio is one signup away from a fully automated booking system, a branded website, and consistent revenue.",
        cta_text: "Become a Partner",
        cta_url: "/partner/signup",
        cta_secondary_text: "Schedule a Demo",
        cta_secondary_url: "/contact",
        note: "Free plan available · No commission on bookings · Cancel anytime · 24/7 support",
      },
      settings: { alignment: "center", width: "medium", spacing: "large" },
    },
    {
      type: "faq",
      name: "FAQ",
      content: {
        eyebrow: "FAQ",
        heading: "Questions? We've got answers.",
        description: "Still have questions? Email partners@yanisastudios.in",
      },
      settings: { alignment: "center", width: "medium", spacing: "large", background: "muted" },
      items: {
        items: [
          {
            question: "How do I get bookings through Yanisa Studios?",
            answer:
              "Once you list your studio, it appears in Yanisa Studios's search results and your own branded booking page. Clients can find you, check availability, and book directly — no back-and-forth required. You also get your own shareable link to promote on social media.",
          },
          {
            question: "Can I use my own branding?",
            answer:
              "Yes! With the white-label feature, you get a fully branded booking page at yourstudio.yanisastudios.com or even your own custom domain. Your logo, colors, and studio name — clients never see the Yanisa Studios backend.",
          },
          {
            question: "How do payments work?",
            answer:
              "Payments are processed securely via Razorpay. Clients pay online at booking time and the funds are settled directly to your registered bank account. You get real-time earnings tracking in your dashboard.",
          },
          {
            question: "Does Yanisa Studios charge a commission?",
            answer:
              "Yanisa Studios does not charge per-booking commissions. You pay a flat monthly subscription for the platform. This means the more you earn, the better the deal gets for you.",
          },
          {
            question: "Can I cancel my subscription anytime?",
            answer:
              "Absolutely. No lock-in contracts. Cancel any time from your billing settings. Your studio listing stays active until the end of your current billing period.",
          },
          {
            question: "How long does it take to set up?",
            answer:
              "Most studio owners are live within 30 minutes. Sign up, add your studio details, set pricing and availability, and you're ready to receive bookings.",
          },
        ],
      },
    },
    {
      type: "footer",
      name: "Footer",
      content: {
        logo_text: "PodX",
        tagline:
          "India's podcast studio marketplace. Helping studio owners get more bookings, manage clients, and grow their business.",
        address: "Mumbai, Delhi, Bangalore & more",
        email: "partners@yanisastudios.in",
        phone: "+91 98765 43210",
        instagram_url: "https://instagram.com",
        linkedin_url: "https://linkedin.com",
        youtube_url: "https://youtube.com",
        copyright_text: "Yanisa Studios. All rights reserved.",
      },
      items: {
        items: [
          { label: "Become a Partner", url: "/partner/signup", column: "Partners" },
          { label: "Partner Dashboard", url: "/partner/dashboard", column: "Partners" },
          { label: "Partner Login", url: "/partner/login", column: "Partners" },
          { label: "White-Label", url: "/partner/whitelabel", column: "Partners" },
          { label: "Pricing", url: "#pricing", column: "Partners" },
          { label: "Terms of Service", url: "/terms", column: "Legal" },
          { label: "Privacy Policy", url: "/privacy", column: "Legal" },
          { label: "Contact", url: "/contact", column: "Legal" },
        ],
      },
    },
  ],
};

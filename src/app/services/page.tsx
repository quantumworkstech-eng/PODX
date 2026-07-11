"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Mic2,
  Video,
  Camera,
  Headphones,
  Lightbulb,
  Edit3,
  Play,
  ChevronRight,
  CheckCircle2,
  Star,
  Sparkles,
  Radio,
  Film,
  Monitor,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const SERVICES = [
  {
    id: "podcast-studio",
    icon: Mic2,
    label: "Podcast Studios",
    title: "Professional Podcast Recording Studios",
    subtitle: "Broadcast-quality audio in a fully equipped studio",
    description:
      "Record your podcast in soundproofed, acoustically treated studios designed for clarity. Our studios are equipped with industry-leading microphones, mixers, and monitoring systems so every word sounds pristine.",
    features: [
      "Shure SM7dB broadcast microphones",
      "Focusrite Scarlett audio interface",
      "Acoustic treatment & soundproofing",
      "Multi-track recording setup",
      "Real-time monitoring headphones",
      "On-site engineer available",
      "Up to 4 guests simultaneously",
      "Plug-and-play setup — just show up",
    ],
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900",
    price: "₹999",
    unit: "/ hour",
    tag: "Most Popular",
    color: "#D9FC67",
  },
  {
    id: "video-podcast",
    icon: Video,
    label: "Video Podcast",
    title: "Cinematic Video Podcast Production",
    subtitle: "Sony FX3 cameras, professional lighting & multi-camera setup",
    description:
      "Elevate your podcast with stunning visuals. Our video studios feature Sony FX3 cinema cameras, professional 3-point lighting, and multi-angle recording for a broadcast-ready look that competes with the biggest names.",
    features: [
      "Sony FX3 full-frame cinema cameras",
      "Multi-camera setup (up to 3 angles)",
      "Professional 3-point LED lighting",
      "Green screen / custom backdrop",
      "Real-time video monitoring",
      "Teleprompter available",
      "4K recording capability",
      "B-roll & cutaway recording",
    ],
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=900",
    price: "₹1,999",
    unit: "/ hour",
    tag: "High Demand",
    color: "#60A5FA",
  },
  {
    id: "content-creation",
    icon: Camera,
    label: "Content Creation",
    title: "Short-Form & Social Media Content",
    subtitle: "Reels, Shorts, TikTok — optimised for every platform",
    description:
      "From Instagram Reels to YouTube Shorts, our content creation suites are designed for fast, high-quality short-form video production. Bright, versatile sets with ring lights, DSLR cameras, and prop libraries to make your brand stand out.",
    features: [
      "Dedicated content creation suites",
      "Ring lights & professional lighting kits",
      "Canon EOS R series cameras",
      "Teleprompter & autocue",
      "Prop library & brand backdrop options",
      "Fast turnaround shoots",
      "Vertical & horizontal framing",
      "Same-day raw footage delivery",
    ],
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900",
    price: "₹1,499",
    unit: "/ hour",
    tag: "Creator Favorite",
    color: "#F472B6",
  },
  {
    id: "post-production",
    icon: Edit3,
    label: "Post-Production",
    title: "Editing & Post-Production Suite",
    subtitle: "DaVinci Resolve, Adobe Suite & professional colour grading",
    description:
      "Your content doesn't end at recording. Our editing suites come loaded with industry-standard software and high-performance workstations. Colour grade, mix audio, add motion graphics, and export platform-ready files all in one place.",
    features: [
      "DaVinci Resolve & Adobe Premiere Pro",
      "Adobe After Effects for motion graphics",
      "Professional colour grading suite",
      "Dolby Atmos audio mixing",
      "Podcast mastering & noise removal",
      "Subtitles & captions generation",
      "Thumbnail design services",
      "Multi-platform export (YT, Spotify, Reels)",
    ],
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=900",
    price: "₹799",
    unit: "/ hour",
    tag: "Add-On",
    color: "#A78BFA",
  },
  {
    id: "live-streaming",
    icon: Radio,
    label: "Live Streaming",
    title: "Live Streaming & Broadcast Setup",
    subtitle: "Stream to YouTube, Twitch, LinkedIn & more simultaneously",
    description:
      "Go live with confidence. Our streaming rigs support multi-platform simultaneous broadcasts with dedicated internet, hardware encoders, and live switching. Perfect for interviews, events, product launches, and interactive shows.",
    features: [
      "Multi-platform simultaneous streaming",
      "Dedicated gigabit internet connection",
      "Blackmagic ATEM live switcher",
      "Graphics overlay & lower-thirds",
      "Live chat moderation display",
      "Recorded backup of every stream",
      "Virtual backgrounds & scene switching",
      "Remote guest integration via StreamYard",
    ],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900",
    price: "₹2,499",
    unit: "/ session",
    tag: "Premium",
    color: "#FB923C",
  },
  {
    id: "photography",
    icon: Film,
    label: "Photography",
    title: "Brand & Headshot Photography",
    subtitle: "Studio-quality photography for creators & businesses",
    description:
      "Professional photography sessions in our fully equipped photo studios. Whether it's personal branding headshots, product photography, or podcast cover art shoots — our spaces and equipment deliver gallery-ready results.",
    features: [
      "Sony A7 IV full-frame mirrorless camera",
      "Profoto studio flash system",
      "Seamless paper backdrops (10+ colours)",
      "High-key & low-key lighting setups",
      "Reflectors, diffusers & V-flats",
      "Prop & wardrobe styling assistance",
      "100+ edited images delivery",
      "Same-day preview gallery",
    ],
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900",
    price: "₹2,999",
    unit: "/ 2 hours",
    tag: "New",
    color: "#34D399",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Choose Your Service",
    description: "Browse our range of podcast, video, and content creation services. Pick what fits your vision.",
    icon: Layers,
  },
  {
    step: "02",
    title: "Book a Slot",
    description: "Select your preferred studio, date, and time. Instant confirmation — no back and forth.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Show Up & Create",
    description: "Walk in, plug in, and record. Our team handles the technical setup so you can focus on your content.",
    icon: Play,
  },
  {
    step: "04",
    title: "Publish & Grow",
    description: "Leave with broadcast-ready files. Distribute across all platforms and grow your audience.",
    icon: ArrowRight,
  },
];

const STATS = [
  { value: "2,000+", label: "Creators Served" },
  { value: "75K+", label: "Hours Recorded" },
  { value: "9", label: "Premium Studios" },
  { value: "4.9★", label: "Average Rating" },
];

export default function ServicesPage() {
  const [activeService, setActiveService] = useState(0);
  const service = SERVICES[activeService];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[#D9FC67] blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-500 blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-[#D9FC67] animate-pulse" />
            <span className="text-xs text-white/90 font-medium">Professional Media Production in Mumbai</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
            Everything You Need to
            <br />
            <span className="text-[#D9FC67]">Create & Publish</span>
          </h1>

          <p className="text-lg text-white/60 max-w-3xl mx-auto mb-10">
            From podcast recording to video production, live streaming to post-production — Yanisa Studio has
            every service a modern content creator needs under one roof in Mumbai.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book">
              <Button
                size="lg"
                className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 rounded-full text-black shadow-lg shadow-[#D9FC67]/25"
              >
                Book a Session
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-6 text-base font-semibold bg-white/5 border border-white/30 text-white hover:bg-white/15 rounded-full"
              >
                Talk to an Expert
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-white/10 bg-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services — Tab + Detail */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Our Services</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Professional-grade production services for podcasters, creators, and brands.
            </p>
          </div>

          {/* Tab Nav */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveService(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeService === i
                      ? "bg-white text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Service Detail */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative aspect-video rounded-3xl overflow-hidden">
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Tag */}
              <div className="absolute top-4 left-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-black"
                  style={{ backgroundColor: service.color }}
                >
                  {service.tag}
                </span>
              </div>

              {/* Price */}
              <div className="absolute bottom-6 left-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{service.price}</span>
                  <span className="text-white/60 text-sm">{service.unit}</span>
                </div>
                <div className="text-white/50 text-xs mt-0.5">Starting from · GST extra</div>
              </div>
            </div>

            {/* Content */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-black mb-4"
                style={{ backgroundColor: service.color }}
              >
                {service.label}
              </div>

              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3">{service.title}</h3>
              <p className="text-white/50 text-sm mb-4 font-medium">{service.subtitle}</p>
              <p className="text-white/70 leading-relaxed mb-8">{service.description}</p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {service.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: service.color }} />
                    <span className="text-white/70 text-sm">{f}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/book">
                  <Button
                    size="lg"
                    className="px-8 py-5 font-semibold rounded-full text-black border-0"
                    style={{ backgroundColor: service.color }}
                  >
                    Book This Service
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-5 font-semibold rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    Ask a Question
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards Grid */}
      <section className="py-12 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">All Services at a Glance</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveService(i);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${s.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{s.label}</h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium text-black"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mb-3 line-clamp-2">{s.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">{s.price}<span className="text-white/40 text-xs font-normal"> {s.unit}</span></span>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              From booking to publishing — a seamless end-to-end production experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROCESS_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  {i < PROCESS_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent z-0" />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#D9FC67]/10 border border-[#D9FC67]/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#D9FC67]" />
                      </div>
                      <span className="text-[#D9FC67] font-bold text-lg">{step.step}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Equipment Showcase */}
      <section className="py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Industry-Leading Equipment</h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm">
              Every studio is stocked with the same gear used by professional broadcast studios.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Mic2, name: "Shure SM7dB", desc: "Broadcast vocal microphone" },
              { icon: Video, name: "Sony FX3", desc: "Full-frame cinema camera" },
              { icon: Headphones, name: "Sony MDR-7506", desc: "Professional studio headphones" },
              { icon: Monitor, name: "DaVinci Resolve", desc: "Professional editing suite" },
              { icon: Lightbulb, name: "Aputure 300d", desc: "Professional LED lighting" },
              { icon: Radio, name: "Focusrite Scarlett", desc: "Audio interface & mixer" },
              { icon: Camera, name: "Canon EOS R5", desc: "High-resolution still & video" },
              { icon: Star, name: "Profoto B10", desc: "Studio flash system" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#D9FC67]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{item.name}</div>
                    <div className="text-white/40 text-xs">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Start Creating?
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Join 2,000+ creators who trust Yanisa Studio for their podcast and video production needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book">
              <Button
                size="lg"
                className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 rounded-full text-black shadow-lg shadow-[#D9FC67]/25"
              >
                Book a Session
              </Button>
            </Link>
            <Link href="/studios">
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-6 text-base font-semibold bg-white/5 border border-white/30 text-white hover:bg-white/15 rounded-full"
              >
                Browse Studios
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

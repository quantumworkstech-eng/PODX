"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  ChevronDown,
  Instagram,
  Linkedin,
  Youtube,
  CheckCircle2,
  MessageSquare,
  Headphones,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const FAQS = [
  {
    q: "How far in advance should I book?",
    a: "We recommend booking at least 48 hours in advance to secure your preferred time slot. For weekends and peak hours (6–10 PM), book 3–5 days ahead. Urgent bookings can sometimes be accommodated — contact us directly.",
  },
  {
    q: "What's included in a standard studio booking?",
    a: "Every booking includes the fully equipped studio, professional microphones, audio interface, monitoring headphones, and basic lighting. An on-site host is available to assist with setup. Additional services like a sound engineer or video crew can be added.",
  },
  {
    q: "Can I bring my own equipment?",
    a: "Yes, absolutely. You're welcome to bring your own microphones, cameras, or accessories. Our studios are designed to be flexible and can integrate your gear with the existing setup.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Cancellations 48+ hours before the session receive a full refund. Cancellations 24–48 hours in advance receive a 50% refund. Cancellations under 24 hours are non-refundable. You can reschedule once for free with 24+ hours notice.",
  },
  {
    q: "Do you offer packages for regular creators?",
    a: "Yes! We have monthly and quarterly creator packages that offer significant savings for regular bookings. Contact us or check our Bundles section for current offers.",
  },
  {
    q: "Can I get a tour of the studio before booking?",
    a: "Absolutely. We offer 15-minute free studio tours on weekdays. Book a tour slot via the contact form or WhatsApp us directly.",
  },
  {
    q: "Is there parking available?",
    a: "Parking availability varies by studio location. Details are listed on each studio's page. Our Andheri and Bandra locations have dedicated parking; other locations have street parking nearby.",
  },
  {
    q: "Do you provide video editing or post-production?",
    a: "Yes, we have editing suites available for rent and can connect you with our network of editors and post-production professionals. Ask us about turnkey podcast or video production packages.",
  },
];

const CONTACT_METHODS = [
  {
    icon: MessageSquare,
    title: "WhatsApp Us",
    description: "Fastest response — typically under 15 minutes",
    action: "Chat on WhatsApp",
    href: "https://wa.me/919876543210",
    color: "#25D366",
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "For detailed inquiries, quotes, or partnerships",
    action: "hello@podx.in",
    href: "mailto:hello@podx.in",
    color: "#D9FC67",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon–Sat, 10 AM – 8 PM",
    action: "+91 98765 43210",
    href: "tel:+919876543210",
    color: "#60A5FA",
  },
];

const LOCATIONS = [
  {
    name: "PodX Andheri",
    address: "4th Floor, Infinity Business Park, Andheri West, Mumbai 400053",
    hours: "Mon–Fri: 10 AM – 10 PM · Sat: 11 AM – 8 PM",
    map: "https://maps.google.com/?q=Andheri+West+Mumbai",
  },
  {
    name: "PodX Bandra",
    address: "2nd Floor, Hill Road, Bandra West, Mumbai 400050",
    hours: "Mon–Fri: 10 AM – 10 PM · Sat: 11 AM – 8 PM",
    map: "https://maps.google.com/?q=Bandra+West+Mumbai",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-[#D9FC67] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-500 blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
            <Headphones className="w-3.5 h-3.5 text-[#D9FC67]" />
            <span className="text-xs text-white/90 font-medium">We typically reply within 15 minutes</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
            Let&apos;s Talk
            <span className="text-[#D9FC67]">.</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Have questions about studios, services, pricing, or partnerships? We&apos;re here to help.
            Reach out via any channel — we&apos;re always on.
          </p>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-4">
            {CONTACT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <Link
                  key={method.title}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  className="group flex flex-col gap-4 p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${method.color}20`, border: `1px solid ${method.color}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: method.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{method.title}</h3>
                    <p className="text-white/50 text-sm mb-2">{method.description}</p>
                    <span className="text-sm font-medium" style={{ color: method.color }}>
                      {method.action} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Send Us a Message</h2>
              <p className="text-white/50 text-sm mb-8">
                Fill in the form and our team will get back to you within 15 minutes.
              </p>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#D9FC67]/10 border border-[#D9FC67]/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#D9FC67]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-white/60 mb-6">
                    Thanks for reaching out, {formData.name.split(" ")[0]}. We&apos;ll get back to you shortly.
                  </p>
                  <Button
                    onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" }); }}
                    className="bg-[#D9FC67] text-black hover:bg-[#E8FF8A] rounded-full px-6"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Rahul Sharma"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/60 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="rahul@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#D9FC67]/60 transition-colors appearance-none"
                    >
                      <option value="General Inquiry" className="bg-[#09090b]">General Inquiry</option>
                      <option value="Studio Booking" className="bg-[#09090b]">Studio Booking</option>
                      <option value="Partnership / List Studio" className="bg-[#09090b]">Partnership / List Studio</option>
                      <option value="Pricing & Packages" className="bg-[#09090b]">Pricing &amp; Packages</option>
                      <option value="Technical Support" className="bg-[#09090b]">Technical Support</option>
                      <option value="Media / Press" className="bg-[#09090b]">Media / Press</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us how we can help you..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/60 transition-colors resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full py-5 font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 rounded-xl text-black disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Side Info */}
            <div className="space-y-8">
              {/* Hours */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <h3 className="font-semibold text-white">Operating Hours</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Sunday to Friday</span>
                    <span className="text-white">10:00 AM – 10:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Saturday</span>
                    <span className="text-white">Upon Request</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Support Response</span>
                    <span className="text-[#D9FC67]">Within 15 minutes</span>
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <h3 className="font-semibold text-white">Our Locations</h3>
                </div>
                <div className="space-y-4">
                  {LOCATIONS.map((loc) => (
                    <div key={loc.name} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                      <div className="font-medium text-white text-sm mb-1">{loc.name}</div>
                      <div className="text-white/50 text-xs mb-1">{loc.address}</div>
                      <div className="text-white/40 text-xs mb-2">{loc.hours}</div>
                      <Link
                        href={loc.map}
                        target="_blank"
                        className="text-[#D9FC67] text-xs hover:text-[#B8E050] transition-colors"
                      >
                        View on Google Maps →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold text-white mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <Link
                    href="https://instagram.com"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm text-white/70 hover:text-white"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Link>
                  <Link
                    href="https://linkedin.com"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm text-white/70 hover:text-white"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Link>
                  <Link
                    href="https://youtube.com"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm text-white/70 hover:text-white"
                  >
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </Link>
                </div>
              </div>

              {/* Quick action */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#D9FC67]/10 to-transparent border border-[#D9FC67]/20">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-[#D9FC67]" />
                  <h3 className="font-semibold text-white">Ready to book?</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Skip the conversation — browse studios and book your session in 2 minutes.
                </p>
                <Link href="/book">
                  <Button className="w-full bg-[#D9FC67] text-black hover:bg-[#E8FF8A] rounded-xl font-semibold">
                    Book a Session Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-white/50">Quick answers to common questions about PodX.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="font-medium text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10">
                    <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-white/50 text-sm">
              Still have questions?{" "}
              <Link href="https://wa.me/919876543210" target="_blank" className="text-[#D9FC67] hover:text-[#B8E050]">
                WhatsApp us directly
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

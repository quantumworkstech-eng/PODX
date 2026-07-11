"use client";

import Link from "next/link";
import { Instagram, Linkedin, Youtube, MapPin, Clock, Mail, Phone } from "lucide-react";

interface FooterData {
  tagline?: string;
  address?: string;
  hours?: string;
  email?: string;
  phone?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
}

interface FooterProps {
  data?: FooterData;
}

const DEFAULT_DATA: FooterData = {
  tagline: "India's premier podcast studio network. Book world-class studios in your city.",
  address: "Mumbai, Delhi, Bangalore, Hyderabad & more",
  hours: "Monday – Saturday, 9:00 AM – 9:00 PM",
  email: "support@yanisa.in",
  phone: "+91 98765 43210",
  instagram_url: "https://instagram.com",
  linkedin_url: "https://linkedin.com",
  youtube_url: "https://youtube.com",
};

export function Footer({ data }: FooterProps) {
  const footer = { ...DEFAULT_DATA, ...data };

  return (
    <footer className="bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <span className="text-2xl font-bold tracking-tight text-white">
                Yanisa<span className="text-[#D9FC67]"> Studio</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
              {footer.tagline}
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {footer.instagram_url && (
                <Link
                  href={footer.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </Link>
              )}
              {footer.linkedin_url && (
                <Link
                  href={footer.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                </Link>
              )}
              {footer.youtube_url && (
                <Link
                  href={footer.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Youtube className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: "Browse Studios", href: "/studios" },
                { label: "Book a Session", href: "/book" },
                { label: "Services", href: "/services" },
                { label: "Partner Program", href: "/partner" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
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

          {/* Contact info */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-4">
              {footer.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <span className="text-white/40 text-sm leading-snug">{footer.address}</span>
                </li>
              )}
              {footer.hours && (
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <span className="text-white/40 text-sm leading-snug">{footer.hours}</span>
                </li>
              )}
              {footer.email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <a
                    href={`mailto:${footer.email}`}
                    className="text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {footer.email}
                  </a>
                </li>
              )}
              {footer.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <a
                    href={`tel:${footer.phone}`}
                    className="text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {footer.phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-white/25 text-xs">
            &copy; {new Date().getFullYear()} Yanisa Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-white/25 hover:text-white/60 text-xs transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-white/25 hover:text-white/60 text-xs transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

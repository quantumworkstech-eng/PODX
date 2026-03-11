"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Linkedin, Instagram } from "lucide-react";

export function Footer() {
  return (
    <>
      {/* Have Questions Section with Map Background */}
      <section className="relative py-32 overflow-hidden">
        {/* Map Background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Have questions?
          </h2>
          <p className="text-white/60 text-lg mb-10">
            We have answers. Tell us what you want to know!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button
                size="lg"
                className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 rounded-full text-black"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo centered */}
          <div className="text-center mb-12">
            <Link href="/" className="text-3xl font-bold">
              <span className="text-white">Yanisa</span>
              <span className="text-[#D9FC67]"> Studio</span>
            </Link>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            {/* Copyright and Links */}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span>Copyright © Yanisa Studio</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <Link 
                href="https://linkedin.com" 
                target="_blank"
                className="text-white/50 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link 
                href="https://instagram.com" 
                target="_blank"
                className="text-white/50 hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
            </div>

          </div>
        </div>
      </footer>
    </>
  );
}

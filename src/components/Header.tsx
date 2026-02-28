"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Globe } from "lucide-react";

const navItems = [
  { label: "Studios", href: "#studios" },
  { label: "Packages", href: "#packages" },
  { label: "Services", href: "#services" },
  { label: "Academy", href: "#academy" },
  { label: "Contact Us", href: "#contact" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight text-white">
              p<span className="text-[#D9FC67]">o</span>dX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm">EN</span>
            </Button>

            {/* Login */}
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white hover:text-white hover:bg-white/10">
                Login
              </Button>
            </Link>

            {/* Get Started */}
            <Link href="/book" className="hidden sm:block">
              <Button 
                size="sm" 
                className="text-sm font-semibold px-5 bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 text-black"
              >
                Get Started
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[350px] bg-black border-white/10 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <span className="text-xl font-bold text-white">
                      p<span className="text-[#D9FC67]">o</span>dX
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-white hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Mobile Nav Items */}
                  <nav className="flex-1 p-4">
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-base font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </nav>

                  {/* Mobile Auth Buttons */}
                  <div className="p-4 border-t border-white/10 space-y-3">
                    <Link href="/auth/login" className="block">
                      <Button variant="outline" className="w-full justify-center bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => setIsMobileMenuOpen(false)}>
                        Login
                      </Button>
                    </Link>
                    <Link href="/book" className="block">
                      <Button className="w-full justify-center bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 text-black" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

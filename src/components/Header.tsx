"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Studios", href: "/studios" },
  { label: "Services", href: "/services" },
  { label: "Contact Us", href: "/contact" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-[#D9FC67] bg-[#D9FC67]/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10">
                Login
              </Button>
            </Link>

            <Link href="/book" className="hidden sm:block">
              <Button
                size="sm"
                className="text-sm font-semibold px-5 bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 text-black rounded-full"
              >
                Book Now
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
              <SheetContent side="right" className="w-full sm:w-[320px] bg-[#09090b] border-white/10 p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <span className="text-xl font-bold text-white">
                      p<span className="text-[#D9FC67]">o</span>dX
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:bg-white/10">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <nav className="flex-1 p-5">
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                            pathname === item.href
                              ? "text-[#D9FC67] bg-[#D9FC67]/10"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </nav>

                  <div className="p-5 border-t border-white/10 space-y-3">
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full justify-center bg-white/5 border-white/20 text-white hover:bg-white/10">
                        Login
                      </Button>
                    </Link>
                    <Link href="/book" onClick={() => setIsMobileMenuOpen(false)} className="block">
                      <Button className="w-full justify-center bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 text-black font-semibold rounded-full">
                        Book Now
                      </Button>
                    </Link>
                    <Link href="/partner/signup" onClick={() => setIsMobileMenuOpen(false)} className="block">
                      <Button variant="ghost" className="w-full justify-center text-white/60 hover:text-white hover:bg-white/5 text-sm">
                        List Your Studio →
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

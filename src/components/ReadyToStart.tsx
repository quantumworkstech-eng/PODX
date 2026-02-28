"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ReadyToStart() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-background to-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to get started?
        </h2>
        <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
          Book your studio session today and join hundreds of creators who trust PodX 
          for their podcast production needs.
        </p>
        <Link href="/book">
          <Button 
            size="lg" 
            className="px-10 py-6 text-lg font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 text-black"
          >
            Get Started
          </Button>
        </Link>
      </div>
    </section>
  );
}


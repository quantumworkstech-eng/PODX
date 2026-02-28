"use client";

import { Button } from "@/components/ui/button";
import { Layers, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const offers = [
  {
    badge: "Only 20 Passes!",
    discount: "46% Off!",
    title: "Recording & Editing + Add-Ons: Power Pass!",
    description: "46% OFF — Save ₹15,000! Get 4 Sessions + Episode Edits, Photos, Thumbnails, and 30-min Strategy Session. Use all sessions this month, and get ₹5,000 PodX Credit to use next month.",
    originalPrice: "₹37,500",
    salePrice: "₹22,500",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800",
  },
  {
    badge: "30 Passes Only!",
    discount: "64% Off!",
    title: "Recording + Live Mix + Add-Ons: Creator Pass!",
    description: "64% OFF — Save ₹20,000! Get 4 Recording + Live Mix sessions, Session Photos, and 30-min Strategy Session. Use all sessions this month, and get ₹5,000 PodX Credit to use next month!",
    originalPrice: "₹50,000",
    salePrice: "₹18,000",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
  },
];

export function Bundles() {
  return (
    <>
      {/* Create More, Spend Less Section */}
      <section className="py-32 bg-gradient-to-b from-[#D9FC67]/20 via-[#B8E050]/10 to-background relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D9FC67]/10 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D9FC67] to-[#B8E050] mb-8">
            <Layers className="w-8 h-8 text-black" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Create More, Spend Less
            <br />
            with Our Bundles
          </h2>
          <p className="text-white/60 mb-10 max-w-xl mx-auto">
            Save on multiple sessions and services with curated bundles. Buy now, record anytime.
          </p>
          <Link href="#studios">
            <Button 
              size="lg"
              className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 rounded-full text-black"
            >
              Explore Bundles
            </Button>
          </Link>
        </div>
      </section>

      {/* Limited Time Offers Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Limited Time Offers
            </h2>
            <p className="text-white/60">
              Top deals available at PodX right now. Don't miss out on these savings!
            </p>
          </div>

          {/* Offer Cards Carousel */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {offers.map((offer, index) => (
                <div
                  key={index}
                  className="relative rounded-3xl overflow-hidden"
                >
                  {/* Background Image */}
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={offer.image}
                      alt={offer.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D9FC67] to-[#B8E050] text-black text-sm font-semibold">
                      {offer.badge}
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {offer.discount} {offer.title}
                      </h3>
                      <p className="text-white/70 text-sm mb-4 line-clamp-2">
                        {offer.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Button className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] rounded-full px-6 text-black">
                          Purchase now
                        </Button>
                        <div className="flex items-center gap-3">
                          <span className="text-white/50 line-through">
                            {offer.originalPrice}
                          </span>
                          <span className="text-xl font-bold text-[#D9FC67]">
                            {offer.salePrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

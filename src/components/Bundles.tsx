"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const offers = [
  {
    badge: "Only 20 Passes!",
    discount: "46% Off!",
    title: "Recording & Editing + Add-Ons: Power Pass!",
    description: "46% OFF — Save ₹15,000! Get 4 Sessions + Episode Edits, Photos, Thumbnails, and 30-min Strategy Session. Use all sessions this month, and get ₹5,000 Yanisa Studio Credit to use next month.",
    originalPrice: "₹37,500",
    salePrice: "₹22,500",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800",
  },
  {
    badge: "30 Passes Only!",
    discount: "64% Off!",
    title: "Recording + Live Mix + Add-Ons: Creator Pass!",
    description: "64% OFF — Save ₹20,000! Get 4 Recording + Live Mix sessions, Session Photos, and 30-min Strategy Session. Use all sessions this month, and get ₹5,000 Yanisa Studio Credit to use next month!",
    originalPrice: "₹50,000",
    salePrice: "₹18,000",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
  },
  {
    badge: "Limited!",
    discount: "35% Off!",
    title: "Starter Pack: Your First 2 Sessions + Edit",
    description: "35% OFF — Save ₹5,250! Perfect for new podcasters. Get 2 studio sessions with professional editing included. Everything you need to launch your podcast the right way.",
    originalPrice: "₹15,000",
    salePrice: "₹9,750",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
  },
];

export function Bundles() {
  const [activeOffer, setActiveOffer] = useState(0);

  return (
    <>
      {/* Create More, Spend Less Section */}
      <section className="py-32 bg-gradient-to-b from-[#D9FC67]/20 via-[#B8E050]/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D9FC67]/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
          <Link href="/book">
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Limited Time Offers</h2>
            <p className="text-white/60">Top deals available at Yanisa Studio right now. Don&apos;t miss out!</p>
          </div>

          {/* Mobile/Tablet Carousel */}
          <div className="relative">
            {/* Nav Arrows */}
            <button
              onClick={() => setActiveOffer((activeOffer - 1 + offers.length) % offers.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors lg:hidden"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setActiveOffer((activeOffer + 1) % offers.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>

            {/* Mobile: Single card */}
            <div className="lg:hidden">
              <OfferCard offer={offers[activeOffer]} />
            </div>

            {/* Desktop: All cards */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <OfferCard key={index} offer={offer} />
              ))}
            </div>

            {/* Mobile dots */}
            <div className="flex justify-center gap-2 mt-6 lg:hidden">
              {offers.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveOffer(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === activeOffer ? "bg-[#D9FC67]" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function OfferCard({ offer }: { offer: typeof offers[0] }) {
  return (
    <div className="relative rounded-3xl overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Image src={offer.image} alt={offer.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D9FC67] to-[#B8E050] text-black text-sm font-semibold">
          {offer.badge}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white mb-2">{offer.discount} {offer.title}</h3>
          <p className="text-white/70 text-sm mb-4 line-clamp-2">{offer.description}</p>
          <div className="flex items-center justify-between">
            <Link href="/book">
              <Button className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] rounded-full px-6 text-black font-semibold">
                Book Now
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-white/50 line-through text-sm">{offer.originalPrice}</span>
              <span className="text-xl font-bold text-[#D9FC67]">{offer.salePrice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

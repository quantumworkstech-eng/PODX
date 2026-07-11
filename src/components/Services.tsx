"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ServiceItem {
  title: string;
  description: string;
  image_url: string;
}

interface ServicesProps {
  data?: ServiceItem[];
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    title: "Hands-on Strategy Design",
    description:
      "Expert podcast concept and strategy tailored to your brand. We help you define your niche, audience, and content calendar for maximum impact.",
    image_url:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
  },
  {
    title: "End-to-End Production",
    description:
      "Record in our industry-leading studios with trained operators. Full post-production including editing, mixing, mastering, and show notes.",
    image_url:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
  },
  {
    title: "Distribution & Promotion",
    description:
      "Get your podcast on all major platforms. We handle distribution, create viral clips, and monitor your growth across channels.",
    image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  },
];

export function Services({ data }: ServicesProps) {
  const services = data && data.length > 0 ? data : DEFAULT_SERVICES;

  return (
    <section className="py-20 lg:py-28 bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-[#D9FC67] text-sm uppercase tracking-[0.2em] font-medium mb-3">
            What we offer
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-xl">
            Everything you need to go from idea to published
          </h2>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
            >
              {/* Background image with hover zoom */}
              <div className="absolute inset-0 transition-transform duration-700 ease-in-out group-hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.image_url}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Gradient overlay — always present, intensifies on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                {/* Step number */}
                <div className="text-[#D9FC67]/60 text-xs font-mono uppercase tracking-widest mb-3">
                  0{index + 1}
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                  {service.title}
                </h3>

                {/* Description — slides up on hover */}
                <p className="text-white/60 text-sm leading-relaxed mb-4 max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100">
                  {service.description}
                </p>

                {/* CTA link */}
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 text-[#D9FC67] text-sm font-medium opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  Learn More
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

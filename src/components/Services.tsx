"use client";

import Image from "next/image";
import { Lightbulb, Mic, TrendingUp } from "lucide-react";

const services = [
  {
    icon: Lightbulb,
    title: "Hands-on podcast concept and strategy design",
    description:
      "Our experts design tailored strategies to lay a strong foundation for your podcast. We work with you to conceptualise your show, and craft its bespoke branding identity. Your entire production calendar is managed for you.",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600",
  },
  {
    icon: Mic,
    title: "End-to-end turn-key podcast production",
    description:
      "Record at our 9 podcast studios in Mumbai. Our operators will handle all the technical aspects for you. When you're done, our post-production team will edit your podcast.",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600",
  },
  {
    icon: TrendingUp,
    title: "Chart-topping distribution and promotion",
    description:
      "Our team distributes your episodes and podcast clips across all platforms, following the latest best practices. We manage and monitor your show's growth through regular reporting, helping you to grow your podcast as trends evolve.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600",
  },
];

export function Services() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="flex flex-col">
              {/* Bullet point */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#D9FC67]" />
                <h3 className="text-lg font-semibold text-white">
                  {service.title}
                </h3>
              </div>
              
              {/* Description */}
              <p className="text-white/60 text-sm leading-relaxed mb-6 flex-grow">
                {service.description}
              </p>
              
              {/* Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";

const creators = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=300",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=300",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
];

export function ScrollingCreators() {
  return (
    <section className="py-12 bg-card overflow-hidden">
      <div className="relative">
        {/* First row - scroll left */}
        <div className="flex gap-4 animate-scroll mb-4">
          {[...creators, ...creators].map((image, index) => (
            <div
              key={`row1-${index}`}
              className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden"
            >
              <Image
                src={image}
                alt={`Creator ${index + 1}`}
                width={128}
                height={128}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>

        {/* Second row - scroll right */}
        <div className="flex gap-4 animate-scroll-reverse">
          {[...creators.reverse(), ...creators].map((image, index) => (
            <div
              key={`row2-${index}`}
              className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden"
            >
              <Image
                src={image}
                alt={`Creator ${index + 1}`}
                width={128}
                height={128}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


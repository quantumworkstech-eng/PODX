"use client";

import { useState, useEffect } from "react";

interface WeHelpCreateProps {
  items?: string[];
}

const DEFAULT_ITEMS = [
  "Podcasts",
  "Viral Videos",
  "Masterclasses",
  "YouTube Videos",
  "Video Content",
  "Audio Dramas",
];

export function WeHelpCreate({ items }: WeHelpCreateProps) {
  const contentTypes = items && items.length > 0 ? items : DEFAULT_ITEMS;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contentTypes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [contentTypes.length]);

  return (
    <section className="py-24 lg:py-36 bg-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label */}
        <p className="text-white/40 text-sm uppercase tracking-[0.2em] font-medium mb-6 text-center">
          We help you create
        </p>

        {/* Animated content type */}
        <div className="h-20 sm:h-24 lg:h-32 overflow-hidden relative flex items-center justify-center">
          {contentTypes.map((type, index) => (
            <div
              key={index}
              className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
              style={{
                opacity: index === currentIndex ? 1 : 0,
                transform:
                  index === currentIndex
                    ? "translateY(0)"
                    : index < currentIndex
                    ? "translateY(-60px)"
                    : "translateY(60px)",
                pointerEvents: index === currentIndex ? "auto" : "none",
              }}
            >
              <span
                className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold text-center leading-none"
                style={{
                  background: "linear-gradient(135deg, #D9FC67 0%, #B8E050 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {type}
              </span>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {contentTypes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-[#D9FC67] w-8"
                  : "bg-white/20 w-2 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

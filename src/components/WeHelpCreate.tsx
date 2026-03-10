"use client";

import { useState, useEffect } from "react";

const contentTypes = [
  "Podcasts",
  "Viral Videos",
  "Masterclasses",
  "YouTube Videos",
  "Video Content",
];

export function WeHelpCreate() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contentTypes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 lg:py-32 bg-black min-h-[300px] flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
          We help you create
        </h2>
        
        {/* Animated content types */}
        <div className="h-16 sm:h-20 overflow-hidden relative">
          {contentTypes.map((type, index) => (
            <div
              key={index}
              className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
              style={{
                opacity: index === currentIndex ? 1 : 0,
                transform: index === currentIndex
                  ? 'translateY(0)'
                  : index < currentIndex
                    ? 'translateY(-40px)'
                    : 'translateY(40px)',
                pointerEvents: index === currentIndex ? 'auto' : 'none',
              }}
            >
              <span
                className="text-4xl sm:text-5xl lg:text-6xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #D9FC67 0%, #B8E050 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {type}
              </span>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {contentTypes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-[#D9FC67] w-6"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


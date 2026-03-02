"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Check, ChevronLeft, Building2, CalendarDays, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCities, City } from "@/lib/data";

interface CitySelectionProps {
  /** Called when both city AND mode have been selected */
  onComplete: (city: string, mode?: "studio" | "date") => void;
  /** Pre-select a city (from a previous session) */
  initialCity?: string;
}

export function CitySelection({ onComplete, initialCity }: CitySelectionProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(initialCity ?? null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const modeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Scroll to mode selection when a city is chosen
  useEffect(() => {
    if (selectedCity && modeRef.current) {
      setTimeout(
        () => modeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    }
  }, [selectedCity]);

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=2000&q=80"
          alt="Podcast studio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black" />
      </div>

      {/* Header */}
      <header className="relative p-6 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Exit</span>
        </button>
        <span className="text-2xl font-bold tracking-tight text-white">
          p<span className="text-[#D9FC67]">o</span>dX
        </span>
        <div className="w-16" />
      </header>

      {/* ── Step 1: City selection ──────────────────────────────────────────── */}
      <section className="relative py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/60 text-sm mb-4">
              <MapPin className="w-3.5 h-3.5" />
              Step 1 of 2
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Where are you located?
            </h1>
            <p className="text-white/60 text-lg">
              Choose your city to find nearby podcast studios
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a city..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors text-lg"
              />
            </div>
          </div>

          {/* City grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCities.length === 0 ? (
            <p className="text-center py-12 text-white/40">No cities found</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCities.map((city) => {
                const isSelected = selectedCity === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCity(city.id)}
                    className={cn(
                      "relative rounded-2xl overflow-hidden border-2 transition-all group",
                      isSelected
                        ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30 scale-[1.02]"
                        : "border-transparent hover:border-white/30"
                    )}
                  >
                    <div className="aspect-[4/3]">
                      <img
                        src={city.image_url}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">{city.name}</span>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#D9FC67] flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Step 2: Mode selection — slides in after city is chosen ──────────── */}
      {selectedCity && (
        <section
          ref={modeRef}
          className="relative py-14 px-6 border-t border-white/10 bg-black/60 backdrop-blur-sm"
        >
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9FC67]/10 border border-[#D9FC67]/20 text-[#D9FC67] text-xs font-medium mb-3">
                <Check className="w-3 h-3" />
                {cities.find((c) => c.id === selectedCity)?.name ?? selectedCity}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium mb-3 ml-2">
                Step 2 of 2
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                How would you like to book?
              </h2>
              <p className="text-white/60">
                Start by browsing studios or pick a date first
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Studio-first */}
              <button
                onClick={() => onComplete(selectedCity, "studio")}
                className="group relative rounded-2xl border border-white/10 p-8 text-left hover:border-[#D9FC67]/60 hover:bg-[#D9FC67]/5 transition-all duration-300 bg-white/3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#D9FC67]/10 flex items-center justify-center mb-5 group-hover:bg-[#D9FC67]/20 transition-colors">
                  <Building2 className="w-7 h-7 text-[#D9FC67]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Browse Studios</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  Explore studios, see setup, pricing, and equipment — then pick
                  your preferred date and time.
                </p>
                <div className="flex items-center gap-2 text-[#D9FC67] text-sm font-semibold">
                  Choose studio first
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Date-first */}
              <button
                onClick={() => onComplete(selectedCity, "date")}
                className="group relative rounded-2xl border border-white/10 p-8 text-left hover:border-[#D9FC67]/60 hover:bg-[#D9FC67]/5 transition-all duration-300 bg-white/3"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
                  <CalendarDays className="w-7 h-7 text-white/60" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pick a Date</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  Choose your preferred date and time first, then see which
                  studios are available for your slot.
                </p>
                <div className="flex items-center gap-2 text-white/50 text-sm font-semibold group-hover:text-white/80 transition-colors">
                  Choose date first
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="h-16 relative" />
    </div>
  );
}

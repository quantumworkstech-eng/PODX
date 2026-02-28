"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowRight, Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitySelectionProps {
  onComplete: (city: string) => void;
}

const cities = [
  { id: "mumbai", name: "Mumbai", image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80" },
  { id: "delhi", name: "Delhi", image: "https://images.unsplash.com/photo-1585506935092-10651126cebb?w=800&q=80" },
  { id: "bangalore", name: "Bangalore", image: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=800&q=80" },
  { id: "hyderabad", name: "Hyderabad", image: "https://images.unsplash.com/photo-1613156730504-7b66c56f3ae8?w=800&q=80" },
  { id: "pune", name: "Pune", image: "https://images.unsplash.com/photo-1557191446-6f1a73a2fcc1?w=800&q=80" },
  { id: "chennai", name: "Chennai", image: "https://images.unsplash.com/photo-1580637249871-a1119e27f9d9?w=800&q=80" },
  { id: "kolkata", name: "Kolkata", image: "https://images.unsplash.com/photo-1583508916039-35a4d5c78da4?w=800&q=80" },
  { id: "dubai", name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80" },
];

export function CitySelection({ onComplete }: CitySelectionProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedCity) {
      onComplete(selectedCity);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=2000&q=80"
          alt="Podcast studio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
      </div>

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
        <div className="w-20" />
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Select Your City
          </h1>
          <p className="text-white/60 text-lg">
            Choose your location to find available studios
          </p>
        </div>

        <div className="max-w-md w-full mb-8">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl w-full">
          {filteredCities.map((city) => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id)}
              className={cn(
                "relative rounded-2xl overflow-hidden border-2 transition-all group",
                selectedCity === city.id
                  ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30"
                  : "border-transparent hover:border-white/30"
              )}
            >
              <div className="aspect-[4/3]">
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                <span className="text-white font-semibold">{city.name}</span>
                {selectedCity === city.id && (
                  <div className="w-6 h-6 rounded-full bg-[#D9FC67] flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <Button
            onClick={handleContinue}
            disabled={!selectedCity}
            className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}

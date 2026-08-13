import type { StudioBookingInventory } from "./studio-booking-inventory";

export type { StudioBookingInventory };

export interface Studio {
  id: string;
  name: string;
  slug: string;
  cover_image: string;
  image_urls?: string[];
  video_url?: string;
  setup_options?: StudioSetupOption[];
  location: {
    city: string;
    area: string;
    address: string;
  };
  /** Canonical customer-facing per-hour price: cheapest package's price after its discount (fallback: cheapest room). */
  price_per_hour: number;
  /** Original base price, present only when a discount applies — shown struck-through beside price_per_hour. */
  original_price_per_hour?: number;
  currency: string;
  capacity: number;
  equipment: Equipment[];
  /** Structured equipment, services & add-on catalog for booking UI */
  booking_inventory?: StudioBookingInventory | null;
  rating: number;
  review_count: number;
  is_instant_bookable: boolean;
  description: string;
  amenities: string[];
}

export interface StudioSetupOption {
  id: string;
  name: string;
  description?: string | null;
  /** Primary photo — the first entry of `images` when present. */
  image_url: string;
  /** All photos for this room/setup, primary first. */
  images?: string[];
  capacity?: number | null;
  /** Room rate, shown as context only — booking price comes from the package. */
  price_per_hour?: number | null;
}

export interface Equipment {
  id: string;
  name: string;
  icon: EquipmentIcon;
}

export type EquipmentIcon = 
  | "microphone" 
  | "headphones" 
  | "camera" 
  | "lighting" 
  | "mixer" 
  | "monitor" 
  | "soundproofing"
  | "teleprompter";

export interface FilterState {
  priceRange: [number, number];
  capacity: number | null;
  equipment: string[];
  isInstantBookable: boolean | null;
}

export type SortOption = 
  | "price_low" 
  | "price_high" 
  | "popularity" 
  | "rating";

export interface SearchParams {
  location: string;
  date?: string;
  time?: string;
}

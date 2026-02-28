export interface Studio {
  id: string;
  name: string;
  slug: string;
  cover_image: string;
  location: {
    city: string;
    area: string;
    address: string;
  };
  price_per_hour: number;
  currency: string;
  capacity: number;
  equipment: Equipment[];
  rating: number;
  review_count: number;
  is_instant_bookable: boolean;
  has_video_support: boolean;
  description: string;
  amenities: string[];
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
  hasVideoSupport: boolean | null;
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


import { Studio } from "./types";

const PARTNER_STUDIOS_KEY = "partner_studios";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function getAllStudios(): Studio[] {
  const staticStudios: Studio[] = [
    {
      id: "1",
      name: "Nest",
      slug: "nest-studio",
      cover_image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90",
      location: {
        city: "Mumbai",
        area: "Andheri West",
        address: "501, Business Hub, Veera Desai Road"
      },
      price_per_hour: 2500,
      currency: "₹",
      capacity: 4,
      equipment: [
        { id: "mic", name: "Shure SM7B Microphones", icon: "microphone" },
        { id: "headphones", name: "Sony MDR-7506 Headphones", icon: "headphones" },
        { id: "camera", name: "Sony A7 IV Cameras", icon: "camera" },
        { id: "lighting", name: "Professional LED Lighting", icon: "lighting" },
        { id: "mixer", name: "RØDECaster Pro II", icon: "mixer" }
      ],
      rating: 4.9,
      review_count: 127,
      is_instant_bookable: true,
      has_video_support: true,
      description: "Fireside, Cozy, Light & Airy",
      amenities: ["WiFi", "AC", "Parking", "Green Room", "Refreshments"]
    },
    {
      id: "2",
      name: "Apex",
      slug: "apex-studio",
      cover_image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&q=90",
      location: {
        city: "Mumbai",
        area: "Bandra Kurla Complex",
        address: "Tower A, Trade Center, BKC"
      },
      price_per_hour: 4500,
      currency: "₹",
      capacity: 5,
      equipment: [
        { id: "mic", name: "Neumann U87 Microphones", icon: "microphone" },
        { id: "headphones", name: "Beyerdynamic DT 770 Pro", icon: "headphones" },
        { id: "camera", name: "Sony FX6 Cinema Cameras", icon: "camera" },
        { id: "lighting", name: "ARRI LED Panel System", icon: "lighting" },
        { id: "mixer", name: "Zoom PodTrak P8", icon: "mixer" },
        { id: "teleprompter", name: "Professional Teleprompter", icon: "teleprompter" }
      ],
      rating: 4.8,
      review_count: 89,
      is_instant_bookable: true,
      has_video_support: true,
      description: "Versatile, Industrial, Roundtables",
      amenities: ["WiFi", "AC", "Valet Parking", "Green Room", "Catering", "Makeup Room"]
    },
    {
      id: "3",
      name: "Eden",
      slug: "eden-studio",
      cover_image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600&q=90",
      location: {
        city: "Delhi",
        area: "Connaught Place",
        address: "F-12, Inner Circle, CP"
      },
      price_per_hour: 3000,
      currency: "₹",
      capacity: 4,
      equipment: [
        { id: "mic", name: "Audio-Technica AT2020 Microphones", icon: "microphone" },
        { id: "headphones", name: "Audio-Technica ATH-M50x", icon: "headphones" },
        { id: "camera", name: "Sony A7C Cameras", icon: "camera" },
        { id: "lighting", name: "RGB LED Lighting System", icon: "lighting" },
        { id: "mixer", name: "RØDECaster Pro II", icon: "mixer" }
      ],
      rating: 4.7,
      review_count: 156,
      is_instant_bookable: false,
      has_video_support: true,
      description: "Urban Jungle, Moody, RGB Lighting",
      amenities: ["WiFi", "AC", "Street Parking", "Refreshments"]
    },
    {
      id: "4",
      name: "Cove",
      slug: "cove-studio",
      cover_image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&q=90",
      location: {
        city: "Bangalore",
        area: "Koramangala",
        address: "4th Block, 80 Feet Road"
      },
      price_per_hour: 2800,
      currency: "₹",
      capacity: 4,
      equipment: [
        { id: "mic", name: "Shure MV7 Microphones", icon: "microphone" },
        { id: "headphones", name: "Sony WH-1000XM4", icon: "headphones" },
        { id: "camera", name: "Canon EOS R6", icon: "camera" },
        { id: "lighting", name: "Softbox LED Lighting", icon: "lighting" }
      ],
      rating: 4.6,
      review_count: 78,
      is_instant_bookable: true,
      has_video_support: true,
      description: "Dramatic, Warm, Heart-to-Heart",
      amenities: ["WiFi", "AC", "Parking", "Coffee Bar"]
    },
    {
      id: "5",
      name: "Exec",
      slug: "exec-studio",
      cover_image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=90",
      location: {
        city: "Pune",
        area: "Hinjewadi",
        address: "Phase 1, IT Park, Hinjewadi"
      },
      price_per_hour: 4000,
      currency: "₹",
      capacity: 2,
      equipment: [
        { id: "mic", name: "Shure SM7dB Microphones", icon: "microphone" },
        { id: "headphones", name: "Focal Listen Pro", icon: "headphones" },
        { id: "camera", name: "Sony FX3 Cameras", icon: "camera" },
        { id: "lighting", name: "Aputure LED Lighting", icon: "lighting" },
        { id: "mixer", name: "Universal Audio Volt", icon: "mixer" },
        { id: "monitor", name: "4K Reference Monitors", icon: "monitor" }
      ],
      rating: 4.8,
      review_count: 92,
      is_instant_bookable: true,
      has_video_support: true,
      description: "Sophisticated, Minimalist, Professional",
      amenities: ["WiFi", "AC", "Free Parking", "Meeting Room", "Catering Available"]
    },
    {
      id: "6",
      name: "Edge",
      slug: "edge-studio",
      cover_image: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=1600&q=90",
      location: {
        city: "Hyderabad",
        area: "Jubilee Hills",
        address: "Road No. 36, Jubilee Hills"
      },
      price_per_hour: 3500,
      currency: "₹",
      capacity: 2,
      equipment: [
        { id: "mic", name: "Electro-Voice RE20 Microphones", icon: "microphone" },
        { id: "headphones", name: "Beyerdynamic DT 990 Pro", icon: "headphones" },
        { id: "camera", name: "Blackmagic Pocket 6K", icon: "camera" },
        { id: "lighting", name: "RGB Neon Lighting", icon: "lighting" },
        { id: "mixer", name: "GoXLR Audio Interface", icon: "mixer" }
      ],
      rating: 4.9,
      review_count: 67,
      is_instant_bookable: false,
      has_video_support: true,
      description: "Eye-Catching, Bold, RGB Lighting",
      amenities: ["WiFi", "AC", "Validated Parking", "Lounge Area"]
    },
    {
      id: "7",
      name: "Onyx",
      slug: "onyx-studio",
      cover_image: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=1600&q=90",
      location: {
        city: "Bangalore",
        area: "Indiranagar",
        address: "100 Feet Road, HAL 2nd Stage"
      },
      price_per_hour: 2200,
      currency: "₹",
      capacity: 2,
      equipment: [
        { id: "mic", name: "Blue Yeti Pro Microphones", icon: "microphone" },
        { id: "headphones", name: "Sennheiser HD 560S", icon: "headphones" },
        { id: "lighting", name: "Ring Light Setup", icon: "lighting" },
        { id: "soundproofing", name: "Premium Soundproofing", icon: "soundproofing" }
      ],
      rating: 4.5,
      review_count: 234,
      is_instant_bookable: true,
      has_video_support: false,
      description: "Offbeat, Daring, RGB Lighting",
      amenities: ["WiFi", "AC", "Parking", "Protein Shakes"]
    },
    {
      id: "8",
      name: "Peak",
      slug: "peak-studio",
      cover_image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1600&q=90",
      location: {
        city: "Chennai",
        area: "T. Nagar",
        address: "Usman Road, T. Nagar"
      },
      price_per_hour: 1800,
      currency: "₹",
      capacity: 2,
      equipment: [
        { id: "mic", name: "Rode PodMic Microphones", icon: "microphone" },
        { id: "headphones", name: "Audio-Technica ATH-M30x", icon: "headphones" },
        { id: "lighting", name: "LED Panel Lights", icon: "lighting" }
      ],
      rating: 4.4,
      review_count: 45,
      is_instant_bookable: true,
      has_video_support: false,
      description: "Bright, Organic, Health & Fitness",
      amenities: ["WiFi", "AC", "Nearby Parking"]
    },
    {
      id: "9",
      name: "Club",
      slug: "club-studio",
      cover_image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=90",
      location: {
        city: "Kolkata",
        area: "Salt Lake",
        address: "Sector V, Salt Lake City"
      },
      price_per_hour: 2000,
      currency: "₹",
      capacity: 2,
      equipment: [
        { id: "mic", name: "Samson Q2U Microphones", icon: "microphone" },
        { id: "headphones", name: "Sony MDR-7506", icon: "headphones" },
        { id: "camera", name: "Canon EOS M50", icon: "camera" },
        { id: "lighting", name: "LED Softbox Kit", icon: "lighting" }
      ],
      rating: 4.3,
      review_count: 112,
      is_instant_bookable: true,
      has_video_support: true,
      description: "Playful, Edgy, RGB Lighting",
      amenities: ["WiFi", "AC", "Parking"]
    }
  ];

  try {
    const partnerStudiosData = localStorage.getItem(PARTNER_STUDIOS_KEY);
    if (partnerStudiosData) {
      const partnerStudios = JSON.parse(partnerStudiosData);
      
      const partnerStudiosFormatted: Studio[] = partnerStudios
        .filter((s: any) => s.status === "active")
        .map((s: any) => ({
          id: `partner-${s.id}`,
          name: s.name,
          slug: generateSlug(s.name),
          cover_image: s.images && s.images.length > 0 ? s.images[0] : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90",
          location: {
            city: s.city || "Mumbai",
            area: s.area || "",
            address: s.address || ""
          },
          price_per_hour: s.price_per_hour || 1500,
          currency: "₹",
          capacity: s.capacity || 2,
          equipment: (s.equipment || []).map((eq: string, idx: number) => ({
            id: `eq-${idx}`,
            name: eq,
            icon: "microphone"
          })),
          rating: 5.0,
          review_count: 0,
          is_instant_bookable: true,
          has_video_support: true,
          description: s.description || "",
          amenities: ["WiFi", "AC", "Parking"]
        }));

      return [...staticStudios, ...partnerStudiosFormatted];
    }
  } catch (error) {
    console.error("Error loading partner studios:", error);
  }

  return staticStudios;
}

export const cities = [
  "All Cities",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata"
];

export const equipmentOptions = [
  { id: "microphone", name: "Microphones" },
  { id: "headphones", name: "Headphones" },
  { id: "camera", name: "Cameras" },
  { id: "lighting", name: "Lighting" },
  { id: "mixer", name: "Audio Mixer" },
  { id: "teleprompter", name: "Teleprompter" },
  { id: "soundproofing", name: "Soundproofing" },
  { id: "monitor", name: "Reference Monitors" }
];

export const studios = getAllStudios();

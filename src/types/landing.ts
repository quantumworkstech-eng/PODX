// ============================================================
// Partner Landing Page Builder — Type Definitions
// ============================================================

export type SectionType =
  | "hero"
  | "studios"
  | "features"
  | "reviews"
  | "about"
  | "cta"
  | "contact"
  | "footer"
  | "custom";

// ── Per-section content shapes ───────────────────────────────────────────────

export interface HeroContent {
  heading: string;
  subheading?: string;
  description?: string;
  cta_primary_text?: string;
  cta_primary_url?: string;
  cta_secondary_text?: string;
  cta_secondary_url?: string;
  background_image_url?: string;
  background_video_url?: string;
  overlay_opacity?: number;
}

export interface StudiosContent {
  heading?: string;
  subheading?: string;
  description?: string;
  columns?: 2 | 3 | 4;
  show_price?: boolean;
  show_capacity?: boolean;
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

export interface FeaturesContent {
  heading?: string;
  subheading?: string;
  items: FeatureItem[];
}

export interface ReviewItem {
  name: string;
  role?: string;
  quote: string;
  rating?: number;
  avatar_url?: string;
}

export interface ReviewsContent {
  heading?: string;
  subheading?: string;
  items?: ReviewItem[];
  show_dynamic?: boolean;
}

export interface AboutContent {
  heading?: string;
  description: string;
  image_url?: string;
  image_position?: "left" | "right";
}

export interface CTAContent {
  heading: string;
  subheading?: string;
  cta_text?: string;
  cta_url?: string;
  background_style?: "gradient" | "solid" | "image";
  background_image_url?: string;
}

export interface ContactContent {
  heading?: string;
  subheading?: string;
  show_email?: boolean;
  show_phone?: boolean;
  show_address?: boolean;
}

export interface FooterContent {
  tagline?: string;
  show_social?: boolean;
  show_nav?: boolean;
  nav_links?: { label: string; url: string }[];
  copyright_text?: string;
}

export type CustomBlockType = "text" | "image" | "video" | "button";

export interface CustomBlock {
  id: string;
  type: CustomBlockType;
  content: string;
  url?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg" | "xl";
}

export interface CustomContent {
  heading?: string;
  blocks: CustomBlock[];
}

export type SectionContent =
  | HeroContent
  | StudiosContent
  | FeaturesContent
  | ReviewsContent
  | AboutContent
  | CTAContent
  | ContactContent
  | FooterContent
  | CustomContent;

// ── Core entities ────────────────────────────────────────────────────────────

export interface LandingSection {
  id: string;
  partner_id: string;
  type: SectionType;
  order_index: number;
  content_json: SectionContent;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  impression_count?: number;
}

export interface LandingPage {
  id: string;
  partner_id: string;
  status: "draft" | "published";
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  created_at: string;
  updated_at: string;
}

// ── Template definition ──────────────────────────────────────────────────────

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  sections: Omit<LandingSection, "id" | "partner_id" | "created_at" | "updated_at">[];
}

// ── Branding (mirrors partner_branding row — subset used in sections) ─────────

export interface SectionBranding {
  brand_name: string;
  partner_slug: string;
  logo_url?: string;
  tagline?: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  background_color: string;
  text_color: string;
  button_text_color: string;
  font_family?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  website_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  partner_id: string;
}

// ── Section label map (for UI) ────────────────────────────────────────────────

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  studios: "Studios",
  features: "Features",
  reviews: "Reviews",
  about: "About",
  cta: "CTA Banner",
  contact: "Contact",
  footer: "Footer",
  custom: "Custom",
};

export const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  hero: "Full-width banner with headline and call to action",
  studios: "Auto-fetched grid of your studios",
  features: "Icon + text feature highlights",
  reviews: "Customer reviews and ratings",
  about: "Description about your brand",
  cta: "Conversion-focused call-to-action block",
  contact: "Contact details (email, phone, address)",
  footer: "Footer with social links and navigation",
  custom: "Build your own section with text, images, videos, and buttons",
};

// ── Default content per section type ─────────────────────────────────────────

export const DEFAULT_SECTION_CONTENT: Record<SectionType, SectionContent> = {
  hero: {
    heading: "Book Your Studio Session",
    subheading: "Professional recording spaces for creators and podcasters",
    cta_primary_text: "Browse Studios",
    cta_secondary_text: "Get in Touch",
  } as HeroContent,
  studios: {
    heading: "Our Studios",
    subheading: "Professional spaces designed for creators",
    columns: 3,
    show_price: true,
    show_capacity: true,
  } as StudiosContent,
  features: {
    heading: "Everything You Need",
    subheading: "World-class equipment and spaces",
    items: [
      { icon: "Mic", title: "Professional Equipment", description: "Studio-grade microphones and mixers" },
      { icon: "Headphones", title: "Acoustic Treatment", description: "Soundproofed rooms for crystal-clear recordings" },
      { icon: "Zap", title: "Instant Booking", description: "Real-time availability and instant confirmation" },
    ],
  } as FeaturesContent,
  reviews: {
    heading: "What Our Clients Say",
    subheading: "Trusted by creators across India",
    show_dynamic: true,
    items: [],
  } as ReviewsContent,
  about: {
    heading: "About Us",
    description: "We provide world-class recording studios for podcasters, content creators, and brands.",
    image_position: "right",
  } as AboutContent,
  cta: {
    heading: "Ready to Record Your Next Episode?",
    subheading: "Join hundreds of creators who trust us for their recording needs.",
    cta_text: "Book a Studio Now",
    background_style: "gradient",
  } as CTAContent,
  contact: {
    heading: "Get in Touch",
    subheading: "We'd love to help you find the perfect studio.",
    show_email: true,
    show_phone: true,
    show_address: true,
  } as ContactContent,
  footer: {
    show_social: true,
    show_nav: true,
    nav_links: [
      { label: "Studios", url: "#studios" },
      { label: "About", url: "#about" },
      { label: "Contact", url: "#contact" },
    ],
  } as FooterContent,
  custom: {
    heading: "Custom Section",
    blocks: [],
  } as CustomContent,
};

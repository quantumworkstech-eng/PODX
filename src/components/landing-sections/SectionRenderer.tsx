"use client";

import type { LandingSection, SectionBranding } from "@/types/landing";
import type {
  HeroContent, StudiosContent, FeaturesContent, ReviewsContent,
  AboutContent, CTAContent, ContactContent, FooterContent, CustomContent,
} from "@/types/landing";
import { HeroSection } from "./HeroSection";
import { StudiosSection } from "./StudiosSection";
import { FeaturesSection } from "./FeaturesSection";
import { ReviewsSection } from "./ReviewsSection";
import { AboutSection } from "./AboutSection";
import { CTASection } from "./CTASection";
import { ContactSection } from "./ContactSection";
import { FooterSection } from "./FooterSection";
import { CustomSection } from "./CustomSection";

interface Studio {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  city: string;
  address: string;
  featured_image_url: string;
  video_url?: string;
  studio_images?: { image_url: string; display_order?: number }[];
  is_verified: boolean;
  rooms: {
    id: string; name: string; capacity: number; price_per_hour: number;
    min_booking_hours: number; max_booking_hours: number; is_active: boolean;
  }[];
}

interface Props {
  section: LandingSection;
  branding: SectionBranding;
  studios?: Studio[];
  isPreview?: boolean;
  onBookNow?: (studio: Studio) => void;
  onViewDetails?: (studio: Studio) => void;
  onScrollToStudios?: () => void;
}

export function SectionRenderer({
  section,
  branding,
  studios = [],
  isPreview = false,
  onBookNow,
  onViewDetails,
  onScrollToStudios,
}: Props) {
  if (!section.is_visible && !isPreview) return null;

  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          content={section.content_json as HeroContent}
          branding={branding}
          onCtaClick={onScrollToStudios}
        />
      );

    case "studios":
      return (
        <StudiosSection
          content={section.content_json as StudiosContent}
          branding={branding}
          studios={studios}
          onBookNow={onBookNow}
          onViewDetails={onViewDetails}
        />
      );

    case "features":
      return (
        <FeaturesSection
          content={section.content_json as FeaturesContent}
          branding={branding}
        />
      );

    case "reviews":
      return (
        <ReviewsSection
          content={section.content_json as ReviewsContent}
          branding={branding}
          isPreview={isPreview}
        />
      );

    case "about":
      return (
        <AboutSection
          content={section.content_json as AboutContent}
          branding={branding}
        />
      );

    case "cta":
      return (
        <CTASection
          content={section.content_json as CTAContent}
          branding={branding}
          onCtaClick={onScrollToStudios}
        />
      );

    case "contact":
      return (
        <ContactSection
          content={section.content_json as ContactContent}
          branding={branding}
        />
      );

    case "footer":
      return (
        <FooterSection
          content={section.content_json as FooterContent}
          branding={branding}
        />
      );

    case "custom":
      return (
        <CustomSection
          content={section.content_json as CustomContent}
          branding={branding}
        />
      );

    default:
      return null;
  }
}

import { Hero } from "@/components/Hero";
import { LandingMarquee } from "@/components/LandingMarquee";
import { WeHelpCreate } from "@/components/WeHelpCreate";
import { Services } from "@/components/Services";
import { HowItWorks } from "@/components/HowItWorks";
import { SocialProof } from "@/components/SocialProof";
import { Testimonials } from "@/components/Testimonials";
import { ReadyToStart } from "@/components/ReadyToStart";
import { CreatedInStudios } from "@/components/CreatedInStudios";
import { Bundles } from "@/components/Bundles";
import { BookStudioBanner } from "@/components/BookStudioBanner";
import { StudioSection } from "@/components/StudioSection";
import { NotJustBest } from "@/components/NotJustBest";
import { FAQ } from "@/components/FAQ";
import { CTABlock } from "@/components/CTABlock";
import { Footer } from "@/components/Footer";

/**
 * The pre-CMS homepage, driven by the legacy `landing_content` table.
 * Rendered only until the Client Landing Page is published from the admin CMS,
 * so the site is never blank while the new content is being set up.
 */

interface LandingContent {
  hero?: Record<string, unknown>;
  stats?: Array<{ number: string; label: string }>;
  marquee?: string[];
  we_help_create?: string[];
  services?: Array<{ title: string; description: string; image_url: string }>;
  how_it_works?: Array<{ step: string; title: string; description: string }>;
  testimonials?: Array<{ name: string; role: string; quote: string; avatar_url?: string }>;
  faq?: Array<{ question: string; answer: string }>;
  footer?: Record<string, unknown>;
}

async function getLandingContent(): Promise<LandingContent> {
  try {
    // Use absolute URL for server-side fetch in Next.js App Router
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/landing`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.content || {};
  } catch {
    return {};
  }
}

export async function LegacyHome() {
  const cms = await getLandingContent();

  return (
    <>
      {/* Hero Section */}
      <Hero data={cms.hero as Parameters<typeof Hero>[0]["data"]} stats={cms.stats} />

      {/* Marquee — platform names scrolling */}
      <LandingMarquee items={cms.marquee} />

      {/* We help you create — animated text */}
      <WeHelpCreate items={cms.we_help_create} />

      {/* Services — 3 cards with images */}
      <Services data={cms.services} />

      {/* How It Works — 4 steps */}
      <HowItWorks data={cms.how_it_works} />

      {/* Social Proof — Brands + Influencers */}
      <SocialProof />

      {/* Testimonials */}
      <Testimonials data={cms.testimonials} />

      {/* Ready to get started */}
      <ReadyToStart />

      {/* Created in our studios — Large carousel */}
      <CreatedInStudios />

      {/* Bundles + Limited Time Offers */}
      <Bundles />

      {/* Book a studio banner */}
      <BookStudioBanner />

      {/* Studios Section — Tab navigation carousel */}
      <StudioSection />

      {/* Not just best studio — 3 cards */}
      <NotJustBest />

      {/* FAQ Section */}
      <FAQ data={cms.faq} />

      {/* CTA Block */}
      <CTABlock
        headline="Ready to start your podcast journey?"
        primaryText={(cms.hero?.cta_primary_text as string) || "Browse Studios"}
        primaryUrl={(cms.hero?.cta_primary_url as string) || "/studios"}
        secondaryText="Talk to an Expert"
        secondaryUrl="/contact"
      />

      {/* Footer */}
      <Footer data={cms.footer as Parameters<typeof Footer>[0]["data"]} />
    </>
  );
}

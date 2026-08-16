import { Bundles } from "@/components/Bundles";
import { BookStudioBanner } from "@/components/BookStudioBanner";
import { CTABlock } from "@/components/CTABlock";
import { CreatedInStudios } from "@/components/CreatedInStudios";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { LandingMarquee } from "@/components/LandingMarquee";
import { NotJustBest } from "@/components/NotJustBest";
import { ReadyToStart } from "@/components/ReadyToStart";
import { Services } from "@/components/Services";
import { SocialProof } from "@/components/SocialProof";
import { StudioSection } from "@/components/StudioSection";
import { Testimonials } from "@/components/Testimonials";
import { WeHelpCreate } from "@/components/WeHelpCreate";
import { CmsSection } from "./sections";
import { items, num, text } from "@/lib/cms/render";
import type { CmsSection as Section } from "@/lib/cms/types";

/**
 * Client landing page renderer.
 * Section types map onto the existing homepage components so the design is
 * unchanged, while order, visibility and copy all come from the CMS. Types
 * without a bespoke homepage design fall through to the generic renderer, so
 * new section types work here too.
 */

const BUILT_IN: Record<string, () => React.ReactNode> = {
  social_proof: SocialProof,
  ready_to_start: ReadyToStart,
  created_in_studios: CreatedInStudios,
  bundles: Bundles,
  book_studio_banner: BookStudioBanner,
  studio_section: StudioSection,
  not_just_best: NotJustBest,
};

function renderHomeSection(section: Section) {
  const c = section.content;

  switch (section.type) {
    case "hero": {
      const video = text(c, "background_video_url");
      return (
        <Hero
          data={{
            headline: text(c, "heading"),
            subheadline: text(c, "description"),
            cta_primary_text: text(c, "cta_text"),
            cta_primary_url: text(c, "cta_url"),
            cta_secondary_text: text(c, "cta_secondary_text"),
            cta_secondary_url: text(c, "cta_secondary_url"),
            media_type: video ? "video" : "image",
            media_url: video || text(c, "background_image_url"),
            overlay_opacity: num(c, "overlay_opacity", 60),
          }}
          stats={items(section, "stats").map((s) => ({
            number: String(s.value ?? ""),
            label: String(s.label ?? ""),
          }))}
        />
      );
    }

    case "text_ticker": {
      const entries = items(section).map((i) => String(i.text ?? "")).filter(Boolean);
      if (text(c, "display") === "animated_words") return <WeHelpCreate items={entries} />;
      if (text(c, "display") === "marquee") return <LandingMarquee items={entries} />;
      return <CmsSection section={section} />;
    }

    case "cards":
      return (
        <Services
          data={items(section).map((i) => ({
            title: String(i.title ?? ""),
            description: String(i.description ?? ""),
            image_url: String(i.image_url ?? ""),
          }))}
        />
      );

    case "steps":
      return (
        <HowItWorks
          data={items(section).map((i) => ({
            step: String(i.step ?? ""),
            title: String(i.title ?? ""),
            description: String(i.description ?? ""),
          }))}
        />
      );

    case "testimonials":
      return (
        <Testimonials
          data={items(section).map((i) => ({
            name: String(i.name ?? ""),
            role: String(i.role ?? ""),
            quote: String(i.quote ?? ""),
            avatar_url: String(i.avatar_url ?? ""),
          }))}
        />
      );

    case "faq":
      return (
        <FAQ
          data={items(section).map((i) => ({
            question: String(i.question ?? ""),
            answer: String(i.answer ?? ""),
          }))}
        />
      );

    case "cta":
      return (
        <CTABlock
          headline={text(c, "heading")}
          primaryText={text(c, "cta_text")}
          primaryUrl={text(c, "cta_url")}
          secondaryText={text(c, "cta_secondary_text")}
          secondaryUrl={text(c, "cta_secondary_url")}
        />
      );

    case "footer":
      return (
        <Footer
          data={{
            tagline: text(c, "tagline"),
            address: text(c, "address"),
            hours: text(c, "hours"),
            email: text(c, "email"),
            phone: text(c, "phone"),
            instagram_url: text(c, "instagram_url"),
            linkedin_url: text(c, "linkedin_url"),
            youtube_url: text(c, "youtube_url"),
          }}
        />
      );

    case "component": {
      const Block = BUILT_IN[text(c, "component")];
      return Block ? <Block /> : null;
    }

    default:
      return <CmsSection section={section} />;
  }
}

export function HomeLandingPage({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.id}>{renderHomeSection(section)}</div>
      ))}
    </>
  );
}

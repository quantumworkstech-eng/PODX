// ============================================================
// Default content for the Client landing page (/).
// Built from the legacy `landing_content` table so whatever the admin has
// already edited there carries straight over into the new section model.
// The legacy table is left untouched as a fallback.
// ============================================================

import { supabaseAdmin } from "@/lib/supabase";
import type { SeedPage, SeedSection } from "./types";

type Row = Record<string, unknown>;

async function legacyContent(): Promise<Record<string, unknown>> {
  if (!supabaseAdmin) return {};
  const { data } = await supabaseAdmin.from("landing_content").select("section, content");
  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[row.section as string] = row.content;
  return out;
}

const asArray = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);
const asObject = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};
const str = (value: unknown): string => (value === null || value === undefined ? "" : String(value));

/** A built-in block that admins can reorder and hide but not edit field-by-field. */
const component = (name: string, key: string): SeedSection => ({
  type: "component",
  name,
  content: { component: key },
});

async function buildSections(): Promise<SeedSection[]> {
  const cms = await legacyContent();
  const hero = asObject(cms.hero);
  const footer = asObject(cms.footer);
  const isVideo = str(hero.media_type) === "video";

  return [
    {
      type: "hero",
      name: "Hero",
      content: {
        heading: str(hero.headline) || "Where Great Podcasts Begin",
        description: str(hero.subheadline),
        cta_text: str(hero.cta_primary_text) || "Browse Studios",
        cta_url: str(hero.cta_primary_url) || "/studios",
        cta_secondary_text: str(hero.cta_secondary_text) || "Book a Session",
        cta_secondary_url: str(hero.cta_secondary_url) || "/book",
        background_image_url: isVideo ? "" : str(hero.media_url),
        background_video_url: isVideo ? str(hero.media_url) : "",
        overlay_opacity: typeof hero.overlay_opacity === "number" ? hero.overlay_opacity : 60,
        media_preset: "none",
      },
      settings: { alignment: "center", spacing: "large", width: "wide" },
      items: {
        stats: asArray(cms.stats).map((s) => ({ value: str(s.number), label: str(s.label) })),
      },
    },
    {
      type: "text_ticker",
      name: "Platform marquee",
      content: { display: "marquee" },
      settings: { spacing: "medium" },
      items: {
        items: (Array.isArray(cms.marquee) ? (cms.marquee as unknown[]) : []).map((t) => ({ text: str(t) })),
      },
    },
    {
      type: "text_ticker",
      name: "We help you create",
      content: { display: "animated_words", prefix: "We help you create" },
      settings: { spacing: "medium" },
      items: {
        items: (Array.isArray(cms.we_help_create) ? (cms.we_help_create as unknown[]) : []).map((t) => ({
          text: str(t),
        })),
      },
    },
    {
      type: "cards",
      name: "Services",
      content: { card_style: "plain" },
      settings: { alignment: "center", columns: 3, width: "wide", spacing: "large" },
      items: {
        items: asArray(cms.services).map((s) => ({
          title: str(s.title),
          description: str(s.description),
          image_url: str(s.image_url),
        })),
      },
    },
    {
      type: "steps",
      name: "How it works",
      content: {},
      settings: { alignment: "center", columns: 4, width: "wide", spacing: "large" },
      items: {
        items: asArray(cms.how_it_works).map((s) => ({
          step: str(s.step),
          title: str(s.title),
          description: str(s.description),
        })),
      },
    },
    component("Brands & influencers", "social_proof"),
    {
      type: "testimonials",
      name: "Testimonials",
      content: {},
      settings: { alignment: "center", columns: 3, width: "wide", spacing: "large" },
      items: {
        items: asArray(cms.testimonials).map((t) => ({
          name: str(t.name),
          role: str(t.role),
          quote: str(t.quote),
          avatar_url: str(t.avatar_url),
          rating: 5,
        })),
      },
    },
    component("Ready to get started", "ready_to_start"),
    component("Created in our studios", "created_in_studios"),
    component("Bundles & offers", "bundles"),
    component("Book a studio banner", "book_studio_banner"),
    component("Studio carousel", "studio_section"),
    component("Not just the best studio", "not_just_best"),
    {
      type: "faq",
      name: "FAQ",
      content: {},
      settings: { alignment: "center", width: "medium", spacing: "large" },
      items: {
        items: asArray(cms.faq).map((f) => ({ question: str(f.question), answer: str(f.answer) })),
      },
    },
    {
      type: "cta",
      name: "Closing call to action",
      content: {
        heading: "Ready to start your podcast journey?",
        cta_text: str(hero.cta_primary_text) || "Browse Studios",
        cta_url: str(hero.cta_primary_url) || "/studios",
        cta_secondary_text: "Talk to an Expert",
        cta_secondary_url: "/contact",
      },
      settings: { alignment: "center", width: "medium", spacing: "large" },
    },
    {
      type: "footer",
      name: "Footer",
      content: {
        tagline: str(footer.tagline),
        address: str(footer.address),
        hours: str(footer.hours),
        email: str(footer.email),
        phone: str(footer.phone),
        instagram_url: str(footer.instagram_url),
        linkedin_url: str(footer.linkedin_url),
        youtube_url: str(footer.youtube_url),
      },
    },
  ];
}

export const homeSeed: SeedPage = {
  title: "Client Landing Page",
  description: "The public homepage customers see at /.",
  path: "/",
  seo: {
    seo_title: "Yanisa Studios — Book World-Class Podcast Studios in India",
    meta_description:
      "Book professional podcast studios across India. World-class equipment, trained operators, and end-to-end production support.",
  },
  buildSections,
};

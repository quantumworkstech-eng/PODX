// ============================================================
// Landing Page CMS — section type registry
//
// Adding a new section type is a two-step job:
//   1. add a SectionTypeDef here (fields + repeatable item groups)
//   2. add a renderer for it in src/components/cms/renderers/<page>.tsx
// Nothing else in the admin UI needs to change — forms, validation, ordering,
// duplication and preview are all driven by this file.
// ============================================================

import type { FieldDef, ItemGroupDef, SectionTypeDef } from "./types";

// ── Reusable field fragments ────────────────────────────────────────────────

const eyebrow: FieldDef = {
  key: "eyebrow", label: "Eyebrow", type: "text", maxLength: 80, half: true,
  placeholder: "Small label above the heading",
};
// Optional by default: several designs (services, steps, tickers) render their own
// heading, so demanding one here would block publishing a perfectly valid page.
// Sections that are meaningless without a headline opt in with requiredHeading.
const heading: FieldDef = {
  key: "heading", label: "Heading", type: "text", maxLength: 160,
};
const requiredHeading: FieldDef = { ...heading, required: true };
const headingAccent: FieldDef = {
  key: "heading_accent", label: "Accent heading", type: "text", maxLength: 160, half: true,
  help: "Rendered in the accent colour after the heading",
};
const subheading: FieldDef = {
  key: "subheading", label: "Subheading", type: "text", maxLength: 200, half: true,
};
const description: FieldDef = {
  key: "description", label: "Description", type: "textarea", maxLength: 800,
};

const ctaFields = (prefix: "cta" | "cta_secondary", label: string): FieldDef[] => [
  { key: `${prefix}_text`, label: `${label} text`, type: "text", maxLength: 60, half: true },
  { key: `${prefix}_url`, label: `${label} link`, type: "url", maxLength: 500, half: true,
    placeholder: "/partner/signup" },
];

const iconField: FieldDef = {
  key: "icon", label: "Icon", type: "icon", half: true,
  help: "Lucide icon name, e.g. calendar, shield, zap",
};

const linkFields: FieldDef[] = [
  { key: "link_text", label: "Link text", type: "text", maxLength: 60, half: true },
  { key: "link_url", label: "Link URL", type: "url", maxLength: 500, half: true },
];

const group = (
  key: string, label: string, itemLabel: string, fields: FieldDef[], titleKey = "title",
): ItemGroupDef => ({ key, label, itemLabel, fields, titleKey });

// ── Section types ───────────────────────────────────────────────────────────

export const SECTION_TYPES: SectionTypeDef[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Full-width banner with headline, description and call-to-action buttons.",
    icon: "Sparkles",
    defaultName: "Hero",
    supports: ["alignment", "background", "background_image_url", "spacing", "width"],
    fields: [
      eyebrow,
      { key: "badge_text", label: "Badge text", type: "text", maxLength: 80, half: true,
        placeholder: "Partner Program — Now Open" },
      requiredHeading,
      headingAccent,
      subheading,
      description,
      ...ctaFields("cta", "Primary CTA"),
      ...ctaFields("cta_secondary", "Secondary CTA"),
      { key: "hero_image_url", label: "Hero image", type: "image", half: true },
      { key: "background_image_url", label: "Background image", type: "image", half: true },
      { key: "background_video_url", label: "Background video", type: "video", half: true,
        help: "Direct MP4/WebM URL — plays muted behind the hero" },
      { key: "overlay_opacity", label: "Overlay opacity (%)", type: "number", min: 0, max: 90,
        default: 60, half: true },
      { key: "media_preset", label: "Showcase visual", type: "select", half: true, default: "none",
        options: [
          { value: "none", label: "None" },
          { value: "image", label: "Hero image" },
          { value: "dashboard_mockup", label: "Partner dashboard mockup" },
        ] },
    ],
    groups: [
      group("stats", "Stat highlights", "stat", [
        { key: "value", label: "Value", type: "text", maxLength: 40, required: true, half: true },
        { key: "label", label: "Label", type: "text", maxLength: 80, required: true, half: true },
      ], "value"),
      group("trust", "Trust signals", "trust signal", [
        { key: "text", label: "Text", type: "text", maxLength: 80, required: true },
      ], "text"),
    ],
    defaultContent: { overlay_opacity: 60, media_preset: "none" },
    defaultSettings: { alignment: "center", spacing: "large", width: "wide" },
  },
  {
    type: "rich_text",
    label: "Rich text",
    description: "Free-form heading and formatted body copy, with an optional image.",
    icon: "AlignLeft",
    defaultName: "Rich text",
    supports: ["alignment", "width", "spacing", "background", "image_position"],
    fields: [
      eyebrow, heading, subheading,
      { key: "body", label: "Body", type: "richtext", maxLength: 20000, required: true },
      { key: "image_url", label: "Image", type: "image", half: true },
      ...ctaFields("cta", "CTA"),
    ],
    defaultSettings: { alignment: "left", width: "medium", spacing: "medium", image_position: "right" },
  },
  {
    type: "image_content",
    label: "Image + content",
    description: "Split layout — copy on one side, an image or product visual on the other.",
    icon: "Columns2",
    defaultName: "Image + content",
    supports: ["alignment", "image_position", "width", "spacing", "background"],
    fields: [
      eyebrow,
      { key: "badge_text", label: "Badge text", type: "text", maxLength: 80, half: true },
      requiredHeading, headingAccent, description,
      { key: "image_url", label: "Image", type: "image", half: true },
      { key: "media_preset", label: "Visual", type: "select", half: true, default: "image",
        options: [
          { value: "image", label: "Uploaded image" },
          { value: "browser_mockup", label: "White-label browser mockup" },
          { value: "dashboard_mockup", label: "Partner dashboard mockup" },
          { value: "none", label: "No visual" },
        ] },
      ...ctaFields("cta", "CTA"),
    ],
    groups: [
      group("checklist", "Checklist", "checklist point", [
        { key: "text", label: "Text", type: "text", maxLength: 200, required: true },
      ], "text"),
      group("features", "Feature list", "feature", [
        iconField,
        { key: "title", label: "Title", type: "text", maxLength: 120, required: true, half: true },
        { key: "description", label: "Description", type: "textarea", maxLength: 400 },
      ]),
    ],
    defaultContent: { media_preset: "image" },
    defaultSettings: { image_position: "right", width: "wide", spacing: "large" },
  },
  {
    type: "benefits",
    label: "Benefits",
    description: "Icon cards describing what partners get. Unlimited cards.",
    icon: "BadgeCheck",
    defaultName: "Benefits",
    supports: ["alignment", "columns", "width", "spacing", "background"],
    fields: [eyebrow, heading, headingAccent, description],
    groups: [
      group("items", "Benefits", "benefit", [
        iconField,
        { key: "image_url", label: "Image (optional)", type: "image", half: true },
        { key: "title", label: "Title", type: "text", maxLength: 120, required: true },
        { key: "description", label: "Description", type: "textarea", maxLength: 500 },
        ...linkFields,
      ]),
    ],
    defaultSettings: { alignment: "center", columns: 3, width: "wide", spacing: "large" },
  },
  {
    type: "cards",
    label: "Card grid",
    description: "Flexible grid of cards with image, title, description and link.",
    icon: "LayoutGrid",
    defaultName: "Card grid",
    supports: ["alignment", "columns", "width", "spacing", "background"],
    fields: [
      eyebrow, heading, headingAccent, description,
      { key: "card_style", label: "Card style", type: "select", half: true, default: "default",
        options: [
          { value: "default", label: "Default" },
          { value: "accent", label: "Accent icons" },
          { value: "warning", label: "Problem / warning icons" },
          { value: "plain", label: "Plain (no icon chip)" },
        ] },
    ],
    groups: [
      group("items", "Cards", "card", [
        { key: "image_url", label: "Image / logo", type: "image", half: true },
        iconField,
        { key: "title", label: "Title", type: "text", maxLength: 120, required: true, half: true },
        { key: "tag", label: "Tag", type: "text", maxLength: 30, half: true },
        { key: "description", label: "Description", type: "textarea", maxLength: 500 },
        ...linkFields,
      ]),
    ],
    defaultContent: { card_style: "default" },
    defaultSettings: { alignment: "center", columns: 3, width: "wide", spacing: "large" },
  },
  {
    type: "steps",
    label: "How it works",
    description: "Numbered steps laid out in a row or column.",
    icon: "ListOrdered",
    defaultName: "How it works",
    supports: ["alignment", "columns", "width", "spacing", "background"],
    fields: [eyebrow, heading, headingAccent, description, ...ctaFields("cta", "CTA")],
    groups: [
      group("items", "Steps", "step", [
        { key: "step", label: "Step number", type: "text", maxLength: 8, half: true, placeholder: "01" },
        iconField,
        { key: "title", label: "Title", type: "text", maxLength: 120, required: true },
        { key: "description", label: "Description", type: "textarea", maxLength: 400 },
      ]),
    ],
    defaultSettings: { alignment: "center", columns: 5, width: "wide", spacing: "large" },
  },
  {
    type: "logos",
    label: "Logo showcase",
    description: "Partner or client logos with optional names and links.",
    icon: "Building2",
    defaultName: "Logo showcase",
    supports: ["alignment", "columns", "width", "spacing", "background"],
    fields: [
      eyebrow, heading, description,
      { key: "grayscale", label: "Grayscale until hover", type: "toggle", default: true, half: true },
    ],
    groups: [
      group("items", "Logos", "logo", [
        { key: "logo_url", label: "Logo image", type: "image", half: true },
        { key: "name", label: "Partner name", type: "text", maxLength: 120, required: true, half: true },
        { key: "website_url", label: "Website URL", type: "url", maxLength: 500, half: true },
        { key: "description", label: "Description (optional)", type: "textarea", maxLength: 300 },
      ], "name"),
    ],
    defaultContent: { grayscale: true },
    defaultSettings: { alignment: "center", columns: 5, width: "wide", spacing: "medium" },
  },
  {
    type: "text_ticker",
    label: "Text ticker",
    description: "Scrolling or animated list of short phrases.",
    icon: "Megaphone",
    defaultName: "Text ticker",
    supports: ["spacing", "background"],
    fields: [
      { key: "display", label: "Display style", type: "select", default: "marquee", half: true,
        options: [
          { value: "marquee", label: "Scrolling marquee" },
          { value: "animated_words", label: "Animated single word" },
          { value: "pills", label: "Static pills" },
        ] },
      { key: "prefix", label: "Prefix text", type: "text", maxLength: 120, half: true,
        placeholder: "We help you create" },
    ],
    groups: [
      group("items", "Entries", "entry", [
        { key: "text", label: "Text", type: "text", maxLength: 80, required: true },
      ], "text"),
    ],
    defaultContent: { display: "marquee" },
    defaultSettings: { spacing: "medium" },
  },
  {
    type: "stats",
    label: "Stats bar",
    description: "A row of headline numbers.",
    icon: "TrendingUp",
    defaultName: "Stats",
    supports: ["columns", "width", "spacing", "background"],
    fields: [eyebrow, heading, description],
    groups: [
      group("items", "Stats", "stat", [
        { key: "value", label: "Value", type: "text", maxLength: 40, required: true, half: true },
        { key: "label", label: "Label", type: "text", maxLength: 80, required: true, half: true },
      ], "value"),
    ],
    defaultSettings: { columns: 4, width: "wide", spacing: "medium", background: "muted" },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Quotes from partners or customers.",
    icon: "Quote",
    defaultName: "Testimonials",
    supports: ["alignment", "columns", "width", "spacing", "background"],
    fields: [eyebrow, heading, headingAccent, description],
    groups: [
      group("items", "Testimonials", "testimonial", [
        { key: "quote", label: "Quote", type: "textarea", maxLength: 800, required: true },
        { key: "name", label: "Person name", type: "text", maxLength: 120, required: true, half: true },
        { key: "role", label: "Role / company", type: "text", maxLength: 160, half: true },
        { key: "avatar_url", label: "Photo", type: "image", half: true },
        { key: "company_logo_url", label: "Company logo", type: "image", half: true },
        { key: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5, default: 5, half: true },
      ], "name"),
    ],
    defaultSettings: { alignment: "center", columns: 3, width: "wide", spacing: "large" },
  },
  {
    type: "pricing",
    label: "Pricing",
    description: "Plan cards with feature lists.",
    icon: "CreditCard",
    defaultName: "Pricing",
    supports: ["alignment", "columns", "width", "spacing", "background"],
    fields: [
      eyebrow, heading, headingAccent, description,
      { key: "note", label: "Footnote", type: "text", maxLength: 240 },
    ],
    groups: [
      group("items", "Plans", "plan", [
        { key: "name", label: "Plan name", type: "text", maxLength: 80, required: true, half: true },
        { key: "badge", label: "Badge", type: "text", maxLength: 40, half: true },
        { key: "price", label: "Price", type: "text", maxLength: 40, required: true, half: true },
        { key: "period", label: "Billing period", type: "text", maxLength: 40, half: true,
          placeholder: "per month" },
        { key: "description", label: "Description", type: "textarea", maxLength: 400 },
        { key: "features", label: "Features", type: "list" },
        { key: "highlighted", label: "Highlight this plan", type: "toggle", half: true },
        { key: "cta_text", label: "Button text", type: "text", maxLength: 60, half: true },
        { key: "cta_url", label: "Button link", type: "url", maxLength: 500, half: true },
      ], "name"),
    ],
    defaultSettings: { alignment: "center", columns: 3, width: "wide", spacing: "large" },
  },
  {
    type: "earnings",
    label: "Earnings calculator",
    description: "Example earnings breakdown with a highlighted total.",
    icon: "IndianRupee",
    defaultName: "Earnings",
    supports: ["width", "spacing", "background"],
    fields: [
      eyebrow, heading, description,
      { key: "rows_title", label: "Breakdown title", type: "text", maxLength: 120, half: true,
        placeholder: "Example Calculation" },
      { key: "highlight_label", label: "Highlight label", type: "text", maxLength: 80, half: true },
      { key: "highlight_value", label: "Highlight value", type: "text", maxLength: 40, half: true },
      { key: "highlight_caption", label: "Highlight caption", type: "text", maxLength: 80, half: true },
      { key: "footnote", label: "Footnote", type: "text", maxLength: 240 },
    ],
    groups: [
      group("rows", "Breakdown rows", "row", [
        { key: "label", label: "Label", type: "text", maxLength: 120, required: true, half: true },
        { key: "value", label: "Value", type: "text", maxLength: 60, required: true, half: true },
        { key: "sub", label: "Sub-label", type: "text", maxLength: 120 },
      ], "label"),
      group("summary", "Summary rows", "summary row", [
        { key: "label", label: "Label", type: "text", maxLength: 120, required: true, half: true },
        { key: "value", label: "Value", type: "text", maxLength: 60, required: true, half: true },
      ], "label"),
      group("tiers", "Tier cards", "tier", [
        { key: "icon_emoji", label: "Emoji", type: "text", maxLength: 8, half: true },
        { key: "title", label: "Tier name", type: "text", maxLength: 80, required: true, half: true },
        { key: "value", label: "Range", type: "text", maxLength: 60, half: true },
        { key: "description", label: "Description", type: "textarea", maxLength: 300 },
      ]),
    ],
    defaultSettings: { width: "medium", spacing: "large", background: "muted" },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Expandable question and answer list.",
    icon: "HelpCircle",
    defaultName: "FAQ",
    supports: ["alignment", "width", "spacing", "background"],
    fields: [eyebrow, heading, headingAccent, description],
    groups: [
      group("items", "Questions", "question", [
        { key: "question", label: "Question", type: "text", maxLength: 240, required: true },
        { key: "answer", label: "Answer", type: "textarea", maxLength: 2000, required: true },
      ], "question"),
    ],
    defaultSettings: { alignment: "center", width: "medium", spacing: "large" },
  },
  {
    type: "cta",
    label: "Call to action",
    description: "Closing banner with headline and buttons.",
    icon: "Zap",
    defaultName: "Call to action",
    supports: ["alignment", "width", "spacing", "background", "background_image_url"],
    fields: [
      requiredHeading, headingAccent, description,
      ...ctaFields("cta", "Primary button"),
      ...ctaFields("cta_secondary", "Secondary button"),
      { key: "note", label: "Note under buttons", type: "text", maxLength: 200 },
    ],
    defaultSettings: { alignment: "center", width: "medium", spacing: "large" },
  },
  {
    type: "nav",
    label: "Navigation bar",
    description: "Sticky header — logo, links and sign-up buttons.",
    icon: "Menu",
    defaultName: "Navigation",
    singleton: true,
    supports: [],
    fields: [
      { key: "logo_text", label: "Logo text", type: "text", maxLength: 60, half: true },
      { key: "logo_accent", label: "Logo accent text", type: "text", maxLength: 30, half: true },
      { key: "logo_url", label: "Logo image", type: "image", half: true },
      ...ctaFields("cta", "Primary button"),
      ...ctaFields("cta_secondary", "Secondary button"),
      { key: "sticky_cta_text", label: "Sticky bar text", type: "text", maxLength: 120, half: true },
      { key: "sticky_cta_button", label: "Sticky bar button", type: "text", maxLength: 60, half: true },
      { key: "sticky_cta_url", label: "Sticky bar link", type: "url", maxLength: 500, half: true },
    ],
    groups: [
      group("items", "Links", "link", [
        { key: "label", label: "Label", type: "text", maxLength: 60, required: true, half: true },
        { key: "url", label: "URL", type: "url", maxLength: 500, required: true, half: true },
      ], "label"),
    ],
  },
  {
    type: "footer",
    label: "Footer",
    description: "Site footer — tagline, contact details, social links.",
    icon: "PanelBottom",
    defaultName: "Footer",
    singleton: true,
    supports: [],
    fields: [
      { key: "logo_text", label: "Logo text", type: "text", maxLength: 60, half: true },
      { key: "tagline", label: "Tagline", type: "textarea", maxLength: 400 },
      { key: "address", label: "Address", type: "text", maxLength: 240, half: true },
      { key: "hours", label: "Hours", type: "text", maxLength: 120, half: true },
      { key: "email", label: "Email", type: "text", maxLength: 160, half: true },
      { key: "phone", label: "Phone", type: "text", maxLength: 60, half: true },
      { key: "instagram_url", label: "Instagram URL", type: "url", maxLength: 500, half: true },
      { key: "linkedin_url", label: "LinkedIn URL", type: "url", maxLength: 500, half: true },
      { key: "youtube_url", label: "YouTube URL", type: "url", maxLength: 500, half: true },
      { key: "copyright_text", label: "Copyright text", type: "text", maxLength: 200 },
    ],
    groups: [
      group("items", "Footer links", "link", [
        { key: "label", label: "Label", type: "text", maxLength: 60, required: true, half: true },
        { key: "url", label: "URL", type: "url", maxLength: 500, required: true, half: true },
        { key: "column", label: "Column heading", type: "text", maxLength: 60, half: true },
      ], "label"),
    ],
  },
  {
    type: "custom",
    label: "Custom blocks",
    description: "Free-form stack of text, image, video and button blocks.",
    icon: "Boxes",
    defaultName: "Custom section",
    supports: ["alignment", "width", "spacing", "background"],
    fields: [heading, subheading],
    groups: [
      group("items", "Blocks", "block", [
        { key: "type", label: "Block type", type: "select", required: true, default: "text", half: true,
          options: [
            { value: "text", label: "Text" },
            { value: "heading", label: "Heading" },
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
            { value: "button", label: "Button" },
            { value: "divider", label: "Divider" },
          ] },
        { key: "size", label: "Size", type: "select", default: "md", half: true,
          options: [
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
            { value: "xl", label: "Extra large" },
          ] },
        { key: "content", label: "Content", type: "textarea", maxLength: 4000,
          help: "Text, image URL or button label depending on block type" },
        { key: "url", label: "URL", type: "url", maxLength: 500 },
      ], "content"),
    ],
    defaultSettings: { alignment: "left", width: "medium", spacing: "medium" },
  },
  {
    type: "component",
    label: "Built-in block",
    description: "A pre-designed block from the site. Reorder and hide it, no content fields.",
    icon: "Puzzle",
    defaultName: "Built-in block",
    supports: [],
    fields: [
      { key: "component", label: "Block", type: "select", required: true,
        options: [
          { value: "social_proof", label: "Home — Brands & influencers" },
          { value: "ready_to_start", label: "Home — Ready to get started" },
          { value: "created_in_studios", label: "Home — Created in our studios" },
          { value: "bundles", label: "Home — Bundles & offers" },
          { value: "book_studio_banner", label: "Home — Book a studio banner" },
          { value: "studio_section", label: "Home — Studio carousel" },
          { value: "not_just_best", label: "Home — Not just the best studio" },
        ] },
    ],
  },
];

/** Every content section gets an anchor so nav links keep working after reordering. */
const ANCHOR_FIELD: FieldDef = {
  key: "anchor_id",
  label: "Anchor id",
  type: "text",
  maxLength: 60,
  half: true,
  placeholder: "pricing",
  help: "Link to this section from a menu with #your-anchor",
};

for (const def of SECTION_TYPES) {
  if (["nav", "footer", "component"].includes(def.type)) continue;
  def.fields = [...def.fields, ANCHOR_FIELD];
}

export const SECTION_TYPE_MAP: Record<string, SectionTypeDef> = Object.fromEntries(
  SECTION_TYPES.map((t) => [t.type, t]),
);

export function getSectionType(type: string): SectionTypeDef | undefined {
  return SECTION_TYPE_MAP[type];
}

export function sectionTypesForPage(slug: string): SectionTypeDef[] {
  return SECTION_TYPES.filter((t) => !t.scope || t.scope.includes(slug));
}

export function isValidSectionType(type: string): boolean {
  return type in SECTION_TYPE_MAP;
}

/** Item groups declared by a section type (empty when it holds no repeatable content). */
export function groupsFor(type: string): ItemGroupDef[] {
  return SECTION_TYPE_MAP[type]?.groups ?? [];
}

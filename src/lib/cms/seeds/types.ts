import type { SectionSettings } from "../types";

export interface SeedSection {
  type: string;
  name: string;
  is_visible?: boolean;
  content?: Record<string, unknown>;
  settings?: SectionSettings;
  /** Repeatable content keyed by the section type's group key. */
  items?: Record<string, Record<string, unknown>[]>;
}

export interface SeedPage {
  title: string;
  /** Shown in the admin Landing Pages list. */
  description: string;
  /** Public path used by "View page". */
  path: string;
  seo?: {
    seo_title?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
    og_image_url?: string;
    canonical_url?: string;
  };
  sections?: SeedSection[];
  /** Used when the initial content has to be read from elsewhere (e.g. the legacy client CMS). */
  buildSections?: () => Promise<SeedSection[]>;
}

// ============================================================
// Landing Page CMS — shared types
// One generic model powers every managed landing page. A page owns ordered
// sections; a section owns ordered item groups. Section shapes are described
// by the registry in ./section-types, never hardcoded in the UI.
// ============================================================

export type PageStatus = "draft" | "published";

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  seo_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  published_at: string | null;
  published_by: string | null;
  has_unpublished_changes: boolean;
  created_at: string;
  updated_at: string;
}

/** Layout controls exposed to admins. Kept deliberately non-technical. */
export interface SectionSettings {
  alignment?: "left" | "center" | "right";
  image_position?: "left" | "right" | "top" | "bottom";
  width?: "narrow" | "medium" | "wide" | "full";
  spacing?: "small" | "medium" | "large";
  background?: "default" | "muted" | "dark" | "accent" | "image";
  background_image_url?: string;
  columns?: 2 | 3 | 4 | 5;
}

export type SectionContent = Record<string, unknown>;
export type ItemData = Record<string, unknown>;

export interface CmsSectionItem {
  id: string;
  section_id: string;
  group_key: string;
  order_index: number;
  is_visible: boolean;
  data: ItemData;
  created_at?: string;
  updated_at?: string;
}

export interface CmsSection {
  id: string;
  page_id: string;
  type: string;
  name: string;
  order_index: number;
  is_visible: boolean;
  content: SectionContent;
  settings: SectionSettings;
  created_at?: string;
  updated_at?: string;
  /** Items grouped by group_key, each already ordered by order_index. */
  items: Record<string, CmsSectionItem[]>;
}

export interface CmsPageData {
  page: CmsPage;
  sections: CmsSection[];
}

/** Shape stored in cms_page_versions.snapshot and served to the public site. */
export interface CmsSnapshot {
  slug: string;
  title: string;
  seo: {
    seo_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    canonical_url: string | null;
  };
  sections: CmsSection[];
  published_at: string;
  version: number;
}

// ── Field definitions (drive admin forms + validation) ──────────────────────

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "url"
  | "image"
  | "video"
  | "select"
  | "toggle"
  | "number"
  | "list"
  | "icon";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  /** Half-width in the admin form grid. */
  half?: boolean;
  default?: unknown;
}

export interface ItemGroupDef {
  key: string;
  label: string;
  /** Singular noun used in buttons: "Add benefit". */
  itemLabel: string;
  fields: FieldDef[];
  /** Field used as the collapsed row title in the admin list. */
  titleKey?: string;
  max?: number;
}

export interface SectionTypeDef {
  type: string;
  label: string;
  description: string;
  /** lucide-react icon name shown in the section picker. */
  icon: string;
  /** Page slugs this type may be added to. Omit for "any page". */
  scope?: string[];
  fields: FieldDef[];
  groups?: ItemGroupDef[];
  /** Which layout controls the section honours. */
  supports?: (keyof SectionSettings)[];
  defaultName: string;
  defaultContent?: SectionContent;
  defaultSettings?: SectionSettings;
  /** Only one instance allowed per page (nav, footer). */
  singleton?: boolean;
}

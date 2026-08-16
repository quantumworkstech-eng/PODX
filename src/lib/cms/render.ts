// ============================================================
// Landing Page CMS — client-safe render helpers
// Shared by the public pages, the admin preview and the section renderers.
// ============================================================

import type { CmsSection, ItemData, SectionSettings } from "./types";

export const text = (source: Record<string, unknown> | undefined, key: string): string =>
  String(source?.[key] ?? "").trim();

export const num = (source: Record<string, unknown> | undefined, key: string, fallback = 0): number => {
  const value = Number(source?.[key]);
  return Number.isFinite(value) ? value : fallback;
};

export const bool = (source: Record<string, unknown> | undefined, key: string): boolean =>
  Boolean(source?.[key]);

export const strList = (source: Record<string, unknown> | undefined, key: string): string[] =>
  Array.isArray(source?.[key]) ? (source[key] as unknown[]).map((v) => String(v)).filter(Boolean) : [];

/** Visible items of a group, already ordered by the API. */
export const items = (section: CmsSection, group = "items"): ItemData[] =>
  (section.items?.[group] ?? []).filter((item) => item.is_visible).map((item) => item.data);

// ── Layout settings → Tailwind classes ──────────────────────────────────────

export const WIDTH_CLASS: Record<string, string> = {
  narrow: "max-w-3xl",
  medium: "max-w-5xl",
  wide: "max-w-6xl",
  full: "max-w-none",
};

export const SPACING_CLASS: Record<string, string> = {
  small: "py-12",
  medium: "py-16",
  large: "py-24",
};

export const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const ALIGN_ITEMS_CLASS: Record<string, string> = {
  left: "items-start justify-start",
  center: "items-center justify-center",
  right: "items-end justify-end",
};

export const BACKGROUND_CLASS: Record<string, string> = {
  default: "",
  muted: "bg-[#060606]",
  dark: "bg-black",
  accent: "bg-[#D9FC67]/[0.04]",
  image: "",
};

export const COLUMNS_CLASS: Record<number, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
};

export function layoutClasses(settings: SectionSettings = {}) {
  return {
    width: WIDTH_CLASS[settings.width ?? "wide"] ?? WIDTH_CLASS.wide,
    spacing: SPACING_CLASS[settings.spacing ?? "large"] ?? SPACING_CLASS.large,
    align: ALIGN_CLASS[settings.alignment ?? "center"] ?? ALIGN_CLASS.center,
    alignItems: ALIGN_ITEMS_CLASS[settings.alignment ?? "center"] ?? ALIGN_ITEMS_CLASS.center,
    background: BACKGROUND_CLASS[settings.background ?? "default"] ?? "",
    columns: COLUMNS_CLASS[settings.columns ?? 3] ?? COLUMNS_CLASS[3],
  };
}

/** Anchor id so nav links like #pricing keep working after a reorder. */
export function sectionAnchor(section: CmsSection): string | undefined {
  const explicit = text(section.content, "anchor_id");
  if (explicit) return explicit.replace(/^#/, "");

  const name = section.name.toLowerCase();
  if (name.includes("how it works")) return "how-it-works";
  if (name.includes("feature")) return "features";
  if (name.includes("pricing")) return "pricing";
  if (name.includes("faq")) return "faq";
  return undefined;
}

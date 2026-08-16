// ============================================================
// Landing Page CMS — server-side validation
// Every admin write goes through these helpers so bad data can never reach the
// published snapshot. Errors are returned per field so the UI can show them
// inline rather than failing silently.
// ============================================================

import { getSectionType, groupsFor } from "./section-types";
import type { FieldDef, SectionSettings } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

const URL_SCHEMES = ["http://", "https://", "mailto:", "tel:"];

export function isValidUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (v.startsWith("/") || v.startsWith("#")) return true;
  if (URL_SCHEMES.some((s) => v.toLowerCase().startsWith(s))) {
    if (v.toLowerCase().startsWith("http")) {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
  return false;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const VIDEO_HOSTS = /(youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com)/i;

function validateField(field: FieldDef, raw: unknown): { value: unknown; error?: string } {
  const label = field.label;

  if (field.type === "toggle") return { value: Boolean(raw) };

  if (field.type === "number") {
    if (raw === "" || raw === null || raw === undefined) {
      return field.required ? { value: null, error: `${label} is required` } : { value: null };
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return { value: null, error: `${label} must be a number` };
    if (field.min !== undefined && n < field.min) return { value: n, error: `${label} must be at least ${field.min}` };
    if (field.max !== undefined && n > field.max) return { value: n, error: `${label} must be at most ${field.max}` };
    return { value: n };
  }

  if (field.type === "list") {
    const list = Array.isArray(raw) ? raw.map((v) => String(v ?? "").trim()).filter(Boolean) : [];
    if (field.required && list.length === 0) return { value: list, error: `${label} needs at least one entry` };
    if (list.some((v) => v.length > 300)) return { value: list, error: `${label} entries must be under 300 characters` };
    return { value: list };
  }

  const value = raw === null || raw === undefined ? "" : String(raw).trim();

  if (field.required && !value) return { value, error: `${label} is required` };
  if (field.maxLength && value.length > field.maxLength) {
    return { value, error: `${label} must be ${field.maxLength} characters or fewer` };
  }

  if (value) {
    if (field.type === "url" && !isValidUrl(value)) {
      return { value, error: `${label} must be a valid URL, or a path starting with / or #` };
    }
    if (field.type === "image") {
      if (!isValidUrl(value)) return { value, error: `${label} must be a valid image URL` };
      if (!IMAGE_EXT.test(value) && !value.includes("supabase") && !value.startsWith("data:")) {
        // Storage URLs and CDNs without extensions are common — warn-free but bounded.
        if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) {
          return { value, error: `${label} must be an image URL` };
        }
      }
    }
    if (field.type === "video") {
      if (!isValidUrl(value)) return { value, error: `${label} must be a valid video URL` };
      if (!VIDEO_EXT.test(value) && !VIDEO_HOSTS.test(value) && !value.includes("supabase")) {
        return { value, error: `${label} must be an MP4/WebM file or a YouTube, Vimeo or Drive link` };
      }
    }
    if (field.type === "select" && field.options && !field.options.some((o) => o.value === value)) {
      return { value, error: `${label} has an unsupported value` };
    }
  }

  return { value };
}

function validateAgainst(fields: FieldDef[], input: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const clean: Record<string, unknown> = {};

  for (const field of fields) {
    const { value, error } = validateField(field, input[field.key]);
    if (error) errors[field.key] = error;
    clean[field.key] = value;

    // Every image field carries an implicit companion alt-text key.
    if (field.type === "image") {
      const altKey = `${field.key}_alt`;
      clean[altKey] = String(input[altKey] ?? "").trim().slice(0, 200);
    }
  }

  return { errors, clean };
}

export function validateSectionContent(
  type: string,
  content: Record<string, unknown>,
): ValidationResult & { content: Record<string, unknown> } {
  const def = getSectionType(type);
  if (!def) return { ok: false, errors: { type: "Unknown section type" }, content: {} };

  const { errors, clean } = validateAgainst(def.fields, content ?? {});
  return { ok: Object.keys(errors).length === 0, errors, content: clean };
}

export function validateItemData(
  type: string,
  groupKey: string,
  data: Record<string, unknown>,
): ValidationResult & { data: Record<string, unknown> } {
  const groupDef = groupsFor(type).find((g) => g.key === groupKey);
  if (!groupDef) {
    return { ok: false, errors: { group: "This section does not accept that content group" }, data: {} };
  }

  const { errors, clean } = validateAgainst(groupDef.fields, data ?? {});
  return { ok: Object.keys(errors).length === 0, errors, data: clean };
}

const ALLOWED: Record<string, string[]> = {
  alignment: ["left", "center", "right"],
  image_position: ["left", "right", "top", "bottom"],
  width: ["narrow", "medium", "wide", "full"],
  spacing: ["small", "medium", "large"],
  background: ["default", "muted", "dark", "accent", "image"],
};

/** Drops unknown keys and out-of-range values so settings can never break layout. */
export function sanitizeSettings(type: string, settings: Record<string, unknown> = {}): SectionSettings {
  const def = getSectionType(type);
  const supports = new Set<string>(def?.supports ?? []);
  const out: Record<string, unknown> = {};

  for (const [key, values] of Object.entries(ALLOWED)) {
    if (!supports.has(key)) continue;
    const v = settings[key];
    if (typeof v === "string" && values.includes(v)) out[key] = v;
  }

  if (supports.has("columns")) {
    const n = Number(settings.columns);
    if ([2, 3, 4, 5].includes(n)) out.columns = n;
  }

  if (supports.has("background_image_url")) {
    const v = settings.background_image_url;
    if (typeof v === "string" && v.trim() && isValidUrl(v.trim())) out.background_image_url = v.trim();
  }

  return out as SectionSettings;
}

export function validateSectionName(name: unknown): string | null {
  const v = String(name ?? "").trim();
  if (!v) return null;
  return v.slice(0, 120);
}

const SEO_LIMITS: Record<string, number> = {
  seo_title: 70,
  meta_description: 200,
  og_title: 100,
  og_description: 300,
  og_image_url: 1000,
  canonical_url: 1000,
  title: 160,
};

export function validatePageMeta(input: Record<string, unknown>): ValidationResult & {
  values: Record<string, string | null>;
} {
  const errors: Record<string, string> = {};
  const values: Record<string, string | null> = {};

  for (const [key, limit] of Object.entries(SEO_LIMITS)) {
    if (!(key in input)) continue;
    const v = String(input[key] ?? "").trim();
    if (v.length > limit) errors[key] = `Must be ${limit} characters or fewer`;
    if ((key === "og_image_url" || key === "canonical_url") && v && !isValidUrl(v)) {
      errors[key] = "Must be a valid URL";
    }
    values[key] = v || null;
  }

  if ("title" in values && !values.title) errors.title = "Page title is required";

  return { ok: Object.keys(errors).length === 0, errors, values };
}

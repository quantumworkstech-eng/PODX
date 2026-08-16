// ============================================================
// Landing Page CMS — server data access
// Every mutation lives here so ordering, soft deletes and the
// "page has unpublished changes" flag stay consistent across API routes.
// Server-only: uses the Supabase service role client.
// ============================================================

import { supabaseAdmin } from "@/lib/supabase";
import { SEED_PAGES } from "./seeds";
import { groupsFor } from "./section-types";
import type {
  CmsPage,
  CmsPageData,
  CmsSection,
  CmsSectionItem,
  CmsSnapshot,
  SectionSettings,
} from "./types";

export class CmsError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function db() {
  if (!supabaseAdmin) throw new CmsError("Database is not configured", 500);
  return supabaseAdmin;
}

const PAGE_COLUMNS =
  "id, slug, title, status, seo_title, meta_description, og_title, og_description, og_image_url, canonical_url, published_at, published_by, has_unpublished_changes, created_at, updated_at";

// ── Reads ───────────────────────────────────────────────────────────────────

export async function listPages(): Promise<CmsPage[]> {
  const { data, error } = await db().from("cms_pages").select(PAGE_COLUMNS).order("slug");
  if (error) throw new CmsError(error.message, 500);
  return (data ?? []) as CmsPage[];
}

async function fetchPage(slug: string): Promise<CmsPage | null> {
  const { data, error } = await db()
    .from("cms_pages")
    .select(PAGE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new CmsError(error.message, 500);
  return (data as CmsPage) ?? null;
}

/** Loads the page, creating it (and its default sections) the first time. */
export async function ensurePage(slug: string): Promise<CmsPage> {
  const existing = await fetchPage(slug);
  if (existing) return existing;

  const seed = SEED_PAGES[slug];
  if (!seed) throw new CmsError(`Unknown landing page "${slug}"`, 404);

  const { data, error } = await db()
    .from("cms_pages")
    .insert({
      slug,
      title: seed.title,
      status: "draft",
      seo_title: seed.seo?.seo_title ?? null,
      meta_description: seed.seo?.meta_description ?? null,
      og_title: seed.seo?.og_title ?? null,
      og_description: seed.seo?.og_description ?? null,
      og_image_url: seed.seo?.og_image_url ?? null,
      canonical_url: seed.seo?.canonical_url ?? null,
    })
    .select(PAGE_COLUMNS)
    .single();

  // A concurrent request may have created it first — fall back to reading.
  if (error) {
    const raced = await fetchPage(slug);
    if (raced) return raced;
    throw new CmsError(error.message, 500);
  }

  const page = data as CmsPage;
  await seedSections(page.id, slug);
  return page;
}

async function seedSections(pageId: string, slug: string) {
  const seed = SEED_PAGES[slug];
  if (!seed) return;

  const seedSectionList = seed.buildSections ? await seed.buildSections() : (seed.sections ?? []);
  if (!seedSectionList.length) return;

  const rows = seedSectionList.map((section, index) => ({
    page_id: pageId,
    type: section.type,
    name: section.name,
    order_index: index,
    is_visible: section.is_visible ?? true,
    content: section.content ?? {},
    settings: section.settings ?? {},
  }));

  const { data: inserted, error } = await db().from("cms_sections").insert(rows).select("id, order_index");
  if (error) throw new CmsError(error.message, 500);

  const byOrder = new Map((inserted ?? []).map((s) => [s.order_index as number, s.id as string]));
  const itemRows: Record<string, unknown>[] = [];

  seedSectionList.forEach((section, index) => {
    const sectionId = byOrder.get(index);
    if (!sectionId || !section.items) return;
    for (const [groupKey, items] of Object.entries(section.items)) {
      items.forEach((data, itemIndex) => {
        itemRows.push({
          section_id: sectionId,
          group_key: groupKey,
          order_index: itemIndex,
          is_visible: true,
          data,
        });
      });
    }
  });

  if (itemRows.length) {
    const { error: itemError } = await db().from("cms_section_items").insert(itemRows);
    if (itemError) throw new CmsError(itemError.message, 500);
  }
}

async function loadSections(pageId: string): Promise<CmsSection[]> {
  const { data: sections, error } = await db()
    .from("cms_sections")
    .select("*")
    .eq("page_id", pageId)
    .is("deleted_at", null)
    .order("order_index");
  if (error) throw new CmsError(error.message, 500);

  const list = (sections ?? []) as Omit<CmsSection, "items">[];
  if (!list.length) return [];

  const { data: items, error: itemError } = await db()
    .from("cms_section_items")
    .select("*")
    .in("section_id", list.map((s) => s.id))
    .is("deleted_at", null)
    .order("order_index");
  if (itemError) throw new CmsError(itemError.message, 500);

  const grouped = new Map<string, Record<string, CmsSectionItem[]>>();
  for (const item of (items ?? []) as CmsSectionItem[]) {
    const forSection = grouped.get(item.section_id) ?? {};
    (forSection[item.group_key] ??= []).push(item);
    grouped.set(item.section_id, forSection);
  }

  return list.map((section) => {
    const declared = groupsFor(section.type);
    const found = grouped.get(section.id) ?? {};
    const itemsByGroup: Record<string, CmsSectionItem[]> = {};
    // Declared groups always present (empty array) so the UI can render "Add" affordances.
    for (const g of declared) itemsByGroup[g.key] = found[g.key] ?? [];
    for (const [key, value] of Object.entries(found)) if (!(key in itemsByGroup)) itemsByGroup[key] = value;
    return { ...section, items: itemsByGroup };
  });
}

/** Full editable state for the admin builder and preview. */
export async function getDraftPage(slug: string): Promise<CmsPageData> {
  const page = await ensurePage(slug);
  return { page, sections: await loadSections(page.id) };
}

/** Latest published snapshot, or null when the page was never published. */
export async function getPublishedSnapshot(slug: string): Promise<CmsSnapshot | null> {
  if (!supabaseAdmin) return null;

  const { data: page } = await supabaseAdmin
    .from("cms_pages")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!page || page.status !== "published") return null;

  const { data: version } = await supabaseAdmin
    .from("cms_page_versions")
    .select("snapshot")
    .eq("page_id", page.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!version?.snapshot) return null;

  const snapshot = version.snapshot as CmsSnapshot;
  return {
    ...snapshot,
    sections: (snapshot.sections ?? [])
      .filter((s) => s.is_visible)
      .map((s) => ({
        ...s,
        items: Object.fromEntries(
          Object.entries(s.items ?? {}).map(([key, list]) => [key, (list ?? []).filter((i) => i.is_visible)]),
        ),
      })),
  };
}

// ── Ordering helpers ────────────────────────────────────────────────────────

async function markDirty(pageId: string) {
  await db()
    .from("cms_pages")
    .update({ has_unpublished_changes: true, updated_at: new Date().toISOString() })
    .eq("id", pageId);
}

async function sectionPageId(sectionId: string): Promise<string> {
  const { data, error } = await db()
    .from("cms_sections")
    .select("page_id")
    .eq("id", sectionId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new CmsError(error.message, 500);
  if (!data) throw new CmsError("Section not found", 404);
  return data.page_id as string;
}

/** Rewrites order_index to 0..n-1 so gaps from deletes never accumulate. */
async function resequenceSections(pageId: string, orderedIds?: string[]) {
  const { data } = await db()
    .from("cms_sections")
    .select("id, order_index")
    .eq("page_id", pageId)
    .is("deleted_at", null)
    .order("order_index");

  const current = (data ?? []).map((s) => s.id as string);
  const ids = orderedIds
    ? [...orderedIds.filter((id) => current.includes(id)), ...current.filter((id) => !orderedIds.includes(id))]
    : current;

  await Promise.all(
    ids.map((id, index) =>
      db().from("cms_sections").update({ order_index: index }).eq("id", id).eq("page_id", pageId),
    ),
  );
}

async function resequenceItems(sectionId: string, groupKey: string, orderedIds?: string[]) {
  const { data } = await db()
    .from("cms_section_items")
    .select("id")
    .eq("section_id", sectionId)
    .eq("group_key", groupKey)
    .is("deleted_at", null)
    .order("order_index");

  const current = (data ?? []).map((i) => i.id as string);
  const ids = orderedIds
    ? [...orderedIds.filter((id) => current.includes(id)), ...current.filter((id) => !orderedIds.includes(id))]
    : current;

  await Promise.all(
    ids.map((id, index) =>
      db().from("cms_section_items").update({ order_index: index }).eq("id", id).eq("section_id", sectionId),
    ),
  );
}

// ── Section mutations ───────────────────────────────────────────────────────

export async function createSection(input: {
  pageId: string;
  type: string;
  name: string;
  content: Record<string, unknown>;
  settings: SectionSettings;
  afterSectionId?: string;
}): Promise<CmsSection> {
  const { data: siblings } = await db()
    .from("cms_sections")
    .select("id, order_index")
    .eq("page_id", input.pageId)
    .is("deleted_at", null)
    .order("order_index");

  const ids = (siblings ?? []).map((s) => s.id as string);
  const insertAt = input.afterSectionId ? ids.indexOf(input.afterSectionId) + 1 : ids.length;

  const { data, error } = await db()
    .from("cms_sections")
    .insert({
      page_id: input.pageId,
      type: input.type,
      name: input.name,
      order_index: ids.length,
      content: input.content,
      settings: input.settings,
    })
    .select("*")
    .single();

  if (error) throw new CmsError(error.message, 500);

  const created = data as CmsSection;
  if (insertAt < ids.length) {
    ids.splice(insertAt, 0, created.id);
    await resequenceSections(input.pageId, ids);
  }
  await markDirty(input.pageId);

  return { ...created, order_index: insertAt, items: {} };
}

export async function updateSection(
  sectionId: string,
  patch: { name?: string; content?: Record<string, unknown>; settings?: SectionSettings; is_visible?: boolean },
): Promise<CmsSection> {
  const pageId = await sectionPageId(sectionId);

  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.content !== undefined) payload.content = patch.content;
  if (patch.settings !== undefined) payload.settings = patch.settings;
  if (patch.is_visible !== undefined) payload.is_visible = patch.is_visible;

  if (!Object.keys(payload).length) throw new CmsError("Nothing to update");

  const { data, error } = await db()
    .from("cms_sections")
    .update(payload)
    .eq("id", sectionId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw new CmsError(error.message, 500);
  await markDirty(pageId);
  return { ...(data as CmsSection), items: {} };
}

export async function deleteSection(sectionId: string): Promise<void> {
  const pageId = await sectionPageId(sectionId);
  const now = new Date().toISOString();

  const { error } = await db().from("cms_sections").update({ deleted_at: now }).eq("id", sectionId);
  if (error) throw new CmsError(error.message, 500);

  await db().from("cms_section_items").update({ deleted_at: now }).eq("section_id", sectionId);
  await resequenceSections(pageId);
  await markDirty(pageId);
}

/** Copies a section and every item into fresh rows, placed right after the original. */
export async function duplicateSection(sectionId: string): Promise<CmsSection> {
  const { data: original, error } = await db()
    .from("cms_sections")
    .select("*")
    .eq("id", sectionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new CmsError(error.message, 500);
  if (!original) throw new CmsError("Section not found", 404);

  const source = original as CmsSection;
  const copy = await createSection({
    pageId: source.page_id,
    type: source.type,
    name: `${source.name} (copy)`,
    content: source.content ?? {},
    settings: source.settings ?? {},
    afterSectionId: source.id,
  });

  const { data: items } = await db()
    .from("cms_section_items")
    .select("group_key, order_index, is_visible, data")
    .eq("section_id", sectionId)
    .is("deleted_at", null)
    .order("order_index");

  if (items?.length) {
    const { error: copyError } = await db().from("cms_section_items").insert(
      items.map((item) => ({
        section_id: copy.id,
        group_key: item.group_key,
        order_index: item.order_index,
        is_visible: item.is_visible,
        data: item.data,
      })),
    );
    if (copyError) throw new CmsError(copyError.message, 500);
  }

  return copy;
}

export async function reorderSections(pageId: string, orderedIds: string[]): Promise<void> {
  await resequenceSections(pageId, orderedIds);
  await markDirty(pageId);
}

/** Swaps a section with its neighbour. Silently no-ops at the ends of the list. */
export async function moveSection(sectionId: string, direction: "up" | "down"): Promise<void> {
  const pageId = await sectionPageId(sectionId);
  const { data } = await db()
    .from("cms_sections")
    .select("id")
    .eq("page_id", pageId)
    .is("deleted_at", null)
    .order("order_index");

  const ids = (data ?? []).map((s) => s.id as string);
  const index = ids.indexOf(sectionId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return;

  [ids[index], ids[target]] = [ids[target], ids[index]];
  await resequenceSections(pageId, ids);
  await markDirty(pageId);
}

// ── Item mutations ──────────────────────────────────────────────────────────

async function itemContext(itemId: string) {
  const { data, error } = await db()
    .from("cms_section_items")
    .select("id, section_id, group_key, data, is_visible, cms_sections!inner(page_id, type)")
    .eq("id", itemId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new CmsError(error.message, 500);
  if (!data) throw new CmsError("Content item not found", 404);

  // PostgREST returns the joined row as an object, but older versions nest it in
  // an array — accept both so the dirty flag is never silently skipped.
  const joined = data.cms_sections as unknown;
  const section = (Array.isArray(joined) ? joined[0] : joined) as { page_id: string; type: string };
  return {
    id: data.id as string,
    sectionId: data.section_id as string,
    groupKey: data.group_key as string,
    data: (data.data ?? {}) as Record<string, unknown>,
    isVisible: data.is_visible as boolean,
    pageId: section.page_id,
    sectionType: section.type,
  };
}

export async function getSectionMeta(sectionId: string): Promise<{ pageId: string; type: string }> {
  const { data, error } = await db()
    .from("cms_sections")
    .select("page_id, type")
    .eq("id", sectionId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new CmsError(error.message, 500);
  if (!data) throw new CmsError("Section not found", 404);
  return { pageId: data.page_id as string, type: data.type as string };
}

export async function createItem(input: {
  sectionId: string;
  groupKey: string;
  data: Record<string, unknown>;
  afterItemId?: string;
}): Promise<CmsSectionItem> {
  const { pageId } = await getSectionMeta(input.sectionId);

  const { data: siblings } = await db()
    .from("cms_section_items")
    .select("id")
    .eq("section_id", input.sectionId)
    .eq("group_key", input.groupKey)
    .is("deleted_at", null)
    .order("order_index");

  const ids = (siblings ?? []).map((i) => i.id as string);
  const insertAt = input.afterItemId ? ids.indexOf(input.afterItemId) + 1 : ids.length;

  const { data, error } = await db()
    .from("cms_section_items")
    .insert({
      section_id: input.sectionId,
      group_key: input.groupKey,
      order_index: ids.length,
      data: input.data,
    })
    .select("*")
    .single();

  if (error) throw new CmsError(error.message, 500);

  const created = data as CmsSectionItem;
  if (insertAt < ids.length) {
    ids.splice(insertAt, 0, created.id);
    await resequenceItems(input.sectionId, input.groupKey, ids);
  }
  await markDirty(pageId);

  return { ...created, order_index: insertAt };
}

export async function updateItem(
  itemId: string,
  patch: { data?: Record<string, unknown>; is_visible?: boolean },
): Promise<CmsSectionItem> {
  const ctx = await itemContext(itemId);

  const payload: Record<string, unknown> = {};
  if (patch.data !== undefined) payload.data = patch.data;
  if (patch.is_visible !== undefined) payload.is_visible = patch.is_visible;
  if (!Object.keys(payload).length) throw new CmsError("Nothing to update");

  const { data, error } = await db()
    .from("cms_section_items")
    .update(payload)
    .eq("id", itemId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw new CmsError(error.message, 500);
  await markDirty(ctx.pageId);
  return data as CmsSectionItem;
}

export async function deleteItem(itemId: string): Promise<void> {
  const ctx = await itemContext(itemId);
  const { error } = await db()
    .from("cms_section_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw new CmsError(error.message, 500);

  await resequenceItems(ctx.sectionId, ctx.groupKey);
  await markDirty(ctx.pageId);
}

export async function duplicateItem(itemId: string): Promise<CmsSectionItem> {
  const ctx = await itemContext(itemId);
  return createItem({
    sectionId: ctx.sectionId,
    groupKey: ctx.groupKey,
    data: ctx.data,
    afterItemId: ctx.id,
  });
}

export async function reorderItems(
  sectionId: string,
  groupKey: string,
  orderedIds: string[],
): Promise<void> {
  const { pageId } = await getSectionMeta(sectionId);
  await resequenceItems(sectionId, groupKey, orderedIds);
  await markDirty(pageId);
}

export async function moveItem(itemId: string, direction: "up" | "down"): Promise<void> {
  const ctx = await itemContext(itemId);
  const { data } = await db()
    .from("cms_section_items")
    .select("id")
    .eq("section_id", ctx.sectionId)
    .eq("group_key", ctx.groupKey)
    .is("deleted_at", null)
    .order("order_index");

  const ids = (data ?? []).map((i) => i.id as string);
  const index = ids.indexOf(itemId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return;

  [ids[index], ids[target]] = [ids[target], ids[index]];
  await resequenceItems(ctx.sectionId, ctx.groupKey, ids);
  await markDirty(ctx.pageId);
}

// ── Page-level mutations ────────────────────────────────────────────────────

export async function updatePageMeta(
  pageId: string,
  values: Record<string, string | null>,
): Promise<CmsPage> {
  const { data, error } = await db()
    .from("cms_pages")
    .update({ ...values, has_unpublished_changes: true })
    .eq("id", pageId)
    .select(PAGE_COLUMNS)
    .single();

  if (error) throw new CmsError(error.message, 500);
  return data as CmsPage;
}

/** Freezes the current draft into a new immutable version and marks the page live. */
export async function publishPage(slug: string, adminEmail: string): Promise<{ page: CmsPage; version: number }> {
  const page = await ensurePage(slug);
  const sections = await loadSections(page.id);

  const { data: latest } = await db()
    .from("cms_page_versions")
    .select("version")
    .eq("page_id", page.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = ((latest?.version as number) ?? 0) + 1;
  const publishedAt = new Date().toISOString();

  const snapshot: CmsSnapshot = {
    slug: page.slug,
    title: page.title,
    seo: {
      seo_title: page.seo_title,
      meta_description: page.meta_description,
      og_title: page.og_title,
      og_description: page.og_description,
      og_image_url: page.og_image_url,
      canonical_url: page.canonical_url,
    },
    sections,
    published_at: publishedAt,
    version,
  };

  const { error } = await db().from("cms_page_versions").insert({
    page_id: page.id,
    version,
    snapshot,
    published_by: adminEmail,
  });
  if (error) throw new CmsError(error.message, 500);

  const { data: updated, error: pageError } = await db()
    .from("cms_pages")
    .update({
      status: "published",
      published_at: publishedAt,
      published_by: adminEmail,
      has_unpublished_changes: false,
    })
    .eq("id", page.id)
    .select(PAGE_COLUMNS)
    .single();

  if (pageError) throw new CmsError(pageError.message, 500);
  return { page: updated as CmsPage, version };
}

export async function unpublishPage(slug: string): Promise<CmsPage> {
  const page = await ensurePage(slug);
  const { data, error } = await db()
    .from("cms_pages")
    .update({ status: "draft", has_unpublished_changes: true })
    .eq("id", page.id)
    .select(PAGE_COLUMNS)
    .single();
  if (error) throw new CmsError(error.message, 500);
  return data as CmsPage;
}

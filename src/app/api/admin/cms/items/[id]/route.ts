import { NextRequest, NextResponse } from "next/server";
import { auditCms, readJson, requireUuid, validationFailed, withAdmin } from "@/lib/cms/api-helpers";
import { CmsError, deleteItem, updateItem } from "@/lib/cms/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateItemData } from "@/lib/cms/validation";

async function itemGroupContext(itemId: string) {
  if (!supabaseAdmin) throw new CmsError("Database is not configured", 500);
  const { data } = await supabaseAdmin
    .from("cms_section_items")
    .select("group_key, cms_sections!inner(type)")
    .eq("id", itemId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) throw new CmsError("Content item not found", 404);
  const joined = data.cms_sections as unknown;
  const section = (Array.isArray(joined) ? joined[0] : joined) as { type: string };
  return { groupKey: data.group_key as string, sectionType: section.type };
}

/** Updates an item's fields or toggles it on/off. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "item id");
    const body = await readJson(req);

    const patch: Parameters<typeof updateItem>[1] = {};

    if (body.data !== undefined) {
      const { groupKey, sectionType } = await itemGroupContext(id);
      const { ok, errors, data } = validateItemData(
        sectionType,
        groupKey,
        (body.data as Record<string, unknown>) ?? {},
      );
      if (!ok) return validationFailed(errors);
      patch.data = data;
    }

    if (body.is_visible !== undefined) patch.is_visible = Boolean(body.is_visible);
    if (!Object.keys(patch).length) throw new CmsError("Nothing to update");

    const item = await updateItem(id, patch);
    await auditCms(adminEmail, "cms.item.update", id);
    return NextResponse.json({ item });
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "item id");
    await deleteItem(id);
    await auditCms(adminEmail, "cms.item.delete", id);
    return NextResponse.json({ success: true });
  });
}

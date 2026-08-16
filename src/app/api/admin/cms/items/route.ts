import { NextRequest, NextResponse } from "next/server";
import {
  auditCms,
  readJson,
  requireIdList,
  requireUuid,
  validationFailed,
  withAdmin,
} from "@/lib/cms/api-helpers";
import { groupsFor } from "@/lib/cms/section-types";
import { CmsError, createItem, getSectionMeta, reorderItems } from "@/lib/cms/server";
import { validateItemData } from "@/lib/cms/validation";

/** Adds a repeatable content item to one of a section's groups. */
export async function POST(req: NextRequest) {
  return withAdmin(async (adminEmail) => {
    const body = await readJson(req);
    const sectionId = requireUuid(body.section_id, "section id");
    const groupKey = String(body.group_key ?? "items");

    const { type } = await getSectionMeta(sectionId);
    const groupDef = groupsFor(type).find((g) => g.key === groupKey);
    if (!groupDef) throw new CmsError("This section does not accept that content group");

    const incoming = (body.data as Record<string, unknown>) ?? {};
    const defaults = Object.fromEntries(
      groupDef.fields.filter((f) => f.default !== undefined).map((f) => [f.key, f.default]),
    );

    // New items may start blank; required fields are enforced when the admin saves.
    const { ok, errors, data } = validateItemData(type, groupKey, { ...defaults, ...incoming });
    if (Object.keys(incoming).length && !ok) return validationFailed(errors);

    const item = await createItem({
      sectionId,
      groupKey,
      data: ok ? data : { ...defaults, ...incoming },
      afterItemId: body.after_item_id ? requireUuid(body.after_item_id, "item id") : undefined,
    });

    await auditCms(adminEmail, "cms.item.create", item.id, { section_id: sectionId, group: groupKey });
    return NextResponse.json({ item });
  });
}

/** Persists a new order for one group of items inside a section. */
export async function PATCH(req: NextRequest) {
  return withAdmin(async (adminEmail) => {
    const body = await readJson(req);
    const sectionId = requireUuid(body.section_id, "section id");
    const groupKey = String(body.group_key ?? "items");
    const orderedIds = requireIdList(body.order);

    await reorderItems(sectionId, groupKey, orderedIds);
    await auditCms(adminEmail, "cms.item.reorder", sectionId, { group: groupKey });

    return NextResponse.json({ success: true });
  });
}

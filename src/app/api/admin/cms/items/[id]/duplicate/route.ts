import { NextRequest, NextResponse } from "next/server";
import { auditCms, requireUuid, withAdmin } from "@/lib/cms/api-helpers";
import { duplicateItem } from "@/lib/cms/server";

/** Copies a content item into a new row directly after the original. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "item id");
    const item = await duplicateItem(id);
    await auditCms(adminEmail, "cms.item.duplicate", item.id, { source_id: id });
    return NextResponse.json({ item });
  });
}

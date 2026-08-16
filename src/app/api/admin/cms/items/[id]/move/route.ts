import { NextRequest, NextResponse } from "next/server";
import { auditCms, readJson, requireUuid, withAdmin } from "@/lib/cms/api-helpers";
import { CmsError, moveItem } from "@/lib/cms/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "item id");
    const { direction } = await readJson(req);

    if (direction !== "up" && direction !== "down") {
      throw new CmsError("Direction must be 'up' or 'down'");
    }

    await moveItem(id, direction);
    await auditCms(adminEmail, "cms.item.move", id, { direction });
    return NextResponse.json({ success: true });
  });
}

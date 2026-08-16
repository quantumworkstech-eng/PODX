import { NextRequest, NextResponse } from "next/server";
import { auditCms, readJson, requireUuid, withAdmin } from "@/lib/cms/api-helpers";
import { CmsError, moveSection } from "@/lib/cms/server";

/** Move up / move down — the keyboard-accessible alternative to dragging. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "section id");
    const { direction } = await readJson(req);

    if (direction !== "up" && direction !== "down") {
      throw new CmsError("Direction must be 'up' or 'down'");
    }

    await moveSection(id, direction);
    await auditCms(adminEmail, "cms.section.move", id, { direction });
    return NextResponse.json({ success: true });
  });
}

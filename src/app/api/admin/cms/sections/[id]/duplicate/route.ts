import { NextRequest, NextResponse } from "next/server";
import { auditCms, requireUuid, withAdmin } from "@/lib/cms/api-helpers";
import { duplicateSection } from "@/lib/cms/server";

/** Copies the section and all of its content items into new rows, placed just below it. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "section id");
    const section = await duplicateSection(id);
    await auditCms(adminEmail, "cms.section.duplicate", section.id, { source_id: id });
    return NextResponse.json({ section });
  });
}

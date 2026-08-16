import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/cms/api-helpers";
import { MANAGED_PAGES } from "@/lib/cms/seeds";
import { listPages } from "@/lib/cms/server";

/** Landing pages the admin can manage, with their current publish state. */
export async function GET() {
  return withAdmin(async () => {
    const rows = await listPages();
    const byslug = new Map(rows.map((p) => [p.slug, p]));

    return NextResponse.json({
      pages: MANAGED_PAGES.map((meta) => {
        const row = byslug.get(meta.slug);
        return {
          ...meta,
          status: row?.status ?? "draft",
          has_unpublished_changes: row?.has_unpublished_changes ?? true,
          published_at: row?.published_at ?? null,
          updated_at: row?.updated_at ?? null,
          provisioned: Boolean(row),
        };
      }),
    });
  });
}

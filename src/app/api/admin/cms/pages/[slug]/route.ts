import { NextRequest, NextResponse } from "next/server";
import { auditCms, readJson, validationFailed, withAdmin } from "@/lib/cms/api-helpers";
import { SEED_PAGES } from "@/lib/cms/seeds";
import { CmsError, getDraftPage, updatePageMeta } from "@/lib/cms/server";
import { validatePageMeta } from "@/lib/cms/validation";

function assertManaged(slug: string) {
  if (!(slug in SEED_PAGES)) throw new CmsError(`Unknown landing page "${slug}"`, 404);
}

/** Full draft state for the builder: page meta + ordered sections + ordered items. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAdmin(async () => {
    const { slug } = await params;
    assertManaged(slug);

    const data = await getDraftPage(slug);
    return NextResponse.json({ ...data, meta: SEED_PAGES[slug] ? { path: SEED_PAGES[slug].path } : null });
  });
}

/** Updates page title and SEO metadata. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAdmin(async (adminEmail) => {
    const { slug } = await params;
    assertManaged(slug);

    const body = await readJson(req);
    const { ok, errors, values } = validatePageMeta(body);
    if (!ok) return validationFailed(errors);
    if (!Object.keys(values).length) throw new CmsError("Nothing to update");

    const { page } = await getDraftPage(slug);
    const updated = await updatePageMeta(page.id, values);
    await auditCms(adminEmail, "cms.page.update", page.id, { slug });

    return NextResponse.json({ page: updated });
  });
}

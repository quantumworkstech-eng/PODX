import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auditCms, withAdmin } from "@/lib/cms/api-helpers";
import { SEED_PAGES } from "@/lib/cms/seeds";
import { CmsError, publishPage, unpublishPage } from "@/lib/cms/server";
import { getSectionType } from "@/lib/cms/section-types";
import { getDraftPage } from "@/lib/cms/server";
import { validateSectionContent } from "@/lib/cms/validation";

function pagePath(slug: string) {
  return SEED_PAGES[slug]?.path;
}

/** Snapshots the draft into a new immutable version and makes it live. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAdmin(async (adminEmail) => {
    const { slug } = await params;
    const path = pagePath(slug);
    if (!path) throw new CmsError(`Unknown landing page "${slug}"`, 404);

    // Block publishing a page whose visible sections have invalid content.
    const draft = await getDraftPage(slug);
    const blocking = draft.sections
      .filter((section) => section.is_visible)
      .map((section) => {
        if (!getSectionType(section.type)) {
          return { name: section.name, message: "Unknown section type" };
        }
        const { ok, errors } = validateSectionContent(section.type, section.content ?? {});
        return ok ? null : { name: section.name, message: Object.values(errors)[0] };
      })
      .filter(Boolean);

    if (blocking.length) {
      return NextResponse.json(
        {
          error: "Some visible sections are incomplete. Fix them or hide them before publishing.",
          sectionErrors: blocking,
        },
        { status: 422 },
      );
    }

    const { page, version } = await publishPage(slug, adminEmail);
    await auditCms(adminEmail, "cms.page.publish", page.id, { slug, version });

    revalidatePath(path);
    return NextResponse.json({ page, version });
  });
}

/** Takes the page back to draft — the public route falls back to the built-in page. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAdmin(async (adminEmail) => {
    const { slug } = await params;
    const path = pagePath(slug);
    if (!path) throw new CmsError(`Unknown landing page "${slug}"`, 404);

    const page = await unpublishPage(slug);
    await auditCms(adminEmail, "cms.page.unpublish", page.id, { slug });

    revalidatePath(path);
    return NextResponse.json({ page });
  });
}

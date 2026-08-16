import { NextRequest, NextResponse } from "next/server";
import {
  auditCms,
  readJson,
  requireIdList,
  requireUuid,
  validationFailed,
  withAdmin,
} from "@/lib/cms/api-helpers";
import { getSectionType } from "@/lib/cms/section-types";
import { CmsError, createSection, ensurePage, getDraftPage, reorderSections } from "@/lib/cms/server";
import { sanitizeSettings, validateSectionContent, validateSectionName } from "@/lib/cms/validation";

/** Creates a section on a page, optionally right after an existing one. */
export async function POST(req: NextRequest) {
  return withAdmin(async (adminEmail) => {
    const body = await readJson(req);
    const slug = String(body.slug ?? "");
    const type = String(body.type ?? "");

    const def = getSectionType(type);
    if (!def) throw new CmsError("Unknown section type", 400);

    const page = await ensurePage(slug);

    if (def.singleton) {
      const { sections } = await getDraftPage(slug);
      if (sections.some((s) => s.type === type)) {
        throw new CmsError(`This page already has a ${def.label.toLowerCase()} section`);
      }
    }

    const content = { ...(def.defaultContent ?? {}), ...(body.content as Record<string, unknown> ?? {}) };
    const { ok, errors, content: cleanContent } = validateSectionContent(type, content);
    // A brand new section is allowed to start empty; required fields are enforced on save.
    const initialContent = ok ? cleanContent : content;
    if (body.content && !ok) return validationFailed(errors);

    const section = await createSection({
      pageId: page.id,
      type,
      name: validateSectionName(body.name) ?? def.defaultName,
      content: initialContent,
      settings: sanitizeSettings(type, {
        ...(def.defaultSettings ?? {}),
        ...((body.settings as Record<string, unknown>) ?? {}),
      }),
      afterSectionId: body.after_section_id ? requireUuid(body.after_section_id, "section id") : undefined,
    });

    await auditCms(adminEmail, "cms.section.create", section.id, { slug, type });
    return NextResponse.json({ section });
  });
}

/** Persists a new section order for a page. */
export async function PATCH(req: NextRequest) {
  return withAdmin(async (adminEmail) => {
    const body = await readJson(req);
    const slug = String(body.slug ?? "");
    const orderedIds = requireIdList(body.order);

    const page = await ensurePage(slug);
    await reorderSections(page.id, orderedIds);

    const { sections } = await getDraftPage(slug);
    await auditCms(adminEmail, "cms.section.reorder", page.id, { slug, count: orderedIds.length });

    return NextResponse.json({ sections });
  });
}

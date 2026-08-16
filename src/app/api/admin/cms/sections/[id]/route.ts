import { NextRequest, NextResponse } from "next/server";
import { auditCms, readJson, requireUuid, validationFailed, withAdmin } from "@/lib/cms/api-helpers";
import { CmsError, deleteSection, getSectionMeta, updateSection } from "@/lib/cms/server";
import { sanitizeSettings, validateSectionContent, validateSectionName } from "@/lib/cms/validation";

/** Updates a section's name, content, layout settings or visibility. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "section id");
    const body = await readJson(req);
    const { type } = await getSectionMeta(id);

    const patch: Parameters<typeof updateSection>[1] = {};

    if (body.name !== undefined) {
      const name = validateSectionName(body.name);
      if (!name) return validationFailed({ name: "Section name is required" });
      patch.name = name;
    }

    if (body.content !== undefined) {
      const { ok, errors, content } = validateSectionContent(
        type,
        (body.content as Record<string, unknown>) ?? {},
      );
      if (!ok) return validationFailed(errors);
      patch.content = content;
    }

    if (body.settings !== undefined) {
      patch.settings = sanitizeSettings(type, (body.settings as Record<string, unknown>) ?? {});
    }

    if (body.is_visible !== undefined) patch.is_visible = Boolean(body.is_visible);

    if (!Object.keys(patch).length) throw new CmsError("Nothing to update");

    const section = await updateSection(id, patch);
    await auditCms(adminEmail, "cms.section.update", id, { fields: Object.keys(patch) });

    return NextResponse.json({ section });
  });
}

/** Soft-deletes a section and everything inside it. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (adminEmail) => {
    const id = requireUuid((await params).id, "section id");
    await deleteSection(id);
    await auditCms(adminEmail, "cms.section.delete", id);
    return NextResponse.json({ success: true });
  });
}

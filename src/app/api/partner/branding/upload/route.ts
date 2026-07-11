import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { checkFeature } from "@/lib/subscription-gates";
import { isFeatureEnabled } from "@/lib/feature-access";

const BUCKET = "studio-images";
const MAX_BYTES = 2 * 1024 * 1024;

function storagePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return null;
  return publicUrl.slice(i + marker.length).split("?")[0] ?? null;
}

function extForLogo(mime: string): "png" | "jpg" | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

function extForFavicon(mime: string, name: string): "png" | "ico" | null {
  if (mime === "image/png") return "png";
  if (
    mime === "image/x-icon" ||
    mime === "image/vnd.microsoft.icon" ||
    mime === "application/octet-stream"
  ) {
    if (name.toLowerCase().endsWith(".ico")) return "ico";
  }
  if (name.toLowerCase().endsWith(".ico") && (!mime || mime === "application/octet-stream")) {
    return "ico";
  }
  return null;
}

function contentTypeForUpload(mime: string, ext: string): string {
  if (ext === "ico") return "image/x-icon";
  return mime || "application/octet-stream";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [canBySubscription, canByFeatureGrant] = await Promise.all([
    checkFeature(user.id, "whitelabel"),
    isFeatureEnabled(user.id, "white_label"),
  ]);
  if (!canBySubscription && !canByFeatureGrant) {
    return NextResponse.json(
      {
        error:
          "White-label branding requires a Pro or Enterprise subscription. Visit Billing & Plans to upgrade.",
        code: "FEATURE_GATED",
        feature: "whitelabel",
      },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const kind = formData.get("kind") as string | null;
  if (kind !== "logo" && kind !== "favicon") {
    return NextResponse.json({ error: "kind must be logo or favicon" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 2MB or smaller" }, { status: 400 });
  }

  const name = file.name || "";
  let objectPath: string;
  let uploadContentType: string;

  if (kind === "logo") {
    const ext = extForLogo(file.type);
    if (!ext) {
      return NextResponse.json(
        { error: "Logo must be PNG or JPG" },
        { status: 400 }
      );
    }
    objectPath = `white-label/${user.id}/logo.${ext}`;
    uploadContentType = ext === "jpg" ? "image/jpeg" : "image/png";
  } else {
    const ext = extForFavicon(file.type, name);
    if (!ext) {
      return NextResponse.json(
        { error: "Favicon must be PNG or ICO" },
        { status: 400 }
      );
    }
    objectPath = `white-label/${user.id}/favicon.${ext}`;
    uploadContentType = contentTypeForUpload(file.type, ext);
  }

  const { data: existing } = await supabaseAdmin
    .from("partner_branding")
    .select("logo_url, favicon_url")
    .eq("partner_id", user.id)
    .maybeSingle();

  const oldUrl =
    kind === "logo" ? existing?.logo_url : existing?.favicon_url;
  if (oldUrl && typeof oldUrl === "string") {
    const oldPath = storagePathFromPublicUrl(oldUrl);
    if (oldPath && oldPath.startsWith(`white-label/${user.id}/`)) {
      await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(objectPath, buffer, {
      contentType: uploadContentType,
      upsert: true,
    });

  if (uploadError) {
    console.error("White-label upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectPath);

  const field = kind === "logo" ? "logo_url" : "favicon_url";
  const now = new Date().toISOString();

  if (existing) {
    const { data: branding, error: updErr } = await supabaseAdmin
      .from("partner_branding")
      .update({ [field]: publicUrl, updated_at: now })
      .eq("partner_id", user.id)
      .select()
      .single();

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    return NextResponse.json({ url: publicUrl, branding });
  }

  const { data: branding, error: insErr } = await supabaseAdmin
    .from("partner_branding")
    .insert({
      partner_id: user.id,
      [field]: publicUrl,
      updated_at: now,
    })
    .select()
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl, branding });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [canBySubscription2, canByFeatureGrant2] = await Promise.all([
    checkFeature(user.id, "whitelabel"),
    isFeatureEnabled(user.id, "white_label"),
  ]);
  if (!canBySubscription2 && !canByFeatureGrant2) {
    return NextResponse.json(
      {
        error:
          "White-label branding requires a Pro or Enterprise subscription. Visit Billing & Plans to upgrade.",
        code: "FEATURE_GATED",
        feature: "whitelabel",
      },
      { status: 403 }
    );
  }

  const kind = req.nextUrl.searchParams.get("kind");
  if (kind !== "logo" && kind !== "favicon") {
    return NextResponse.json({ error: "kind must be logo or favicon" }, { status: 400 });
  }

  const field = kind === "logo" ? "logo_url" : "favicon_url";

  const { data: row } = await supabaseAdmin
    .from("partner_branding")
    .select("logo_url, favicon_url")
    .eq("partner_id", user.id)
    .maybeSingle();

  const url = row?.[field as "logo_url" | "favicon_url"];
  if (url && typeof url === "string") {
    const path = storagePathFromPublicUrl(url);
    if (path && path.startsWith(`white-label/${user.id}/`)) {
      await supabaseAdmin.storage.from(BUCKET).remove([path]);
    }
  }

  if (!row) {
    return NextResponse.json({ branding: null });
  }

  const { data: branding, error } = await supabaseAdmin
    .from("partner_branding")
    .update({ [field]: null, updated_at: new Date().toISOString() })
    .eq("partner_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ branding });
}

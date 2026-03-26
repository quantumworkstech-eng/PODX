import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "studio-images";
const MAX_BYTES = 2 * 1024 * 1024;

function pathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return null;
  return publicUrl.slice(i + marker.length).split("?")[0] ?? null;
}

function extForMime(mime: string): "png" | "jpg" | "webp" | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
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

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WebP images are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 2MB or smaller" }, { status: 400 });
  }

  const ext = extForMime(file.type);
  if (!ext) {
    return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
  }

  const objectPath = `profiles/${user.id}/avatar.${ext}`;
  const contentType =
    ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";

  const { data: profileRow } = await supabaseAdmin
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const oldUrl = profileRow?.avatar_url;
  if (oldUrl && typeof oldUrl === "string") {
    const oldPath = pathFromPublicUrl(oldUrl);
    if (oldPath?.startsWith(`profiles/${user.id}/`)) {
      await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
    }
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(objectPath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    console.error("Profile avatar upload:", uploadError);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectPath);

  const now = new Date().toISOString();

  if (profileRow) {
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: publicUrl, updated_at: now })
      .eq("user_id", user.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  } else {
    const { error: insErr } = await supabaseAdmin.from("profiles").insert({
      user_id: user.id,
      full_name: session.user.name || "",
      avatar_url: publicUrl,
      updated_at: now,
    });

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ avatarUrl: publicUrl });
}

export async function DELETE() {
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

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: profileRow } = await supabaseAdmin
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const oldUrl = profileRow?.avatar_url;
  if (oldUrl && typeof oldUrl === "string") {
    const oldPath = pathFromPublicUrl(oldUrl);
    if (oldPath?.startsWith(`profiles/${user.id}/`)) {
      await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
    }
  }

  if (profileRow) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ avatarUrl: null });
}

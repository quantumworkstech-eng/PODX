import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { SectionType } from "@/types/landing";

const supabase = supabaseAdmin!;

async function getPartnerId(email: string): Promise<string | null> {
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  return user?.id ?? null;
}

const VALID_TYPES: SectionType[] = [
  "hero", "studios", "features", "reviews",
  "about", "cta", "contact", "footer", "custom",
];

// GET — list all sections for the authenticated partner
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: sections, error } = await supabase
    .from("partner_landing_sections")
    .select("*")
    .eq("partner_id", partnerId)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sections: sections ?? [] });
}

// POST — create a new section OR bulk replace all sections (for templates)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  // Bulk replace mode (for templates)
  if (body.replace === true && Array.isArray(body.sections)) {
    // Delete existing sections
    await supabase
      .from("partner_landing_sections")
      .delete()
      .eq("partner_id", partnerId);

    if (body.sections.length === 0) {
      return NextResponse.json({ sections: [] });
    }

    const toInsert = body.sections.map(
      (s: { type: string; order_index: number; content_json: unknown; is_visible?: boolean }, idx: number) => ({
        partner_id: partnerId,
        type: s.type,
        order_index: s.order_index ?? idx,
        content_json: s.content_json ?? {},
        is_visible: s.is_visible ?? true,
      })
    );

    const { data: sections, error } = await supabase
      .from("partner_landing_sections")
      .insert(toInsert)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sections });
  }

  // Single section create
  const { type, content_json, order_index } = body;

  if (!type || !VALID_TYPES.includes(type as SectionType)) {
    return NextResponse.json({ error: "Invalid section type" }, { status: 400 });
  }

  // Compute next order_index if not provided
  let nextIndex = order_index;
  if (nextIndex === undefined) {
    const { data: last } = await supabase
      .from("partner_landing_sections")
      .select("order_index")
      .eq("partner_id", partnerId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();
    nextIndex = last ? last.order_index + 1 : 0;
  }

  const { data: section, error } = await supabase
    .from("partner_landing_sections")
    .insert({
      partner_id: partnerId,
      type,
      order_index: nextIndex,
      content_json: content_json ?? {},
      is_visible: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section });
}

// PUT — update a section (content, visibility) OR bulk reorder
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  // Bulk reorder: { reorder: true, order: [{ id, order_index }] }
  if (body.reorder === true && Array.isArray(body.order)) {
    const updates = body.order as { id: string; order_index: number }[];

    await Promise.all(
      updates.map(({ id, order_index }) =>
        supabase
          .from("partner_landing_sections")
          .update({ order_index, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("partner_id", partnerId)
      )
    );

    const { data: sections } = await supabase
      .from("partner_landing_sections")
      .select("*")
      .eq("partner_id", partnerId)
      .order("order_index");

    return NextResponse.json({ sections: sections ?? [] });
  }

  // Single section update: { id, content_json?, is_visible? }
  const { id, content_json, is_visible } = body;

  if (!id) return NextResponse.json({ error: "Section id required" }, { status: 400 });

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (content_json !== undefined) updatePayload.content_json = content_json;
  if (is_visible !== undefined) updatePayload.is_visible = is_visible;

  const { data: section, error } = await supabase
    .from("partner_landing_sections")
    .update(updatePayload)
    .eq("id", id)
    .eq("partner_id", partnerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section });
}

// DELETE — delete a single section by id
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Section id required" }, { status: 400 });

  const { error } = await supabase
    .from("partner_landing_sections")
    .delete()
    .eq("id", id)
    .eq("partner_id", partnerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

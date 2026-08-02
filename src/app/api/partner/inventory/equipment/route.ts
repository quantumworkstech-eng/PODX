import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

export async function POST(request: NextRequest) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();
  // Allow custom subcategories (UI offers a "Custom…" option) — any non-empty
  // value is accepted, not just the predefined SUBS set.
  const subcategory = String(body.subcategory || "").trim().toLowerCase();
  const model = String(body.model_name || "").trim();
  const defaultQty = Math.max(1, Math.floor(Number(body.default_quantity) || 1));

  if (!subcategory || !model) {
    return NextResponse.json({ error: "subcategory and model_name are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("partner_equipment_items")
    .insert({
      partner_id: partnerId,
      subcategory,
      model_name: model,
      default_quantity: defaultQty,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}

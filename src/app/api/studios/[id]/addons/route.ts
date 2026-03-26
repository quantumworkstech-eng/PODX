import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** Public: active platform add-ons linked to this studio (via studio_addons). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ addons: [] });
  }

  const { data: rows, error } = await supabase
    .from("studio_addons")
    .select(
      `
      platform_addons (
        id,
        name,
        description,
        price,
        category,
        is_active
      )
    `
    )
    .eq("studio_id", id);

  if (error) {
    console.error("studio addons GET:", error);
    return NextResponse.json({ addons: [] });
  }

  const addons = (rows ?? [])
    .map((r: { platform_addons: unknown }) => r.platform_addons)
    .filter((a) => {
      const row = a as { is_active?: boolean } | null;
      return Boolean(row && row.is_active !== false);
    });

  return NextResponse.json({ addons });
}

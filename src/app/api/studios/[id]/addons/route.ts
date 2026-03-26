import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchMergedStudioAddons } from "@/lib/studio-addons-public";

/** Public: platform add-ons + partner-defined add-ons linked to this studio. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ addons: [] });
  }

  try {
    const addons = await fetchMergedStudioAddons(supabase, id);
    return NextResponse.json({ addons });
  } catch (e) {
    console.error("studio addons GET:", e);
    return NextResponse.json({ addons: [] });
  }
}

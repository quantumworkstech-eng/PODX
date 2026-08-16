import { NextRequest, NextResponse } from "next/server";
import { getPublishedSnapshot } from "@/lib/cms/server";

/** Public read of the latest published snapshot. Hidden content is already stripped. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const snapshot = await getPublishedSnapshot(slug);
    if (!snapshot) return NextResponse.json({ snapshot: null }, { status: 404 });

    return NextResponse.json(
      { snapshot },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("[cms] public fetch error:", error);
    return NextResponse.json({ snapshot: null }, { status: 500 });
  }
}

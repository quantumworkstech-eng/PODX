import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";
import type { SectionType } from "@/types/landing";

// POST — generate section JSON using OpenAI
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured (OPENAI_API_KEY missing)" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { brand_name, tagline, tone = "professional", studio_count = 1 } = body;

  if (!brand_name) {
    return NextResponse.json({ error: "brand_name is required" }, { status: 400 });
  }

  const prompt = `You are a landing page content generator for a podcast/recording studio booking platform.

Generate a complete landing page for the following brand:
- Brand name: ${brand_name}
- Tagline: ${tagline || "Professional recording studios"}
- Tone: ${tone}
- Number of studios: ${studio_count}

Return ONLY a valid JSON array of sections. Each section must follow this shape:
{
  "type": "<hero|studios|features|reviews|about|cta|contact|footer>",
  "order_index": <number>,
  "is_visible": true,
  "content_json": { ... }
}

Section content rules:
- hero: { heading, subheading, cta_primary_text, cta_secondary_text }
- features: { heading, subheading, items: [{icon, title, description}] } — use Lucide icon names: Mic, Headphones, Camera, Wifi, Shield, Zap, Star, Users, Globe
- studios: { heading, subheading, columns: 3, show_price: true, show_capacity: true }
- about: { heading, description, image_position: "right" }
- reviews: { heading, subheading, show_dynamic: true, items: [] }
- cta: { heading, subheading, cta_text, background_style: "gradient" }
- contact: { heading, subheading, show_email: true, show_phone: true, show_address: true }
- footer: { show_social: true, show_nav: true }

Generate 6-7 sections in a logical order. Include hero, studios, features, cta, and footer at minimum.
Return ONLY the JSON array, no explanation.`;

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { sections?: unknown[] };

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // If the AI wrapped sections in an object, unwrap it
    let sections = Array.isArray(parsed) ? parsed : (parsed as { sections?: unknown[] }).sections ?? [];

    // Validate section types
    const validTypes: SectionType[] = [
      "hero", "studios", "features", "reviews", "about", "cta", "contact", "footer", "custom",
    ];
    sections = (sections as Array<{ type?: string; order_index?: number; is_visible?: boolean; content_json?: unknown }>).filter(
      (s) => s.type && validTypes.includes(s.type as SectionType)
    );

    return NextResponse.json({ sections });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

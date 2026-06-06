import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type LeadPayload = {
  description?: string;
  studioType?: string;
  city?: string;
  operationalAge?: string;
  weeklySlots?: string;
  monthlyBookings?: string;
  pricing?: string;
  equipment?: string[];
  biggestChallenge?: string;
  listedPlatform?: string;
  joinReason?: string;
  studioName?: string;
  contactName?: string;
  whatsapp?: string;
  websiteOrInstagram?: string;
};

const requiredFields: Array<keyof LeadPayload> = [
  'description',
  'studioType',
  'city',
  'operationalAge',
  'weeklySlots',
  'monthlyBookings',
  'pricing',
  'biggestChallenge',
  'listedPlatform',
  'joinReason',
  'studioName',
  'contactName',
  'whatsapp',
];

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  let payload: LeadPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const cleaned: LeadPayload = {
    description: cleanText(payload.description),
    studioType: cleanText(payload.studioType),
    city: cleanText(payload.city),
    operationalAge: cleanText(payload.operationalAge),
    weeklySlots: cleanText(payload.weeklySlots),
    monthlyBookings: cleanText(payload.monthlyBookings),
    pricing: cleanText(payload.pricing),
    equipment: Array.isArray(payload.equipment) ? payload.equipment.map(cleanText).filter(Boolean) : [],
    biggestChallenge: cleanText(payload.biggestChallenge),
    listedPlatform: cleanText(payload.listedPlatform),
    joinReason: cleanText(payload.joinReason),
    studioName: cleanText(payload.studioName),
    contactName: cleanText(payload.contactName),
    whatsapp: cleanText(payload.whatsapp),
    websiteOrInstagram: cleanText(payload.websiteOrInstagram),
  };

  for (const field of requiredFields) {
    if (!cleaned[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  if (!cleaned.equipment?.length) {
    return NextResponse.json({ error: 'Missing field: equipment' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('partner_leads')
    .insert({
      description: cleaned.description,
      studio_type: cleaned.studioType,
      city: cleaned.city,
      operational_age: cleaned.operationalAge,
      weekly_slots: cleaned.weeklySlots,
      monthly_bookings: cleaned.monthlyBookings,
      pricing: cleaned.pricing,
      equipment: cleaned.equipment,
      biggest_challenge: cleaned.biggestChallenge,
      listed_platform: cleaned.listedPlatform,
      join_reason: cleaned.joinReason,
      studio_name: cleaned.studioName,
      contact_name: cleaned.contactName,
      whatsapp: cleaned.whatsapp,
      website_or_instagram: cleaned.websiteOrInstagram || null,
      answers: cleaned,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('Error creating partner lead:', error);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }

  return NextResponse.json({ lead: data }, { status: 201 });
}

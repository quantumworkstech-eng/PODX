import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type LeadPayload = {
  description?: string;
  studioType?: string;
  city?: string | string[];
  operationalAge?: string;
  weeklySlots?: string;
  monthlyBookings?: string;
  pricing?: string;
  equipment?: string[];
  equipmentDetails?: string[];
  addonServices?: string[];
  biggestChallenge?: string | string[];
  listedPlatform?: string;
  joinReason?: string | string[];
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

function cleanTextList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(cleanText).filter(Boolean) : [];
}

function cleanTextOrList(value: unknown): string {
  return Array.isArray(value) ? cleanTextList(value).join(', ') : cleanText(value);
}

function cleanAnswerChoice(value: unknown): string | string[] {
  return Array.isArray(value) ? cleanTextList(value) : cleanText(value);
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
    city: cleanTextOrList(payload.city),
    operationalAge: cleanText(payload.operationalAge),
    weeklySlots: cleanText(payload.weeklySlots),
    monthlyBookings: cleanText(payload.monthlyBookings),
    pricing: cleanText(payload.pricing),
    equipment: cleanTextList(payload.equipment),
    equipmentDetails: cleanTextList(payload.equipmentDetails),
    addonServices: cleanTextList(payload.addonServices),
    biggestChallenge: cleanTextOrList(payload.biggestChallenge),
    listedPlatform: cleanText(payload.listedPlatform),
    joinReason: cleanTextOrList(payload.joinReason),
    studioName: cleanText(payload.studioName),
    contactName: cleanText(payload.contactName),
    whatsapp: cleanText(payload.whatsapp),
    websiteOrInstagram: cleanText(payload.websiteOrInstagram),
  };

  const answers = {
    ...cleaned,
    city: cleanAnswerChoice(payload.city),
    biggestChallenge: cleanAnswerChoice(payload.biggestChallenge),
    joinReason: cleanAnswerChoice(payload.joinReason),
  };

  for (const field of requiredFields) {
    if (!cleaned[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  if (!cleaned.equipment?.length) {
    return NextResponse.json({ error: 'Missing field: equipment' }, { status: 400 });
  }

  if (!cleaned.equipmentDetails?.length) {
    return NextResponse.json({ error: 'Missing field: equipmentDetails' }, { status: 400 });
  }

  if (!cleaned.addonServices?.length) {
    return NextResponse.json({ error: 'Missing field: addonServices' }, { status: 400 });
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
      answers,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('Error creating partner lead:', error);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }

  return NextResponse.json({ lead: data }, { status: 201 });
}

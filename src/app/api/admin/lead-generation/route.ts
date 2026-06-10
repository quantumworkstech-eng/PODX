import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('partner_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching partner leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  const leads = (data || []).map((lead) => ({
    id: lead.id,
    timestamp: lead.created_at,
    submittedAt: lead.created_at,
    answers: {
      description: lead.description,
      studioType: lead.studio_type,
      city: lead.city,
      operationalAge: lead.operational_age,
      weeklySlots: lead.weekly_slots,
      monthlyBookings: lead.monthly_bookings,
      pricing: lead.pricing,
      equipment: lead.equipment || [],
      equipmentDetails: Array.isArray(lead.answers?.equipmentDetails)
        ? lead.answers.equipmentDetails
        : [],
      addonServices: Array.isArray(lead.answers?.addonServices)
        ? lead.answers.addonServices
        : [],
      biggestChallenge: lead.biggest_challenge,
      listedPlatform: lead.listed_platform,
      joinReason: lead.join_reason,
      studioName: lead.studio_name,
      contactName: lead.contact_name,
      whatsapp: lead.whatsapp,
      websiteOrInstagram: lead.website_or_instagram || '',
    },
  }));

  return NextResponse.json({ leads });
}

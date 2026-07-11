import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/studios/[id]/policy
// Returns cancellation rules and reschedule cutoff for a studio (public, no auth needed)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabaseAdmin) {
    return NextResponse.json({ policy: null, reschedule_cutoff_hours: 48 });
  }

  // Fetch studio reschedule cutoff
  const { data: studio } = await supabaseAdmin
    .from('studios')
    .select('reschedule_cutoff_hours')
    .eq('id', id)
    .maybeSingle();

  const rescheduleCutoff = studio?.reschedule_cutoff_hours ?? 48;

  // Fetch custom cancellation policies, sorted ascending by hours_before
  const { data: policies } = await supabaseAdmin
    .from('cancellation_policies')
    .select('hours_before, refund_percentage, description')
    .eq('studio_id', id)
    .order('hours_before', { ascending: false });

  // If no custom policies, return platform defaults
  const rules = policies && policies.length > 0
    ? policies
    : [
        { hours_before: 48, refund_percentage: 100, description: 'Full refund if cancelled 48+ hours before' },
        { hours_before: 24, refund_percentage: 50, description: '50% refund if cancelled 24–48 hours before' },
        { hours_before: 0, refund_percentage: 0, description: 'No refund if cancelled under 24 hours before' },
      ];

  return NextResponse.json({ rules, reschedule_cutoff_hours: rescheduleCutoff });
}

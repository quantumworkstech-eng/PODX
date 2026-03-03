import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST — studio owner adds response to review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Verify the studio belongs to this partner
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('studio_id, studios(owner_id)')
    .eq('id', reviewId)
    .maybeSingle();

  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const studioOwner = (review as any).studios?.owner_id;
  if (studioOwner !== user.id) {
    return NextResponse.json({ error: 'Not authorized to respond to this review' }, { status: 403 });
  }

  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Response content required' }, { status: 400 });

  // Remove existing response if any
  await supabaseAdmin.from('review_responses').delete().eq('review_id', reviewId);

  const { data: response, error } = await supabaseAdmin
    .from('review_responses')
    .insert({ review_id: reviewId, user_id: user.id, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });

  return NextResponse.json({ response }, { status: 201 });
}

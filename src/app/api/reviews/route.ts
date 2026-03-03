import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getUserId(email: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  return data?.id ?? null;
}

// GET reviews for a studio
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ reviews: [] });

  const { searchParams } = new URL(request.url);
  const studioId = searchParams.get('studio_id');
  const userId = searchParams.get('user_id');

  if (!studioId && !userId) {
    return NextResponse.json({ error: 'studio_id or user_id required' }, { status: 400 });
  }

  let query = supabaseAdmin
    .from('reviews')
    .select(`
      id, rating, title, content, is_verified, created_at, booking_id, studio_id,
      users!reviews_user_id_fkey(profiles(full_name, avatar_url)),
      review_responses(id, content, created_at)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (studioId) query = query.eq('studio_id', studioId);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ reviews: [] });
  }

  const reviews = (data || []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    is_verified: r.is_verified,
    created_at: r.created_at,
    booking_id: r.booking_id,
    studio_id: r.studio_id,
    author_name: r.users?.profiles?.full_name || 'Anonymous',
    author_avatar: r.users?.profiles?.avatar_url || null,
    responses: r.review_responses || [],
  }));

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Rating distribution
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => { if (r.rating in distribution) distribution[r.rating]++; });

  return NextResponse.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, distribution, total: reviews.length });
}

// POST — create a review
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = await getUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { booking_id, studio_id, rating, title, comment } = await request.json();

  if (!booking_id || !studio_id || !rating) {
    return NextResponse.json({ error: 'booking_id, studio_id, and rating are required' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  // Verify booking belongs to user and is completed
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, status, user_id')
    .eq('id', booking_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });
  }

  // Check for duplicate review
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('booking_id', booking_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 409 });

  // Create review
  const { data: review, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      studio_id,
      user_id: userId,
      booking_id,
      rating,
      title: title || null,
      content: comment || null,
      is_verified: true,
      status: 'published',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }

  // Notify studio owner
  const { data: studio } = await supabaseAdmin
    .from('studios')
    .select('owner_id, name')
    .eq('id', studio_id)
    .maybeSingle();

  if (studio?.owner_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: studio.owner_id,
      type: 'new_review',
      title: 'New Review Received',
      content: `Someone left a ${rating}-star review for ${studio.name}.`,
      action_url: '/partner/reviews',
    });
  }

  return NextResponse.json({ review }, { status: 201 });
}

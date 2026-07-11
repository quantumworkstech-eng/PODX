import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getUserId(email: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  return data?.id ?? null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ notifications: [] });

  const userId = await getUserId(session.user.email);
  if (!userId) return NextResponse.json({ notifications: [] });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  let query = supabaseAdmin
    .from('notifications')
    .select('id, type, title, content, is_read, action_url, created_at, data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [] });
  }

  const unreadCount = (data || []).filter((n: any) => !n.is_read).length;

  return NextResponse.json({ notifications: data || [], unreadCount });
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const userId = await getUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { ids, markAll } = body;

  if (markAll) {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
  } else if (ids?.length) {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', userId);
  }

  return NextResponse.json({ success: true });
}

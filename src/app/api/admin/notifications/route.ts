import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const type = searchParams.get('type'); // filter by type

  let query = supabaseAdmin
    .from('notifications')
    .select('*, users!notifications_user_id_fkey(email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== 'all') query = query.eq('type', type);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });

  return NextResponse.json({ notifications: data || [], total: count || 0, page, limit });
}

export async function POST(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await request.json();
  const { target, targetEmail, type, title, content, actionUrl } = body;

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const notifPayload = {
    type: type || 'admin_message',
    title,
    content,
    action_url: actionUrl || null,
    is_read: false,
  };

  if (target === 'all') {
    // Send to all users
    const { data: users } = await supabaseAdmin.from('users').select('id');
    if (users && users.length > 0) {
      const inserts = users.map((u: any) => ({ ...notifPayload, user_id: u.id }));
      await supabaseAdmin.from('notifications').insert(inserts);
    }
    await logAdminAction(email, 'send_bulk_notification', 'notification', undefined, { title, target: 'all', count: users?.length });
    return NextResponse.json({ success: true, sent: users?.length || 0 });
  }

  if (target === 'user' && targetEmail) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', targetEmail)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await supabaseAdmin.from('notifications').insert({ ...notifPayload, user_id: user.id });
    await logAdminAction(email, 'send_notification', 'notification', undefined, { title, targetEmail });
    return NextResponse.json({ success: true, sent: 1 });
  }

  return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
}

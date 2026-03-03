import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function requireAdmin(email: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (!user) return false;
  const { data: roleData } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
  return (roleData || []).some((r: any) => r.roles?.name === 'admin');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await requireAdmin(session.user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await request.json();
  const { action } = body;

  const updates: Record<string, any> = {};

  if (action === 'approve') {
    updates.review_status = 'approved';
    updates.is_active = true;
  } else if (action === 'reject') {
    updates.review_status = 'rejected';
    updates.is_active = false;
  } else if (action === 'suspend') {
    updates.review_status = 'suspended';
    updates.is_active = false;
  } else if (action === 'activate') {
    updates.is_active = true;
    updates.review_status = 'approved';
  } else {
    // Direct field update
    const allowed = ['name', 'description', 'is_active', 'review_status'];
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
  }

  const { error } = await supabaseAdmin.from('studios').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update studio' }, { status: 500 });
  }

  // Notify studio owner if approved/rejected
  if (action === 'approve' || action === 'reject') {
    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('owner_id, name')
      .eq('id', id)
      .maybeSingle();

    if (studio?.owner_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: studio.owner_id,
        type: action === 'approve' ? 'studio_approved' : 'studio_rejected',
        title: action === 'approve' ? 'Studio Approved!' : 'Studio Rejected',
        content: action === 'approve'
          ? `Your studio "${studio.name}" has been approved and is now live.`
          : `Your studio "${studio.name}" was not approved. Please contact support for details.`,
        action_url: '/partner/studios',
      });
    }
  }

  return NextResponse.json({ success: true });
}

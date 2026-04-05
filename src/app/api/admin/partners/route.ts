import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

type PartnerRow = {
  id: string;
  email: string;
  name: string;
  studios: { id: string; name: string; review_status: string }[];
};

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const byId = new Map<string, PartnerRow>();

  const add = (u: { id?: string; email?: string; profiles?: { full_name?: string | null } | null }) => {
    if (!u?.id || !u.email || byId.has(u.id)) return;
    byId.set(u.id, {
      id: u.id,
      email: u.email,
      name: u.profiles?.full_name?.trim() || u.email,
      studios: [],
    });
  };

  const { data: byRoleColumn, error: colErr } = await supabaseAdmin
    .from('users')
    .select('id, email, profiles(full_name)')
    .eq('role', 'partner');

  if (colErr) {
    console.error('Error fetching partners (users.role):', colErr);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }

  (byRoleColumn || []).forEach((u: any) => add(u));

  const { data: byUserRoles, error: urErr } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, roles!inner(name), users!inner(id, email, profiles(full_name))')
    .eq('roles.name', 'partner');

  if (urErr) {
    console.error('Error fetching partners (user_roles):', urErr);
  } else {
    (byUserRoles || []).forEach((row: any) => add(row.users));
  }

  const ids = Array.from(byId.keys());
  if (ids.length > 0) {
    const { data: studios, error: stErr } = await supabaseAdmin
      .from('studios')
      .select('id, name, review_status, owner_id')
      .in('owner_id', ids);

    if (stErr) {
      console.error('Error fetching studios for partners:', stErr);
    } else {
      (studios || []).forEach((s: any) => {
        const p = s.owner_id ? byId.get(s.owner_id) : undefined;
        if (p) {
          p.studios.push({
            id: s.id,
            name: s.name,
            review_status: s.review_status || 'pending_review',
          });
        }
      });
    }
  }

  const partners = Array.from(byId.values()).sort((a, b) => a.email.localeCompare(b.email));

  return NextResponse.json({ partners });
}

import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

type PartnerRow = {
  id: string;
  email: string;
  name: string;
  studios: { id: string; name: string; review_status: string }[];
};

/** Same rules as GET /api/admin/users role chips: partner from role, user_roles, or owning studios (unless admin-only). */
function userShowsAsPartner(role: string | null | undefined, userRoles: unknown, studioCount: number): boolean {
  const allRoles = new Set<string>();
  if (role) allRoles.add(role);
  ((userRoles as { roles?: { name?: string } }[]) || []).forEach((ur) => {
    if (ur.roles?.name) allRoles.add(ur.roles.name);
  });
  if (studioCount > 0 && !allRoles.has('admin')) allRoles.add('partner');
  return allRoles.has('partner');
}

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { data: allStudios, error: stErr } = await supabaseAdmin
    .from('studios')
    .select('id, name, review_status, owner_id')
    .not('owner_id', 'is', null);

  if (stErr) {
    console.error('Error fetching studios for partners:', stErr);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }

  const studiosByOwner = new Map<string, { id: string; name: string; review_status: string }[]>();
  for (const s of allStudios || []) {
    if (!s.owner_id) continue;
    const row = {
      id: s.id,
      name: s.name,
      review_status: s.review_status || 'pending_review',
    };
    const list = studiosByOwner.get(s.owner_id) || [];
    list.push(row);
    studiosByOwner.set(s.owner_id, list);
  }

  const candidateIds = new Set<string>(studiosByOwner.keys());

  const { data: byRoleColumn } = await supabaseAdmin.from('users').select('id').eq('role', 'partner');
  (byRoleColumn || []).forEach((u: { id: string }) => candidateIds.add(u.id));

  const { data: byUserRoles, error: urErr } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, roles!inner(name)')
    .eq('roles.name', 'partner');

  if (urErr) {
    console.error('Error fetching partners (user_roles):', urErr);
  } else {
    (byUserRoles || []).forEach((row: { user_id: string }) => candidateIds.add(row.user_id));
  }

  const ids = Array.from(candidateIds);
  if (ids.length === 0) {
    return NextResponse.json({ partners: [] });
  }

  const { data: users, error: usersErr } = await supabaseAdmin
    .from('users')
    .select('id, email, role, profiles(full_name), user_roles(roles(name))')
    .in('id', ids);

  if (usersErr) {
    console.error('Error fetching partner users:', usersErr);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }

  const partners: PartnerRow[] = [];
  for (const u of users || []) {
    const studioCount = (studiosByOwner.get(u.id) || []).length;
    if (!userShowsAsPartner(u.role, u.user_roles, studioCount)) continue;
    if (!u.email) continue;

    const prof = u.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null | undefined;
    const fullName = Array.isArray(prof) ? prof[0]?.full_name : prof?.full_name;

    partners.push({
      id: u.id,
      email: u.email,
      name: fullName?.trim() || u.email,
      studios: studiosByOwner.get(u.id) || [],
    });
  }

  partners.sort((a, b) => a.email.localeCompare(b.email));

  return NextResponse.json({ partners });
}

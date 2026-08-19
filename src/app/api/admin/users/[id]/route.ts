import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { mergeAdminRoleSelection, parseRoleColumn, roleColumnHas } from '@/lib/user-role-column';
import { emitNotification } from '@/lib/notifications';
import { createAuditLog } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await request.json();
  const { action, role, reason } = body;

  if (action === 'ban') {
    // We store ban state by updating a metadata field - for now mark as unverified
    await supabaseAdmin.from('users').update({ email_verified: false }).eq('id', id);

    await createAuditLog({
      action: 'USER_DEACTIVATED',
      module: 'Users',
      description: `Suspended account access for user ${id}`,
      recordType: 'user',
      recordId: id,
      oldValues: { email_verified: true },
      newValues: { email_verified: false },
      metadata: reason ? { reason } : null,
    });

    // Partners lose their listings, so they get the partner suspension notice;
    // for everyone else this is an account-access change.
    if (await isPartner(id)) {
      await emitNotification('PARTNER_SUSPENDED', { partnerId: id, metadata: { reason: reason || null } });
    } else {
      await emitNotification('CLIENT_SECURITY_UPDATE', {
        clientId: id,
        metadata: {
          changeSummary: 'Your account access has been suspended by our team.',
          occurredAt: new Date().toISOString(),
        },
      });
    }
    return NextResponse.json({ success: true, message: 'User banned' });
  }

  if (action === 'unban') {
    await supabaseAdmin.from('users').update({ email_verified: true }).eq('id', id);

    await createAuditLog({
      action: 'USER_ACTIVATED',
      module: 'Users',
      description: `Restored account access for user ${id}`,
      recordType: 'user',
      recordId: id,
      oldValues: { email_verified: false },
      newValues: { email_verified: true },
    });

    if (await isPartner(id)) {
      await emitNotification('PARTNER_REACTIVATED', { partnerId: id });
    } else {
      await emitNotification('CLIENT_SECURITY_UPDATE', {
        clientId: id,
        metadata: {
          changeSummary: 'Your account access has been restored.',
          occurredAt: new Date().toISOString(),
        },
      });
    }
    return NextResponse.json({ success: true, message: 'User unbanned' });
  }

  // Partner application decisions. Kept separate from `change_role` so an
  // admin can reject an application without touching roles.
  if (action === 'partner_decision') {
    const decision = String(body.decision || '');
    if (decision === 'approve') {
      await emitNotification('PARTNER_APPROVED', { partnerId: id });
      await createAuditLog({
        action: 'PARTNER_APPROVED', module: 'Partners',
        description: `Approved partner application for user ${id}`,
        recordType: 'user', recordId: id,
      });
    } else if (decision === 'reject') {
      await emitNotification('PARTNER_REJECTED', { partnerId: id, metadata: { reason: reason || null } });
      await createAuditLog({
        action: 'PARTNER_REJECTED', module: 'Partners',
        description: `Rejected partner application for user ${id}`,
        recordType: 'user', recordId: id,
        metadata: reason ? { reason } : null,
      });
    } else {
      return NextResponse.json({ error: 'decision must be approve or reject' }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: `Partner ${decision}d` });
  }

  if (action === 'change_role' && role) {
    const validRoles = ['user', 'partner', 'admin'];
    if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    const { data: row } = await supabaseAdmin.from('users').select('role').eq('id', id).maybeSingle();
    const nextRole = mergeAdminRoleSelection((row as { role?: string } | null)?.role ?? null, role);

    await supabaseAdmin.from('users').update({ role: nextRole }).eq('id', id);

    await createAuditLog({
      action: 'ROLE_CHANGED',
      module: 'Users',
      description: `Changed role for user ${id} to "${nextRole}"`,
      recordType: 'user',
      recordId: id,
      oldValues: { role: (row as { role?: string } | null)?.role ?? null },
      newValues: { role: nextRole },
      metadata: { requested_role: role },
    });

    if (role === 'partner' && roleColumnHas(nextRole, 'partner')) {
      const { data: partnerRole } = await supabaseAdmin.from('roles').select('id').eq('name', 'partner').maybeSingle();
      if (partnerRole?.id) {
        await supabaseAdmin.from('user_roles').upsert({ user_id: id, role_id: partnerRole.id });
      }
      // Granting the partner role is how an application gets approved today.
      await emitNotification('PARTNER_APPROVED', { partnerId: id });
    }

    if (role === 'user') {
      const { data: pr } = await supabaseAdmin.from('roles').select('id').eq('name', 'partner').maybeSingle();
      if (pr?.id && !roleColumnHas(nextRole, 'partner')) {
        await supabaseAdmin.from('user_roles').delete().eq('user_id', id).eq('role_id', pr.id);
      }
    }

    return NextResponse.json({ success: true, message: 'Role updated' });
  }

  if (action === 'update_profile') {
    const { full_name, phone } = body;
    const { data: existing } = await supabaseAdmin
      .from('profiles').select('user_id, full_name, phone').eq('user_id', id).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('profiles').update({ full_name: full_name ?? null, phone: phone ?? null }).eq('user_id', id);
    } else {
      await supabaseAdmin.from('profiles').insert({ user_id: id, full_name: full_name ?? null, phone: phone ?? null });
    }

    await createAuditLog({
      action: 'USER_UPDATED',
      module: 'Users',
      description: `Updated profile for user ${id}`,
      recordType: 'user',
      recordId: id,
      recordName: full_name ?? null,
      oldValues: existing ? { full_name: existing.full_name ?? null, phone: existing.phone ?? null } : null,
      newValues: { full_name: full_name ?? null, phone: phone ?? null },
    });

    return NextResponse.json({ success: true, message: 'Profile updated' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const [{ data: user }, { data: bookings }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, email, auth_provider, email_verified, created_at, role, profiles(full_name, avatar_url, phone), user_roles(roles(name)), studios!studios_owner_id_fkey(id)')
      .eq('id', id)
      .maybeSingle(),
    supabaseAdmin
      .from('bookings')
      .select('id, booking_number, status, total_price, start_time, created_at, studios(name)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const allRoles = new Set<string>();
  parseRoleColumn((user as { role?: string }).role).forEach((r) => allRoles.add(r));
  ((user as any).user_roles || []).forEach((ur: any) => { if (ur.roles?.name) allRoles.add(ur.roles.name); });
  const studioCount = ((user as any).studios || []).length;
  if (studioCount > 0 && !allRoles.has('admin')) allRoles.add('partner');

  return NextResponse.json({
    user: {
      ...user,
      roles: Array.from(allRoles),
      studio_count: studioCount,
    },
    bookings: bookings || [],
  });
}

/** Does this user hold the partner role (role column, user_roles, or owned studios)? */
async function isPartner(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role, user_roles(roles(name)), studios!studios_owner_id_fkey(id)')
    .eq('id', userId)
    .maybeSingle();
  if (!user) return false;

  if (parseRoleColumn((user as { role?: string }).role).includes('partner')) return true;
  const roleNames = ((user as { user_roles?: { roles?: { name?: string } }[] }).user_roles || [])
    .map((ur) => ur.roles?.name)
    .filter(Boolean);
  if (roleNames.includes('partner')) return true;

  return (((user as { studios?: unknown[] }).studios) || []).length > 0;
}

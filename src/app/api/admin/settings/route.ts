import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('key, value, category');

  if (error) return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });

  // Convert to key-value map
  const settings: Record<string, string> = {};
  (data || []).forEach((row: any) => { settings[row.key] = row.value; });

  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { settings } = await request.json() as { settings: Record<string, string> };

  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
  }

  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
    updated_by_email: email,
  }));

  // Snapshot the previous values so the audit entry can show what changed.
  const { data: previousRows } = await supabaseAdmin
    .from('platform_settings')
    .select('key, value')
    .in('key', Object.keys(settings));
  const previous: Record<string, string> = {};
  for (const row of (previousRows || []) as { key: string; value: string }[]) {
    previous[row.key] = row.value;
  }

  const { error } = await supabaseAdmin
    .from('platform_settings')
    .upsert(upserts, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });

  await createAuditLog({
    action: 'SETTINGS_UPDATED',
    module: 'Settings',
    description: `Updated ${Object.keys(settings).length} platform setting${Object.keys(settings).length === 1 ? '' : 's'}`,
    recordType: 'platform_settings',
    oldValues: previous,
    newValues: settings,
  });

  await logAdminAction(email, 'update_settings', 'settings', undefined, { keys: Object.keys(settings) }, { mirrorToAuditLog: false });

  return NextResponse.json({ success: true });
}

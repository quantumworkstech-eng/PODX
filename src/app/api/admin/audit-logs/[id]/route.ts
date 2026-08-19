import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

/** GET one audit entry in full, including old/new values, for the detail drawer. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;

  // Explicit column list rather than '*' so ip_address is never serialised to
  // the browser, even though it stays in the table.
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select(
      'id, created_at, user_id, user_name, user_email, user_role, action, module, description, ' +
      'record_type, record_id, record_name, old_values, new_values, browser, device, status, error_message, metadata'
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'Audit entry not found' }, { status: 404 });

  return NextResponse.json({ log: data });
}

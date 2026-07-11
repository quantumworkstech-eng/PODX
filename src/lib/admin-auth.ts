import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'admin-fallback-secret');

export async function getAdminEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') return null;
    return payload.email as string;
  } catch {
    return null;
  }
}

export async function logAdminAction(
  adminEmail: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();

    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: user?.id || null,
      admin_email: adminEmail,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch {
    // Audit logging failure should not block the main action
  }
}

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { createAuditLog } from '@/lib/audit';
import type { AuditAction, AuditModule } from '@/lib/audit';

// Must match how the admin_session cookie is signed (admin/login/actions.ts)
// and verified in middleware.ts — NextAuth v5 uses AUTH_SECRET.
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'admin-fallback-secret'
);

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

/**
 * Map the legacy free-text (action, entityType) pairs used by the admin routes
 * onto the audit taxonomy, so every existing call site produces a proper audit
 * record without each one being rewritten.
 */
function classifyAdminAction(action: string, entityType: string): { action: AuditAction; module: AuditModule } {
  const a = action.toLowerCase();
  const e = entityType.toLowerCase();

  const auditModule: AuditModule =
    e.includes('studio') ? 'Studios'
    : e.includes('booking') ? 'Bookings'
    : e.includes('payout') || e.includes('payment') || e.includes('refund') ? 'Payments'
    : e.includes('partner') ? 'Partners'
    : e.includes('review') ? 'Reviews'
    : e.includes('user') || e.includes('admin') ? 'Users'
    : e.includes('setting') || e.includes('mailer') ? 'Settings'
    : e.includes('cms') || e.includes('landing') || e.includes('page') ? 'Content'
    : 'System';

  const verb: AuditAction =
    /delete|remove/.test(a) ? (auditModule === 'Studios' ? 'STUDIO_DELETED' : auditModule === 'Reviews' ? 'REVIEW_DELETED' : 'USER_DELETED')
    : /approve/.test(a) ? (auditModule === 'Studios' ? 'STUDIO_APPROVED' : auditModule === 'Partners' ? 'PARTNER_APPROVED' : 'OTHER')
    : /reject/.test(a) ? (auditModule === 'Studios' ? 'STUDIO_REJECTED' : auditModule === 'Partners' ? 'PARTNER_REJECTED' : 'OTHER')
    : /suspend|pause/.test(a) ? (auditModule === 'Studios' ? 'STUDIO_SUSPENDED' : 'PARTNER_SUSPENDED')
    : /activate/.test(a) ? (auditModule === 'Studios' ? 'STUDIO_ACTIVATED' : 'USER_ACTIVATED')
    : /cancel/.test(a) ? (auditModule === 'Bookings' ? 'BOOKING_CANCELLED' : 'SUBSCRIPTION_CANCELLED')
    : /reschedule/.test(a) ? 'BOOKING_RESCHEDULED'
    : /refund/.test(a) ? 'REFUND_INITIATED'
    : /payout/.test(a) ? (/fail/.test(a) ? 'PAYOUT_FAILED' : 'PAYOUT_PROCESSED')
    : /status/.test(a) ? 'BOOKING_STATUS_CHANGED'
    : /role/.test(a) ? 'ROLE_CHANGED'
    : /setting|mailer/.test(a) ? 'SETTINGS_UPDATED'
    : /create|add/.test(a) ? (auditModule === 'Studios' ? 'STUDIO_CREATED' : auditModule === 'Bookings' ? 'BOOKING_CREATED' : 'USER_CREATED')
    : /edit|update/.test(a) ? (auditModule === 'Studios' ? 'STUDIO_UPDATED' : auditModule === 'Bookings' ? 'BOOKING_UPDATED' : 'USER_UPDATED')
    : /export/.test(a) ? 'DATA_EXPORTED'
    : 'OTHER';

  return { action: verb, module: auditModule };
}

/**
 * Record an admin action.
 *
 * Writes to the rich `audit_logs` table (surfaced at /admin/audit-logs) and
 * keeps appending to the original `admin_audit_logs` table so anything still
 * reading that view continues to work.
 */
export async function logAdminAction(
  adminEmail: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
  /**
   * Set `mirrorToAuditLog: false` where the route already emits its own richer
   * `createAuditLog` call — otherwise the same event is recorded twice.
   */
  options?: { mirrorToAuditLog?: boolean }
): Promise<void> {
  if (!supabaseAdmin) return;

  let adminUserId: string | null = null;
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();
    adminUserId = user?.id ?? null;

    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: adminUserId,
      admin_email: adminEmail,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch {
    // Legacy audit logging failure should not block the main action.
  }

  if (options?.mirrorToAuditLog === false) return;

  const { action: auditAction, module } = classifyAdminAction(action, entityType);

  await createAuditLog({
    action: auditAction,
    module,
    description: `Admin ${action.replace(/_/g, ' ')} on ${entityType}${entityId ? ` ${entityId}` : ''}`,
    actor: { id: adminUserId, email: adminEmail, name: adminEmail.split('@')[0], role: 'admin' },
    recordType: entityType,
    recordId: entityId ?? null,
    metadata: { legacy_action: action, ...(details || {}) },
  });
}

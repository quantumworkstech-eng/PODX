/**
 * The one place audit records are written.
 *
 *   await createAuditLog({ action, module, description, ... })
 *
 * Rules this enforces so callers don't have to:
 *
 *  - the actor is resolved automatically (admin session, then NextAuth session)
 *    unless the caller passes one explicitly, e.g. for a failed login where
 *    there is no session yet;
 *  - IP, browser and device are read from the ambient request;
 *  - old/new values are reduced to just the fields that changed and stripped of
 *    anything credential-shaped;
 *  - a write failure never propagates. Auditing must not be able to fail the
 *    operation it is recording.
 *
 * Call it only *after* the underlying operation has succeeded — a SUCCESS row
 * asserts the action actually happened. Use `status: 'FAILED'` with
 * `errorMessage` to record an attempt that did not.
 */

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import type { AuditAction, AuditModule, AuditStatus } from './actions';
import { diffValues, redactObject, redactText } from './redact';
import { getRequestContext, type RequestContext } from './request-context';

export type AuditActor = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type CreateAuditLogInput = {
  action: AuditAction;
  module: AuditModule;
  description: string;

  /** Omit to resolve from the current session. Pass `null` for system actions. */
  actor?: AuditActor | null;

  recordType?: string | null;
  recordId?: string | null;
  recordName?: string | null;

  /** State before the change — only changed fields are stored. */
  oldValues?: Record<string, unknown> | null;
  /** State after the change. */
  newValues?: Record<string, unknown> | null;

  status?: AuditStatus;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;

  /** Supply when headers are already in hand (route handlers). */
  request?: RequestContext | null;
};

const adminSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'admin-fallback-secret'
);

/** Admin panel session — a signed cookie, not NextAuth. */
async function adminActor(): Promise<AuditActor | null> {
  try {
    const token = (await cookies()).get('admin_session')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, adminSecret);
    if (payload.role !== 'admin') return null;
    const email = payload.email as string;
    return { email, name: email.split('@')[0], role: 'admin' };
  } catch {
    return null;
  }
}

/** Customer / partner session from NextAuth. */
async function sessionActor(): Promise<AuditActor | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;
    return {
      id: (session.user as { id?: string }).id ?? null,
      email: session.user.email,
      name: session.user.name ?? session.user.email.split('@')[0],
      role: (session.user as { role?: string }).role ?? 'user',
    };
  } catch {
    return null;
  }
}

/** Admin session wins: an admin acting on a user's behalf is the real actor. */
export async function resolveActor(): Promise<AuditActor | null> {
  return (await adminActor()) ?? (await sessionActor());
}

/** Fill in the actor's database id and display name when only an email is known. */
async function hydrateActor(actor: AuditActor): Promise<AuditActor> {
  if (!supabaseAdmin || actor.id || !actor.email) return actor;
  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, role, profiles(full_name)')
      .eq('email', actor.email)
      .maybeSingle();
    if (!data) return actor;
    const profiles = data.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      ...actor,
      id: data.id,
      name: actor.name || profile?.full_name || null,
      role: actor.role || data.role || null,
    };
  } catch {
    return actor;
  }
}

/**
 * Write one audit record. Never throws and never rejects — failures are logged
 * to the server console only.
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    if (!supabaseAdmin) return;

    // `actor: null` means "system"; `undefined` means "work it out".
    const rawActor = input.actor === null ? null : input.actor ?? (await resolveActor());
    const actor = rawActor ? await hydrateActor(rawActor) : null;

    const context = input.request ?? (await getRequestContext());
    const { old: oldValues, new: newValues } = diffValues(input.oldValues, input.newValues);

    const row = {
      user_id: actor?.id ?? null,
      user_name: actor?.name ?? (actor ? null : 'System'),
      user_email: actor?.email ?? null,
      user_role: actor?.role ?? (actor ? null : 'system'),

      action: input.action,
      module: input.module,
      description: redactText(input.description),

      record_type: input.recordType ?? null,
      record_id: input.recordId ? String(input.recordId) : null,
      record_name: input.recordName ? redactText(String(input.recordName)) : null,

      old_values: oldValues,
      new_values: newValues,

      ip_address: context.ip,
      browser: context.browser,
      device: context.device,

      status: input.status ?? 'SUCCESS',
      error_message: input.errorMessage ? redactText(input.errorMessage) : null,
      metadata: redactObject(input.metadata) ?? {},
    };

    const { error } = await supabaseAdmin.from('audit_logs').insert(row);

    if (error) {
      if (/does not exist|schema cache/i.test(error.message)) {
        // Migration not run yet — expected, and must not spam the log.
        return;
      }
      console.error('[audit] failed to write log:', error.message);
    }
  } catch (err) {
    // Auditing must never break the operation it is recording.
    console.error('[audit] logger error:', err);
  }
}

/**
 * Convenience wrapper for update flows: reads the record before and after, and
 * records only what changed.
 *
 *   await auditUpdate({ table: 'studios', id, ... }, () => doTheUpdate())
 */
export async function auditUpdate<T>(
  options: {
    table: string;
    id: string;
    columns?: string;
    action: AuditAction;
    module: AuditModule;
    description: string;
    recordType?: string;
    recordName?: string | null;
    metadata?: Record<string, unknown> | null;
  },
  perform: () => Promise<T>
): Promise<T> {
  const columns = options.columns || '*';

  const snapshot = async (): Promise<Record<string, unknown> | null> => {
    if (!supabaseAdmin) return null;
    const { data } = await supabaseAdmin
      .from(options.table)
      .select(columns)
      .eq('id', options.id)
      .maybeSingle();
    // Supabase types a dynamic `select(string)` loosely; the runtime shape is a row.
    return (data as unknown as Record<string, unknown>) ?? null;
  };

  const before = await snapshot();
  // If this throws, no SUCCESS row is written — the caller's error propagates.
  const result = await perform();
  const after = await snapshot();

  await createAuditLog({
    action: options.action,
    module: options.module,
    description: options.description,
    recordType: options.recordType ?? options.table,
    recordId: options.id,
    recordName: options.recordName ?? null,
    oldValues: before,
    newValues: after,
    metadata: options.metadata,
  });

  return result;
}

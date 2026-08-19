import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mergeAdminRoleSelection } from '@/lib/user-role-column';
import { emitNotification } from '@/lib/notifications';
import { createAuditLog, requestContextFrom } from '@/lib/audit';
import crypto from 'node:crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, businessName, phone } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if already registered
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        auth_provider: 'credentials',
        email_verified: false,
        password_hash: passwordHash,
        role: mergeAdminRoleSelection(null, 'partner'),
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('Error creating partner user:', userError);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    await supabaseAdmin.from('profiles').insert({
      user_id: user.id,
      full_name: name,
      business_name: businessName || null,
      phone: phone || null,
    });

    const context = requestContextFrom(request);
    const actor = { id: user.id, email, name, role: 'partner' };

    await createAuditLog({
      action: 'USER_CREATED',
      module: 'Users',
      description: `Partner account created for ${email}`,
      actor, recordType: 'user', recordId: user.id, recordName: name,
      // The password hash is stripped by the redaction layer, but it is never
      // passed in to begin with.
      newValues: { email, auth_provider: 'credentials', role: 'partner' },
      request: context,
    });
    await createAuditLog({
      action: 'PARTNER_APPLIED',
      module: 'Partners',
      description: `${businessName || name} submitted a partner application`,
      actor, recordType: 'user', recordId: user.id, recordName: businessName || name,
      metadata: { business_name: businessName || null },
      request: context,
    });

    // Acknowledge the application to the partner and alert the review team.
    await emitNotification('PARTNER_APPLICATION_RECEIVED', {
      partnerId: user.id,
      metadata: { businessName: businessName || null, phone: phone || null },
    });
    await emitNotification('ADMIN_NEW_PARTNER_APPLICATION', {
      partnerId: user.id,
      idempotencyKey: user.id,
      metadata: {
        businessName: businessName || null,
        contactName: name,
        partnerEmail: email,
        phone: phone || null,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Partner signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

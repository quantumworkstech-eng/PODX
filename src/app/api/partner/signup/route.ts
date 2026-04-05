import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mergeAdminRoleSelection } from '@/lib/user-role-column';
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

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Partner signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getUserId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const userId = await getUserId(session.user.email);
  if (!userId) {
    // For Google OAuth users not yet in custom users table, return session data
    return NextResponse.json({
      name: session.user.name || '',
      email: session.user.email,
      phone: '',
      businessName: '',
      avatarUrl: session.user.image || '',
    });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, phone, business_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({
    name: profile?.full_name || session.user.name || '',
    email: session.user.email,
    phone: profile?.phone || '',
    businessName: profile?.business_name || '',
    avatarUrl: profile?.avatar_url || session.user.image || '',
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { name, phone, businessName } = await request.json();

  const userId = await getUserId(session.user.email);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('profiles')
      .update({ full_name: name, phone: phone || null, business_name: businessName || null })
      .eq('user_id', userId);
  } else {
    await supabaseAdmin
      .from('profiles')
      .insert({ user_id: userId, full_name: name, phone: phone || null, business_name: businessName || null });
  }

  return NextResponse.json({ success: true });
}

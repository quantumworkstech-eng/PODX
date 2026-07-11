import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const { action, adminNote } = await request.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Fetch the reschedule request
  const { data: req } = await supabaseAdmin
    .from('booking_reschedule_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (req.status !== 'pending') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Update the reschedule request
  await supabaseAdmin
    .from('booking_reschedule_requests')
    .update({
      status: newStatus,
      admin_note: adminNote || null,
      reviewed_by_email: email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (action === 'approve') {
    // Update the booking with new time
    const bookingUpdates: Record<string, unknown> = {
      status: 'rescheduled',
      updated_at: new Date().toISOString(),
    };
    if (req.new_date) bookingUpdates.booking_date = req.new_date;
    if (req.new_start_time) bookingUpdates.start_time = req.new_start_time;
    if (req.new_end_time) bookingUpdates.end_time = req.new_end_time;

    await supabaseAdmin
      .from('bookings')
      .update(bookingUpdates)
      .eq('id', req.booking_id);

    // Notify the user
    if (req.requested_by) {
      await supabaseAdmin.from('notifications').insert({
        user_id: req.requested_by,
        type: 'booking',
        title: 'Reschedule Approved',
        content: `Your reschedule request has been approved. Your booking has been updated to ${req.new_date} ${req.new_start_time}–${req.new_end_time}.`,
        action_url: '/dashboard',
      });
    }
  } else {
    // Notify rejection
    if (req.requested_by) {
      await supabaseAdmin.from('notifications').insert({
        user_id: req.requested_by,
        type: 'booking',
        title: 'Reschedule Rejected',
        content: `Your reschedule request has been rejected.${adminNote ? ` Reason: ${adminNote}` : ''} Your original booking remains unchanged.`,
        action_url: '/dashboard',
      });
    }
  }

  await logAdminAction(email, `reschedule_${action}`, 'booking', req.booking_id, { requestId: id, adminNote });

  return NextResponse.json({ success: true, status: newStatus });
}

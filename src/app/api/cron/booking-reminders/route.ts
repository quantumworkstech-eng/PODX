/**
 * 24-hour booking reminders (BOOKING_REMINDER_24H / PARTNER_BOOKING_REMINDER_24H).
 *
 * Schedule hourly:
 *   0 * * * *  curl -H "Authorization: Bearer $CRON_SECRET" \
 *                   "$APP_URL/api/cron/booking-reminders"
 *
 * The window is deliberately wider than the schedule interval so a skipped run
 * still catches its bookings. Duplicate mail is impossible because the reminder
 * events are keyed on the booking id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { emitNotification } from '@/lib/notifications';
import { isAuthorizedCron } from '@/lib/notifications/cron-auth';

export const dynamic = 'force-dynamic';

const WINDOW_START_HOURS = 23;
const WINDOW_END_HOURS = 25;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const now = Date.now();
  const from = new Date(now + WINDOW_START_HOURS * 3_600_000).toISOString();
  const to = new Date(now + WINDOW_END_HOURS * 3_600_000).toISOString();

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id')
    .in('status', ['confirmed', 'rescheduled'])
    .gte('start_time', from)
    .lt('start_time', to);

  if (error) {
    console.error('Reminder cron query failed:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  let clientReminders = 0;
  let partnerReminders = 0;

  for (const booking of bookings || []) {
    const [client] = await emitNotification('BOOKING_REMINDER_24H', {
      clientId: booking.user_id,
      bookingId: booking.id,
    });
    const [partner] = await emitNotification('PARTNER_BOOKING_REMINDER_24H', {
      bookingId: booking.id,
    });
    if (client?.status === 'sent' || client?.status === 'queued') clientReminders += 1;
    if (partner?.status === 'sent' || partner?.status === 'queued') partnerReminders += 1;
  }

  return NextResponse.json({
    window: { from, to },
    bookingsInWindow: bookings?.length ?? 0,
    clientReminders,
    partnerReminders,
  });
}

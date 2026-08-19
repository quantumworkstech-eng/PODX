/**
 * One renderer per event key. Renderers are pure: they receive a hydrated
 * RenderContext and return { subject, html }. No DB access, no side effects.
 */

import {
  formatSessionDateWithWeekdayIST,
  formatSessionTimeRangeIST,
} from '@/lib/bookingTime';
import type { EventKey } from './event-keys';
import type { BookingInfo, RenderContext, RenderedEmail } from './types';
import {
  button,
  detailPanel,
  escapeHtml,
  formatINR,
  noticeBox,
  paragraph,
  renderLayout,
  setLayoutSupportEmail,
  statBlock,
} from './layout';

// ── helpers ──────────────────────────────────────────────────────────────────

function firstName(name: string | null | undefined, fallback = 'there'): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return fallback;
  return trimmed.split(/\s+/)[0];
}

function sessionWhen(b: BookingInfo): string {
  return `${formatSessionDateWithWeekdayIST(b.startTime)}, ${formatSessionTimeRangeIST(b.startTime, b.endTime)} IST`;
}

/** The detail panel shared by every booking-centric email. */
function bookingPanel(b: BookingInfo, opts: { showPrice?: boolean } = {}): string {
  const addOns = b.addOns.length
    ? b.addOns.map((a) => (a.qty > 1 ? `${a.name} ×${a.qty}` : a.name)).join(', ')
    : null;

  return detailPanel([
    ['Booking ID', b.bookingNumber],
    ['Studio', b.studioName],
    ['Location', b.studioAddress || null],
    ['When', sessionWhen(b)],
    ['Duration', `${b.durationHours} hour${b.durationHours === 1 ? '' : 's'}`],
    ['Package', b.packageName || null],
    ['Add-ons', addOns],
    ['Guests', b.participants ? String(b.participants) : null],
    ...(opts.showPrice !== false
      ? ([['Total paid', formatINR(b.totalPrice)]] as [string, string][])
      : []),
  ]);
}

function missingBooking(eventKey: EventKey): RenderedEmail {
  // Defensive: the service refuses to emit booking events without a booking, so
  // this only guards against a future caller wiring one up incorrectly.
  return {
    subject: 'Yanisa Studios notification',
    html: renderLayout({
      preheader: 'Account update',
      heading: 'There is an update on your account',
      body: paragraph(
        `We tried to send you the details for <strong style="color:#fff;">${escapeHtml(eventKey)}</strong> but could not load them. Please open your dashboard for the latest status.`
      ),
    }),
  };
}

type Renderer = (ctx: RenderContext) => RenderedEmail;

function bookingRenderer(fn: (b: BookingInfo, ctx: RenderContext) => RenderedEmail): Renderer {
  return (ctx) => (ctx.booking ? fn(ctx.booking, ctx) : missingBooking(ctx.eventKey));
}

const str = (ctx: RenderContext, key: string): string | null => {
  const v = ctx.metadata[key];
  return v === null || v === undefined || v === '' ? null : String(v);
};

const num = (ctx: RenderContext, key: string): number | null => {
  const v = Number(ctx.metadata[key]);
  return Number.isFinite(v) ? v : null;
};

// ── client templates ─────────────────────────────────────────────────────────

const otpTemplate = (audienceLabel: string): Renderer => (ctx) => {
  const code = str(ctx, 'code') || '------';
  const minutes = num(ctx, 'expiresInMinutes') ?? 10;
  return {
    subject: `Your Yanisa Studios verification code: ${code}`,
    html: renderLayout({
      preheader: 'Your verification code',
      heading: `Verify your ${audienceLabel} email`,
      body:
        paragraph('Enter this code to finish signing in. It expires shortly, so use it right away.') +
        statBlock(`Expires in ${minutes} minutes`, code) +
        paragraph("If you didn't request this code, you can safely ignore this email — no changes have been made."),
    }),
  };
};

const TEMPLATES: Record<EventKey, Renderer> = {
  CLIENT_OTP_REQUESTED: otpTemplate('account'),
  PARTNER_OTP_REQUESTED: otpTemplate('partner account'),

  BOOKING_CONFIRMED: bookingRenderer((b, ctx) => ({
    subject: `Booking confirmed — ${b.studioName} on ${formatSessionDateWithWeekdayIST(b.startTime)}`,
    html: renderLayout({
      preheader: 'Your session is confirmed',
      heading: `You're booked, ${firstName(ctx.recipient.name)}`,
      body:
        paragraph(`Your session at <strong style="color:#fff;">${escapeHtml(b.studioName)}</strong> is confirmed. Here are the details — please arrive 10 minutes early.`) +
        bookingPanel(b) +
        button('View booking', `${ctx.appUrl}/dashboard`),
      footerNote: 'Need to change your plans? Cancellation and reschedule options are on your dashboard.',
    }),
  })),

  PAYMENT_SUCCESS: bookingRenderer((b, ctx) => ({
    subject: `Payment received — ${formatINR(ctx.payment?.amount ?? b.totalPrice)} for ${b.bookingNumber}`,
    html: renderLayout({
      preheader: 'Payment receipt',
      heading: 'Payment successful',
      body:
        paragraph('We have received your payment. This email is your receipt.') +
        statBlock('Amount paid', formatINR(ctx.payment?.amount ?? b.totalPrice)) +
        detailPanel([
          ['Booking ID', b.bookingNumber],
          ['Studio', b.studioName],
          ['Session', sessionWhen(b)],
          ['Payment ID', ctx.payment?.providerPaymentId || b.paymentId || null],
          ['Method', 'Razorpay'],
        ]) +
        button('View receipt', `${ctx.appUrl}/dashboard`),
    }),
  })),

  PAYMENT_FAILED: (ctx) => {
    const amount = ctx.payment?.amount;
    return {
      subject: 'Your Yanisa Studios payment could not be completed',
      html: renderLayout({
        preheader: 'Payment failed',
        heading: 'Payment failed',
        body:
          paragraph('Your payment did not go through, so no booking was created and the slot has not been held.') +
          noticeBox(
            `${escapeHtml(ctx.payment?.reason || 'The payment gateway declined the transaction.')} No amount has been charged. If your bank shows a debit, it will be auto-reversed within 5–7 working days.`,
            'warn'
          ) +
          detailPanel([
            ['Amount', amount ? formatINR(amount) : null],
            ['Payment ID', ctx.payment?.providerPaymentId || null],
            ['Studio', ctx.studio?.name || ctx.booking?.studioName || null],
          ]) +
          button('Try booking again', `${ctx.appUrl}/book`),
      }),
    };
  },

  BOOKING_CANCELLED_BY_CLIENT: bookingRenderer((b, ctx) => {
    const refund = num(ctx, 'refundAmount');
    return {
      subject: `Booking cancelled — ${b.bookingNumber}`,
      html: renderLayout({
        preheader: 'Your booking is cancelled',
        heading: 'Your booking is cancelled',
        body:
          paragraph(`We have cancelled your session at <strong style="color:#fff;">${escapeHtml(b.studioName)}</strong> as requested.`) +
          bookingPanel(b, { showPrice: false }) +
          (refund !== null && refund > 0
            ? paragraph(`A refund of <strong style="color:#fff;">${formatINR(refund)}</strong> has been initiated as per the studio's cancellation policy. You'll get a separate email once it is processed.`)
            : paragraph('Based on the studio cancellation policy, this cancellation is not eligible for a refund.')) +
          button('Book another session', `${ctx.appUrl}/book`),
      }),
    };
  }),

  BOOKING_CANCELLED_BY_PARTNER: bookingRenderer((b, ctx) => ({
    subject: `Your booking ${b.bookingNumber} has been cancelled`,
    html: renderLayout({
      preheader: 'Booking cancelled by the studio',
      heading: 'Your booking has been cancelled',
      body:
        paragraph(`We're sorry — your session at <strong style="color:#fff;">${escapeHtml(b.studioName)}</strong> has been cancelled by the studio.`) +
        bookingPanel(b, { showPrice: false }) +
        noticeBox(
          str(ctx, 'reason')
            ? `Reason: ${escapeHtml(str(ctx, 'reason')!)}`
            : 'You will receive a full refund of any amount paid. Refunds reach your original payment method in 5–7 working days.',
          'warn'
        ) +
        button('Find another slot', `${ctx.appUrl}/book`),
    }),
  })),

  BOOKING_RESCHEDULED: bookingRenderer((b, ctx) => ({
    subject: `Booking rescheduled — ${b.bookingNumber} is now ${formatSessionDateWithWeekdayIST(b.startTime)}`,
    html: renderLayout({
      preheader: 'New date and time',
      heading: 'Your booking has been rescheduled',
      body:
        paragraph(
          str(ctx, 'rescheduledBy') === 'client'
            ? 'Your reschedule has gone through. Here are your new session details.'
            : `Your session at <strong style="color:#fff;">${escapeHtml(b.studioName)}</strong> has been moved. Here are the new details.`
        ) +
        detailPanel([
          ['Booking ID', b.bookingNumber],
          ['Studio', b.studioName],
          ['Previous time', str(ctx, 'previousStartTime') ? sessionWhen({ ...b, startTime: str(ctx, 'previousStartTime')!, endTime: str(ctx, 'previousEndTime') || str(ctx, 'previousStartTime')! }) : null],
          ['New time', sessionWhen(b)],
          ['Location', b.studioAddress || null],
        ]) +
        button('View booking', `${ctx.appUrl}/dashboard`),
    }),
  })),

  BOOKING_REMINDER_24H: bookingRenderer((b, ctx) => ({
    subject: `Tomorrow: your session at ${b.studioName}`,
    html: renderLayout({
      preheader: 'Your session is in about 24 hours',
      heading: `See you tomorrow, ${firstName(ctx.recipient.name)}`,
      body:
        paragraph('Your session is coming up in about 24 hours. Please arrive 10 minutes early so setup starts on time.') +
        bookingPanel(b, { showPrice: false }) +
        button('View booking', `${ctx.appUrl}/dashboard`),
    }),
  })),

  REFUND_INITIATED: bookingRenderer((b, ctx) => ({
    subject: `Refund initiated for ${b.bookingNumber}`,
    html: renderLayout({
      preheader: 'Refund on its way',
      heading: 'Your refund has been initiated',
      body:
        paragraph('We have started your refund. It will land back on the payment method you originally used.') +
        statBlock('Refund amount', formatINR(num(ctx, 'refundAmount') ?? ctx.payment?.amount ?? 0)) +
        detailPanel([
          ['Booking ID', b.bookingNumber],
          ['Studio', b.studioName],
          ['Original amount', formatINR(b.totalPrice)],
          ['Expected in', '5–7 working days'],
        ]) +
        paragraph("We'll email you again the moment the bank confirms the refund."),
    }),
  })),

  REFUND_COMPLETED: (ctx) => ({
    subject: `Refund completed${ctx.booking ? ` for ${ctx.booking.bookingNumber}` : ''}`,
    html: renderLayout({
      preheader: 'Refund completed',
      heading: 'Your refund is complete',
      body:
        paragraph('Your refund has been processed successfully by the payment gateway.') +
        statBlock('Refunded', formatINR(num(ctx, 'refundAmount') ?? ctx.payment?.amount ?? 0)) +
        detailPanel([
          ['Booking ID', ctx.booking?.bookingNumber || null],
          ['Studio', ctx.booking?.studioName || null],
          ['Refund reference', str(ctx, 'refundReference') || null],
          ['Payment ID', ctx.payment?.providerPaymentId || null],
        ]) +
        paragraph('Depending on your bank, it can take a further 1–2 working days to appear on your statement.'),
    }),
  }),

  REFUND_FAILED: (ctx) => ({
    subject: 'Action needed: your refund could not be processed',
    html: renderLayout({
      preheader: 'Refund failed',
      heading: 'We could not process your refund',
      body:
        paragraph('Your refund was attempted but the payment gateway rejected it. Your money is safe — our support team is already on it.') +
        noticeBox(
          escapeHtml(str(ctx, 'reason') || 'The gateway did not accept the refund request.') +
            ' No action is needed from you right now; we will contact you if we need anything.',
          'warn'
        ) +
        detailPanel([
          ['Booking ID', ctx.booking?.bookingNumber || null],
          ['Amount', formatINR(num(ctx, 'refundAmount') ?? ctx.payment?.amount ?? 0)],
          ['Payment ID', ctx.payment?.providerPaymentId || null],
        ]),
    }),
  }),

  BOOKING_CRITICAL_UPDATE: bookingRenderer((b, ctx) => ({
    subject: `Important update to your booking ${b.bookingNumber}`,
    html: renderLayout({
      preheader: 'Important booking change',
      heading: 'Important change to your booking',
      body:
        paragraph('Something important about your upcoming session has changed. Please review the details below.') +
        noticeBox(escapeHtml(str(ctx, 'changeSummary') || 'Your booking details were updated.')) +
        bookingPanel(b, { showPrice: false }) +
        button('Review booking', `${ctx.appUrl}/dashboard`),
      footerNote: "If this change doesn't work for you, cancel from your dashboard and we'll refund you as per policy.",
    }),
  })),

  CLIENT_SECURITY_UPDATE: (ctx) => ({
    subject: 'Security update on your Yanisa Studios account',
    html: renderLayout({
      preheader: 'Account security notice',
      heading: 'Your account settings changed',
      body:
        paragraph(escapeHtml(str(ctx, 'changeSummary') || 'A security-related setting on your account was updated.')) +
        detailPanel([
          ['Account', ctx.recipient.email],
          ['Change', str(ctx, 'changeSummary')],
          ['When', str(ctx, 'occurredAt')],
        ]) +
        noticeBox("If you didn't make this change, contact support immediately and reset your password.", 'warn'),
    }),
  }),

  // ── partner templates ──────────────────────────────────────────────────────

  PARTNER_APPLICATION_RECEIVED: (ctx) => ({
    subject: 'We received your Yanisa Studios partner application',
    html: renderLayout({
      preheader: 'Application received',
      heading: `Thanks for applying, ${firstName(ctx.recipient.name)}`,
      body:
        paragraph('Your partner application is in. Our team reviews new studios within 2 business days and will email you the moment there is a decision.') +
        detailPanel([
          ['Business', str(ctx, 'businessName')],
          ['Contact email', ctx.recipient.email],
          ['Phone', str(ctx, 'phone')],
        ]) +
        button('Go to partner dashboard', `${ctx.appUrl}/partner`),
    }),
  }),

  PARTNER_APPROVED: (ctx) => ({
    subject: "You're approved — welcome to Yanisa Studios",
    html: renderLayout({
      preheader: 'Partner account approved',
      heading: 'Your partner account is approved',
      body:
        paragraph('You can now list studios, manage availability and take bookings. Your first studio listing is on us.') +
        button('Set up your studio', `${ctx.appUrl}/partner/studios`),
    }),
  }),

  PARTNER_REJECTED: (ctx) => ({
    subject: 'Update on your Yanisa Studios partner application',
    html: renderLayout({
      preheader: 'Application not approved',
      heading: 'We could not approve your application',
      body:
        paragraph('After reviewing your application, we are unable to onboard your studio at this time.') +
        noticeBox(escapeHtml(str(ctx, 'reason') || 'Our team can share specifics if you reply to this email.')) +
        paragraph('If you think this was a mistake or you can supply more information, reply to this email and we will take another look.'),
    }),
  }),

  PARTNER_SUSPENDED: (ctx) => ({
    subject: 'Your Yanisa Studios partner account has been suspended',
    html: renderLayout({
      preheader: 'Account suspended',
      heading: 'Your partner account is suspended',
      body:
        paragraph('Your partner account has been suspended, so your studios are no longer bookable and new bookings will not come through.') +
        noticeBox(escapeHtml(str(ctx, 'reason') || 'Contact support to understand the next steps and how to restore your account.'), 'warn') +
        paragraph('Confirmed bookings that already exist will be handled by our support team.'),
    }),
  }),

  PARTNER_REACTIVATED: (ctx) => ({
    subject: 'Your Yanisa Studios partner account is active again',
    html: renderLayout({
      preheader: 'Account reactivated',
      heading: 'Welcome back',
      body:
        paragraph('Your partner account has been reactivated. Your studios can take bookings again — please double-check your availability and pricing.') +
        button('Open partner dashboard', `${ctx.appUrl}/partner`),
    }),
  }),

  STUDIO_SUBMITTED: (ctx) => ({
    subject: `"${ctx.studio?.name || 'Your studio'}" is under review`,
    html: renderLayout({
      preheader: 'Studio submitted for review',
      heading: 'Your studio is under review',
      body:
        paragraph(`We received <strong style="color:#fff;">${escapeHtml(ctx.studio?.name || 'your studio')}</strong> and our team is reviewing it now. Reviews usually finish within 2 business days.`) +
        detailPanel([
          ['Studio', ctx.studio?.name || null],
          ['City', ctx.studio?.city || null],
          ['Address', ctx.studio?.address || null],
        ]) +
        button('View listing', `${ctx.appUrl}/partner/studios`),
    }),
  }),

  STUDIO_APPROVED: (ctx) => ({
    subject: `"${ctx.studio?.name || 'Your studio'}" is live`,
    html: renderLayout({
      preheader: 'Studio approved',
      heading: 'Your studio is approved and live',
      body:
        paragraph(`<strong style="color:#fff;">${escapeHtml(ctx.studio?.name || 'Your studio')}</strong> is now visible on the marketplace and accepting bookings.`) +
        paragraph('Keep your calendar and pricing current so you never miss a booking.') +
        button('Manage studio', `${ctx.appUrl}/partner/studios`),
    }),
  }),

  STUDIO_REJECTED: (ctx) => ({
    subject: `"${ctx.studio?.name || 'Your studio'}" was not approved`,
    html: renderLayout({
      preheader: 'Studio not approved',
      heading: 'Your studio was not approved',
      body:
        paragraph(`We reviewed <strong style="color:#fff;">${escapeHtml(ctx.studio?.name || 'your studio')}</strong> and cannot publish it in its current form.`) +
        noticeBox(escapeHtml(str(ctx, 'reason') || 'Reply to this email and our team will walk you through what to change.')) +
        button('Edit listing', `${ctx.appUrl}/partner/studios`),
    }),
  }),

  STUDIO_CHANGES_REQUIRED: (ctx) => ({
    subject: `Changes needed on "${ctx.studio?.name || 'your studio'}"`,
    html: renderLayout({
      preheader: 'Changes required before approval',
      heading: 'A few changes are needed',
      body:
        paragraph(`Your listing is nearly there. Please make the changes below and resubmit <strong style="color:#fff;">${escapeHtml(ctx.studio?.name || 'your studio')}</strong> for review.`) +
        noticeBox(escapeHtml(str(ctx, 'reason') || 'See the notes on your studio page in the partner dashboard.')) +
        button('Update listing', `${ctx.appUrl}/partner/studios`),
    }),
  }),

  STUDIO_DEACTIVATED: (ctx) => ({
    subject: `"${ctx.studio?.name || 'Your studio'}" is no longer bookable`,
    html: renderLayout({
      preheader: 'Studio deactivated',
      heading: 'Your studio has been deactivated',
      body:
        paragraph(`<strong style="color:#fff;">${escapeHtml(ctx.studio?.name || 'Your studio')}</strong> has been taken off the marketplace and cannot receive new bookings.`) +
        noticeBox(escapeHtml(str(ctx, 'reason') || 'Contact support to understand why and how to get back online.'), 'warn') +
        paragraph('Any confirmed bookings still on your calendar need to be honoured or cancelled — please check your dashboard.'),
    }),
  }),

  NEW_BOOKING_RECEIVED: bookingRenderer((b, ctx) => ({
    subject: `New booking — ${b.studioName}, ${formatSessionDateWithWeekdayIST(b.startTime)}`,
    html: renderLayout({
      preheader: 'You have a new confirmed booking',
      heading: 'New booking received',
      body:
        paragraph('A client has paid and confirmed a session at your studio. Please make sure the space is ready.') +
        detailPanel([
          ['Booking ID', b.bookingNumber],
          ['Studio', b.studioName],
          ['When', sessionWhen(b)],
          ['Duration', `${b.durationHours} hour${b.durationHours === 1 ? '' : 's'}`],
          ['Headcount', b.participants ? String(b.participants) : null],
          ['Package', b.packageName || null],
          ['Booking value', formatINR(b.totalPrice)],
        ]) +
        button('Open partner dashboard', `${ctx.appUrl}/partner/bookings`),
      footerNote: 'Client contact details stay private; reach the client through the platform if you need to.',
    }),
  })),

  PARTNER_BOOKING_CANCELLED_BY_CLIENT: bookingRenderer((b, ctx) => ({
    subject: `Booking cancelled — ${b.bookingNumber} on ${formatSessionDateWithWeekdayIST(b.startTime)}`,
    html: renderLayout({
      preheader: 'A client cancelled a booking',
      heading: 'A client cancelled their booking',
      body:
        paragraph('The slot below has been released and is bookable again.') +
        detailPanel([
          ['Booking ID', b.bookingNumber],
          ['Studio', b.studioName],
          ['Was scheduled', sessionWhen(b)],
          ['Booking value', formatINR(b.totalPrice)],
        ]) +
        paragraph('If a refund applies, your settlement for this booking will be adjusted and we will confirm the amount separately.') +
        button('View calendar', `${ctx.appUrl}/partner/bookings`),
    }),
  })),

  PARTNER_BOOKING_RESCHEDULED: bookingRenderer((b, ctx) => ({
    subject: `Booking rescheduled — ${b.bookingNumber}`,
    html: renderLayout({
      preheader: 'A booking moved to a new time',
      heading: 'A booking has been rescheduled',
      body:
        paragraph('Please update your calendar — the session below has moved.') +
        detailPanel([
          ['Booking ID', b.bookingNumber],
          ['Studio', b.studioName],
          ['Previous time', str(ctx, 'previousStartTime') ? sessionWhen({ ...b, startTime: str(ctx, 'previousStartTime')!, endTime: str(ctx, 'previousEndTime') || str(ctx, 'previousStartTime')! }) : null],
          ['New time', sessionWhen(b)],
          ['Rescheduled by', str(ctx, 'rescheduledBy')],
        ]) +
        button('View calendar', `${ctx.appUrl}/partner/bookings`),
    }),
  })),

  PARTNER_BOOKING_REMINDER_24H: bookingRenderer((b, ctx) => ({
    subject: `Tomorrow: booking at ${b.studioName}`,
    html: renderLayout({
      preheader: 'A session starts in about 24 hours',
      heading: 'You have a session tomorrow',
      body:
        paragraph('A confirmed booking at your studio starts in about 24 hours.') +
        detailPanel([
          ['Booking ID', b.bookingNumber],
          ['Studio', b.studioName],
          ['When', sessionWhen(b)],
          ['Duration', `${b.durationHours} hour${b.durationHours === 1 ? '' : 's'}`],
          ['Headcount', b.participants ? String(b.participants) : null],
          ['Package', b.packageName || null],
        ]) +
        button('View calendar', `${ctx.appUrl}/partner/bookings`),
    }),
  })),

  PAYOUT_COMPLETED: (ctx) => ({
    subject: `Payout sent — ${formatINR(ctx.payout?.amount ?? 0)}`,
    html: renderLayout({
      preheader: 'Your payout is on its way',
      heading: 'Your payout has been sent',
      body:
        paragraph('We have settled your earnings. Funds usually reach your account within 1–2 working days.') +
        statBlock('Payout amount', formatINR(ctx.payout?.amount ?? 0)) +
        detailPanel([
          ['Reference', ctx.payout?.referenceNumber || null],
          ['Method', ctx.payout?.method || null],
          ['Period', ctx.payout?.periodStart && ctx.payout?.periodEnd ? `${ctx.payout.periodStart} → ${ctx.payout.periodEnd}` : null],
        ]) +
        button('View earnings', `${ctx.appUrl}/partner/analytics`),
    }),
  }),

  PAYOUT_FAILED: (ctx) => ({
    subject: 'Action needed: your payout failed',
    html: renderLayout({
      preheader: 'Payout failed',
      heading: 'Your payout could not be completed',
      body:
        paragraph('We tried to settle your earnings but the transfer did not go through. Your balance is unchanged and will be retried once the issue is fixed.') +
        noticeBox(escapeHtml(ctx.payout?.failureReason || 'The settlement provider rejected the transfer.') + ' Please check that your bank or UPI details are correct.', 'warn') +
        detailPanel([
          ['Amount', formatINR(ctx.payout?.amount ?? 0)],
          ['Method', ctx.payout?.method || null],
          ['Reference', ctx.payout?.referenceNumber || null],
        ]) +
        button('Update payout details', `${ctx.appUrl}/partner/profile`),
    }),
  }),

  PARTNER_REFUND_ADJUSTMENT: (ctx) => ({
    subject: 'Your settlement has been adjusted for a client refund',
    html: renderLayout({
      preheader: 'Settlement adjustment',
      heading: 'A refund changed your settlement',
      body:
        paragraph('A client refund has been processed, so your receivable for the booking below has been adjusted.') +
        detailPanel([
          ['Booking ID', ctx.booking?.bookingNumber || null],
          ['Studio', ctx.booking?.studioName || ctx.studio?.name || null],
          ['Refunded to client', formatINR(num(ctx, 'refundAmount') ?? 0)],
          ['Reason', str(ctx, 'reason')],
        ]) +
        button('View earnings', `${ctx.appUrl}/partner/analytics`),
    }),
  }),

  // ── admin templates ────────────────────────────────────────────────────────

  ADMIN_NEW_PARTNER_APPLICATION: (ctx) => ({
    subject: `New partner application — ${str(ctx, 'businessName') || str(ctx, 'partnerEmail') || 'unnamed'}`,
    html: renderLayout({
      preheader: 'A partner application needs review',
      heading: 'New partner application',
      body:
        paragraph('A new partner has registered and is awaiting review.') +
        detailPanel([
          ['Business', str(ctx, 'businessName')],
          ['Contact', str(ctx, 'contactName')],
          ['Email', str(ctx, 'partnerEmail')],
          ['Phone', str(ctx, 'phone')],
        ]) +
        button('Review in admin', `${ctx.appUrl}/admin/partners`),
    }),
  }),

  ADMIN_STUDIO_REVIEW_REQUIRED: (ctx) => ({
    subject: `Studio awaiting approval — ${ctx.studio?.name || 'new listing'}`,
    html: renderLayout({
      preheader: 'A studio needs review',
      heading: 'New studio awaiting approval',
      body:
        paragraph('A partner submitted a studio for review.') +
        detailPanel([
          ['Studio', ctx.studio?.name || null],
          ['City', ctx.studio?.city || null],
          ['Address', ctx.studio?.address || null],
          ['Partner', str(ctx, 'partnerEmail')],
        ]) +
        button('Review studio', `${ctx.appUrl}/admin/studios`),
    }),
  }),

  ADMIN_PAYOUT_FAILED: (ctx) => ({
    subject: `Payout failed — ${formatINR(ctx.payout?.amount ?? 0)} to ${str(ctx, 'partnerEmail') || 'partner'}`,
    html: renderLayout({
      preheader: 'A partner payout failed',
      heading: 'Partner payout failed',
      body:
        noticeBox(escapeHtml(ctx.payout?.failureReason || 'No failure reason was supplied by the settlement provider.'), 'warn') +
        detailPanel([
          ['Partner', str(ctx, 'partnerEmail')],
          ['Amount', formatINR(ctx.payout?.amount ?? 0)],
          ['Payout ID', ctx.payout?.id || null],
          ['Reference', ctx.payout?.referenceNumber || null],
        ]) +
        button('Open payouts', `${ctx.appUrl}/admin/payments`),
    }),
  }),

  ADMIN_REFUND_FAILED: (ctx) => ({
    subject: `Refund failed — ${ctx.booking?.bookingNumber || 'booking'} needs manual action`,
    html: renderLayout({
      preheader: 'A refund needs manual intervention',
      heading: 'Refund failed',
      body:
        noticeBox(escapeHtml(str(ctx, 'reason') || 'The payment gateway rejected the refund.'), 'warn') +
        detailPanel([
          ['Booking ID', ctx.booking?.bookingNumber || null],
          ['Client', str(ctx, 'clientEmail')],
          ['Amount', formatINR(num(ctx, 'refundAmount') ?? ctx.payment?.amount ?? 0)],
          ['Payment ID', ctx.payment?.providerPaymentId || null],
        ]) +
        button('Open bookings', `${ctx.appUrl}/admin/bookings`),
    }),
  }),
};

export function renderEmail(ctx: RenderContext): RenderedEmail {
  setLayoutSupportEmail(ctx.supportEmail);
  return TEMPLATES[ctx.eventKey](ctx);
}

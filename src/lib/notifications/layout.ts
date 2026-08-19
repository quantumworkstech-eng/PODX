/**
 * Shared HTML chrome for every transactional email.
 *
 * Deliberately table-free, inline-styled and narrow: matches the premium dark
 * UI of the app (bg #09090b, accent #D9FC67) while staying readable in the
 * clients that strip backgrounds.
 */

const ACCENT = '#D9FC67';
const BG = '#09090b';
const PANEL = '#141414';
const BORDER = 'rgba(255,255,255,0.1)';
const MUTED = 'rgba(255,255,255,0.6)';
const FAINT = 'rgba(255,255,255,0.4)';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** ₹1,23,456 — Indian digit grouping, no decimals (all prices are whole rupees). */
export function formatINR(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function button(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${ACCENT};color:#09090b;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:10px;">${escapeHtml(label)}</a>`;
}

/** Key/value rows rendered as a bordered panel. Falsy values are dropped. */
export function detailPanel(rows: [string, string | null | undefined][]): string {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '');
  if (visible.length === 0) return '';

  const body = visible
    .map(
      ([label, value]) =>
        `<tr>
           <td style="padding:9px 0;color:${MUTED};font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
           <td style="padding:9px 0 9px 20px;color:#ffffff;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
         </tr>`
    )
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PANEL};border:1px solid ${BORDER};border-radius:12px;padding:8px 20px;margin:0 0 24px;">${body}</table>`;
}

/** A single emphasised figure (refund amount, payout total, OTP code). */
export function statBlock(label: string, value: string, tone: 'accent' | 'plain' = 'accent'): string {
  const color = tone === 'accent' ? ACCENT : '#ffffff';
  return `<div style="background:${PANEL};border:1px solid ${BORDER};border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
    <p style="margin:0 0 8px;color:${MUTED};font-size:13px;">${escapeHtml(label)}</p>
    <div style="font-size:32px;font-weight:700;color:${color};">${escapeHtml(value)}</div>
  </div>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:22px;">${text}</p>`;
}

/** Callout used for failures and things the reader must act on. */
export function noticeBox(text: string, tone: 'warn' | 'info' = 'info'): string {
  const border = tone === 'warn' ? 'rgba(248,113,113,0.35)' : BORDER;
  const bg = tone === 'warn' ? 'rgba(248,113,113,0.08)' : PANEL;
  const color = tone === 'warn' ? '#fca5a5' : MUTED;
  return `<div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:16px 18px;margin:0 0 24px;color:${color};font-size:13px;line-height:20px;">${text}</div>`;
}

export type LayoutOptions = {
  /** Short line under the wordmark, e.g. "Booking confirmed". */
  preheader: string;
  heading: string;
  body: string;
  /** Optional footer note above the legal line. */
  footerNote?: string;
};

export function renderLayout({ preheader, heading, body, footerNote }: LayoutOptions): string {
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@yanisastudios.com';

  return `<div style="background:${BG};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:${BG};max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <div style="max-width:560px;margin:0 auto;background:${BG};border:1px solid ${BORDER};border-radius:16px;padding:36px 32px;">
    <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">
      <span style="color:#ffffff;">Yanisa </span><span style="color:${ACCENT};">Studios</span>
    </h1>
    <p style="color:${FAINT};font-size:13px;margin:0 0 28px;">${escapeHtml(preheader)}</p>

    <h2 style="color:#ffffff;font-size:19px;font-weight:700;margin:0 0 14px;line-height:26px;">${escapeHtml(heading)}</h2>

    ${body}

    ${footerNote ? `<p style="color:${FAINT};font-size:12px;line-height:18px;margin:24px 0 0;">${footerNote}</p>` : ''}

    <hr style="border:none;border-top:1px solid ${BORDER};margin:28px 0 16px;" />
    <p style="color:${FAINT};font-size:11px;line-height:17px;margin:0;">
      Need help? Reach us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:${ACCENT};text-decoration:none;">${escapeHtml(supportEmail)}</a>.<br />
      This is a transactional message about your Yanisa Studios account.
    </p>
  </div>
</div>`;
}

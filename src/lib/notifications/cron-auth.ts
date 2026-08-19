import type { NextRequest } from 'next/server';

/**
 * Shared guard for the notification cron endpoints.
 *
 * Accepts `Authorization: Bearer $CRON_SECRET` (also matching Vercel Cron's
 * header) or `?secret=`. When CRON_SECRET is unset the route is refused rather
 * than left open.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization');
  if (header === `Bearer ${secret}`) return true;

  return new URL(request.url).searchParams.get('secret') === secret;
}

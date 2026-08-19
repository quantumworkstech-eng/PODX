/**
 * Client details for an audit entry, derived from request headers.
 *
 * Used for the IP address, browser and device columns. Parsing is deliberately
 * lightweight — enough to answer "which browser, roughly which device" without
 * pulling in a user-agent database.
 */

import { headers } from 'next/headers';

export type RequestContext = {
  ip: string | null;
  browser: string | null;
  device: string | null;
  userAgent: string | null;
};

export function parseUserAgent(ua: string | null): { browser: string | null; device: string | null } {
  if (!ua) return { browser: null, device: null };

  // Order matters: Edge and Opera also identify as Chrome, Chrome as Safari.
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : /curl\//i.test(ua) ? 'curl'
    : /PostmanRuntime/i.test(ua) ? 'Postman'
    : 'Unknown';

  const os =
    /Windows NT/.test(ua) ? 'Windows'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
    : /Mac OS X/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : null;

  const form = /iPad|Tablet/.test(ua) ? 'Tablet' : /Mobi|iPhone|Android/.test(ua) ? 'Mobile' : 'Desktop';

  return { browser, device: os ? `${form} · ${os}` : form };
}

/** First entry of X-Forwarded-For is the original client behind a proxy. */
function clientIp(get: (name: string) => string | null): string | null {
  const forwarded = get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return get('x-real-ip') || get('cf-connecting-ip') || null;
}

/** Reads from the ambient request. Returns empty values outside a request. */
export async function getRequestContext(): Promise<RequestContext> {
  try {
    const h = await headers();
    const get = (name: string) => h.get(name);
    const userAgent = get('user-agent');
    const { browser, device } = parseUserAgent(userAgent);
    return { ip: clientIp(get), browser, device, userAgent };
  } catch {
    // Called outside a request scope (cron, script) — no context to report.
    return { ip: null, browser: null, device: null, userAgent: null };
  }
}

/** For route handlers that already hold the Request. */
export function requestContextFrom(request: Request): RequestContext {
  const get = (name: string) => request.headers.get(name);
  const userAgent = get('user-agent');
  const { browser, device } = parseUserAgent(userAgent);
  return { ip: clientIp(get), browser, device, userAgent };
}

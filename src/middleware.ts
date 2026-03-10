import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'admin-fallback-secret');

// Known PodX host patterns (add your production domain here)
const MAIN_HOSTS = ['localhost', 'podx.com', 'www.podx.com'];

function getSubdomain(host: string): string | null {
  // Strip port for localhost dev
  const clean = host.split(':')[0];
  if (MAIN_HOSTS.includes(clean)) return null;

  // subdomain.podx.com pattern
  if (clean.endsWith('.podx.com')) {
    const sub = clean.replace('.podx.com', '');
    if (sub && sub !== 'www') return sub;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Pass pathname to server layouts via header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // ── White-label subdomain routing ──────────────────────────────
  // Detect subdomain (e.g. studiox.podx.com) and rewrite to /p/[slug]
  const subdomain = getSubdomain(host);
  if (subdomain && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon')) {
    const url = request.nextUrl.clone();
    // If not already a /p/ path, rewrite to it
    if (!pathname.startsWith('/p/')) {
      url.pathname = `/p/${subdomain}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }

  // ── Custom domain routing ──────────────────────────────────────
  // For non-podx.com hosts that aren't localhost, treat as custom domain
  const cleanHost = host.split(':')[0];
  const isKnownHost = MAIN_HOSTS.includes(cleanHost) || cleanHost.endsWith('.podx.com');
  const isLocalhost = cleanHost === 'localhost' || cleanHost === '127.0.0.1';

  if (!isKnownHost && !isLocalhost && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    // Resolve custom domain → partner slug via internal API call is not possible in middleware
    // Instead, rewrite to a special route that handles custom domain resolution
    if (!pathname.startsWith('/p/') && !pathname.startsWith('/domain-proxy')) {
      const url = request.nextUrl.clone();
      url.pathname = `/domain-proxy${pathname === '/' ? '' : pathname}`;
      url.searchParams.set('_domain', cleanHost);
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }

  // ── Admin routes — verify admin_session cookie ─────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('admin_session')?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(adminToken, secret);
      if (payload.role !== 'admin') throw new Error('Not admin');
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Also match all paths for subdomain/domain detection
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};

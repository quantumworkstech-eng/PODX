import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes — require admin role
  if (pathname.startsWith('/admin')) {
    const session = await auth();

    if (!session?.user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin role via API (lightweight check)
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // We'll do the role check in the layout for full DB access;
    // here we just verify session exists. Actual role guard is in layout.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

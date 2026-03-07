import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to server layouts via header
  const response = NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(request.headers), 'x-pathname': pathname }) },
  });

  // Admin routes — verify session exists (skip login page to avoid redirect loop)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Create a minimal NextAuth instance from the edge-safe config.
 * Using auth(handler) as a middleware wrapper is the Auth.js v5 recommended
 * pattern for Edge Runtime — it correctly decrypts JWE session cookies without
 * any Node.js-only crypto APIs.
 */
const { auth } = NextAuth(authConfig);

// Used only for the admin_session cookie (a plain JWS, not a NextAuth JWE)
const adminSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "admin-fallback-secret"
);

// Known PodX host patterns (add your production domain here)
const MAIN_HOSTS = ["localhost", "podx.com", "www.podx.com"];

function getSubdomain(host: string): string | null {
  const clean = host.split(":")[0];
  if (MAIN_HOSTS.includes(clean)) return null;
  if (clean.endsWith(".podx.com")) {
    const sub = clean.replace(".podx.com", "");
    if (sub && sub !== "www") return sub;
  }
  return null;
}

// Public partner routes that don't require an active session
const PARTNER_PUBLIC = [
  "/partner/login",
  "/partner/signup",
  "/partner/google-onboarding",
];

/**
 * Main middleware logic. Receives the enriched request (with request.auth
 * populated by the NextAuth wrapper) so we can check session status without
 * any additional crypto work.
 */
async function middlewareLogic(request: NextRequest & { auth: unknown }) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Propagate the current pathname to server layouts via a custom header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // ── White-label subdomain routing ──────────────────────────────────────
  const subdomain = getSubdomain(host);
  if (
    subdomain &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon")
  ) {
    if (!pathname.startsWith("/p/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${subdomain}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }

  // ── Custom domain routing ───────────────────────────────────────────────
  const cleanHost = host.split(":")[0];
  const isKnownHost =
    MAIN_HOSTS.includes(cleanHost) ||
    cleanHost.endsWith(".podx.com") ||
    cleanHost.endsWith(".vercel.app");
  const isLocalhost = cleanHost === "localhost" || cleanHost === "127.0.0.1";

  if (
    !isKnownHost &&
    !isLocalhost &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next")
  ) {
    if (!pathname.startsWith("/p/") && !pathname.startsWith("/domain-proxy")) {
      const url = request.nextUrl.clone();
      url.pathname = `/domain-proxy${pathname === "/" ? "" : pathname}`;
      url.searchParams.set("_domain", cleanHost);
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }

  // Helper — checks if a comma-separated role string includes a target role
  function hasRole(userRole: string | undefined | null, target: string): boolean {
    if (!userRole) return false;
    return userRole.split(",").map((r) => r.trim()).includes(target);
  }

  const sessionUser = (request.auth as any)?.user;

  // ── Client dashboard — require "user" role ──────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!request.auth) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (hasRole(sessionUser?.role, "user")) {
      // ok
    } else if (hasRole(sessionUser?.role, "partner")) {
      // Partner-only sessions (e.g. legacy DB) belong on the partner app, not client signup.
      return NextResponse.redirect(new URL("/partner/dashboard", request.url));
    } else {
      const signupUrl = new URL("/auth/signup", request.url);
      signupUrl.searchParams.set("wrongRole", "1");
      return NextResponse.redirect(signupUrl);
    }
  }

  // ── Admin routes — verify admin_session cookie (plain JWS) ─────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("admin_session")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(adminToken, adminSecret);
      if (payload.role !== "admin") throw new Error("Not admin");
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // ── Partner routes — require authenticated NextAuth session + partner role ─
  // Note: /partners (plural) is the public marketing landing page — never protected.
  if (
    pathname.startsWith("/partner/") &&
    !PARTNER_PUBLIC.some((p) => pathname.startsWith(p))
  ) {
    if (!request.auth) {
      const loginUrl = new URL("/partner/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!hasRole(sessionUser?.role, "partner")) {
      const signupUrl = new URL("/partner/signup", request.url);
      signupUrl.searchParams.set("wrongRole", "1");
      return NextResponse.redirect(signupUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Export the middleware wrapped by auth so every request is checked for a
// valid NextAuth session before our custom logic runs.
export default auth(middlewareLogic as Parameters<typeof auth>[0]);

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};

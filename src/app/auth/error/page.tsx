"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Shared OAuth error redirect page.
 *
 * NextAuth redirects here when any OAuth provider fails (via pages.error).
 * We read the error code and callbackUrl from the query string and forward
 * the user to the correct login page (partner vs customer) so they see a
 * meaningful error message.
 */
function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error") ?? "Default";
    const callbackUrl = searchParams.get("callbackUrl") ?? "";

    // Determine which login page to redirect to based on context
    const isPartnerFlow = callbackUrl.startsWith("/partner");
    const target = isPartnerFlow ? "/partner/login" : "/auth/login";

    const url = new URL(target, window.location.origin);
    url.searchParams.set("error", error);
    if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);

    router.replace(url.pathname + url.search);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}

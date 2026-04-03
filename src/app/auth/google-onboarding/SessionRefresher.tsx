"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Forces a NextAuth session refresh (client → /api/auth/session → Node.js JWT
 * callback which always re-fetches the role from DB).  Once the fresh session
 * is available, navigates to the target path.
 */
export function SessionRefresher({ next }: { next: string }) {
  const { update } = useSession();
  const router = useRouter();

  useEffect(() => {
    update().then(() => {
      router.push(next);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Setting up your account…</p>
      </div>
    </div>
  );
}

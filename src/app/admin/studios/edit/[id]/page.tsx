"use client";

import { useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

function RedirectBody() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  useEffect(() => {
    if (id) {
      router.replace(`/admin/studios?edit=${encodeURIComponent(id)}`);
    } else {
      router.replace("/admin/studios");
    }
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-white/60 text-sm">
      Opening studio editor…
    </div>
  );
}

export default function AdminStudioEditByIdPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh] text-white/60 text-sm">
          Loading…
        </div>
      }
    >
      <RedirectBody />
    </Suspense>
  );
}

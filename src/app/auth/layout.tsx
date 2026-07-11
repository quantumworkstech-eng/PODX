"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/AuthContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin mx-auto" />}>
            {children}
          </Suspense>
        </div>
      </div>
    </AuthProvider>
  );
}

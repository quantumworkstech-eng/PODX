"use client";

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
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}

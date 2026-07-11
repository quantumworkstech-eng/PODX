"use client";

import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

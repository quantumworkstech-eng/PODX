"use client";

export function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-[#141414] border border-white/5 rounded-2xl p-6 text-center">
        <h1 className="text-white text-xl font-semibold">We’ll be back soon</h1>
        <p className="text-white/50 text-sm mt-2">
          PodX is under maintenance right now. Please try again in a few minutes.
        </p>
        <p className="text-white/30 text-xs mt-4">
          If you are an admin, you can still access <span className="font-mono text-white/50">/admin</span>.
        </p>
      </div>
    </div>
  );
}


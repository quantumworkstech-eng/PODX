"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

type Step = "email" | "set_password" | "enter_password";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const hasChecked = useRef(false);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in as admin, go to dashboard
  useEffect(() => {
    if (status === "authenticated" && !hasChecked.current) {
      hasChecked.current = true;
      const role = (session?.user as any)?.role;
      if (role === "admin") router.push("/admin");
    }
  }, [status, session, router]);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "check" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep(data.hasPassword ? "enter_password" : "set_password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "set_password" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      // Password set — now sign in
      await doSignIn();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await doSignIn();
    setLoading(false);
  };

  const doSignIn = async () => {
    const result = await signIn("admin-password", {
      email,
      password,
      redirect: false,
    });
    if (result?.error || !result?.ok) {
      setError("Incorrect password. Please try again.");
      return;
    }
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl font-bold tracking-tight text-white">
            p<span className="text-[#D9FC67]">o</span>dX
          </span>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm font-medium">Admin Panel</p>
          </div>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-2xl p-8">
          {step === "email" && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Admin Sign In</h1>
              <p className="text-white/40 text-sm mb-6">Enter your admin email to continue</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                      autoFocus
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Continue</>
                  )}
                </button>
              </form>
            </>
          )}

          {step === "set_password" && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Create Password</h1>
              <p className="text-white/40 text-sm mb-1">First time login for <span className="text-white/70">{email}</span></p>
              <p className="text-white/30 text-xs mb-6">Set a password to secure your admin account.</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      autoFocus
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Shield className="w-4 h-4" /> Set Password & Sign In</>
                  )}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setPassword(""); setConfirmPassword(""); }}
                className="w-full mt-3 text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                ← Back
              </button>
            </>
          )}

          {step === "enter_password" && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
              <p className="text-white/40 text-sm mb-6">Enter your password for <span className="text-white/70">{email}</span></p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      autoFocus
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Shield className="w-4 h-4" /> Sign In</>
                  )}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setPassword(""); }}
                className="w-full mt-3 text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                ← Back
              </button>
            </>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Not an admin?{" "}
          <a href="/" className="text-white/40 hover:text-white transition-colors">
            Go to homepage
          </a>
        </p>
      </div>
    </div>
  );
}

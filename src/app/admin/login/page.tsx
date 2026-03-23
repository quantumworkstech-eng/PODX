"use client";

import { useState } from "react";
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { adminCheckEmail, adminSetPassword, adminSignIn } from "./actions";

type Step = "email" | "set_password" | "enter_password";

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await adminCheckEmail(email);
      if ("error" in result) { setError(result.error); return; }
      setStep(result.hasPassword ? "enter_password" : "set_password");
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
      const setResult = await adminSetPassword(email, password);
      if ("error" in setResult) { setError(setResult.error); return; }
      // Password saved — now sign in (server action sets cookie + redirects)
      const signInResult = await adminSignIn(email, password, true);
      if (signInResult && "error" in signInResult) setError(signInResult.error);
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
    try {
      const result = await adminSignIn(email, password, true);
      // If result returned (not redirected), it's an error
      if (result && "error" in result) setError(result.error);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === "email" && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Admin Sign In</h1>
              <p className="text-white/40 text-sm mb-6">Enter your admin email to continue</p>
              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com" required autoFocus
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><ArrowRight className="w-4 h-4" /> Continue</>}
                </button>
              </form>
            </>
          )}

          {step === "set_password" && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Create Password</h1>
              <p className="text-white/40 text-sm mb-6">First time login for <span className="text-white/70">{email}</span></p>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required autoFocus
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"} value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Shield className="w-4 h-4" /> Set Password & Sign In</>}
                </button>
              </form>
              <button type="button" onClick={() => { setStep("email"); setError(""); setPassword(""); setConfirmPassword(""); }}
                className="w-full mt-3 text-sm text-white/30 hover:text-white/50 transition-colors">
                ← Back
              </button>
            </>
          )}

          {step === "enter_password" && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
              <p className="text-white/40 text-sm mb-6">Sign in as <span className="text-white/70">{email}</span></p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required autoFocus
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Shield className="w-4 h-4" /> Sign In</>}
                </button>
              </form>
              <button type="button" onClick={() => { setStep("email"); setError(""); setPassword(""); }}
                className="w-full mt-3 text-sm text-white/30 hover:text-white/50 transition-colors">
                ← Back
              </button>
            </>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Not an admin?{" "}
          <a href="/" className="text-white/40 hover:text-white transition-colors">Go to homepage</a>
        </p>
      </div>
    </div>
  );
}

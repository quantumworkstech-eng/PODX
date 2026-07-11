"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { X, Mail, Loader2, ArrowRight } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onSaveBooking?: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, onSaveBooking }: AuthModalProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || session) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send code. Please try again.");
        return;
      }
      setOtpSent(true);
    } catch {
      setError("Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error || "Invalid code. Please try again.");
        return;
      }

      // Assign "user" role via complete-profile (appends, never overwrites other roles)
      await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: verifyData.token, role: "user" }),
      });

      const result = await signIn("credentials", {
        email,
        token: verifyData.token,
        rememberMe: "true",
        redirect: false,
      });

      if (result?.error) {
        setError("Sign in failed. Please try again.");
        return;
      }

      onAuthSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    if (onSaveBooking) {
      onSaveBooking();
    }
    // Route through client google-onboarding to ensure "user" role is assigned,
    // then return to the booking page.
    await signIn("google", { callbackUrl: "/auth/google-onboarding?next=/book" });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Sign in to continue</h2>
          <p className="text-white/60 text-sm">Log in or create a client account to complete your booking</p>
        </div>

        {/* Google sign-in */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full mb-5 py-6 text-base font-medium bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#0a0a0a] text-white/40">or continue with email</span>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Send verification code <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-white/60 text-sm text-center">
              We sent a 6-digit code to <span className="text-[#D9FC67] font-medium">{email}</span>
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              required
              autoFocus
            />
            <Button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
            </Button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
              className="w-full text-white/60 text-sm hover:text-white text-center"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="text-center text-white/40 text-xs mt-6">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-white/60">Terms</a> and{" "}
          <a href="/privacy" className="underline hover:text-white/60">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

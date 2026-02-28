"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { X, Mail, Lock, User, Loader2, Phone, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onSaveBooking?: () => void;
}

const countries = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+88", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
];

export function AuthModal({ isOpen, onClose, onAuthSuccess, onSaveBooking }: AuthModalProps) {
  const { data: session } = useSession();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  if (!isOpen || session) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const identifier = mode === "signup" ? email : phone ? `${countryCode}${phone}` : email;
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onAuthSuccess();
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    if (onSaveBooking) {
      onSaveBooking();
    }
    await signIn("google", { callbackUrl: "/book" });
  };

  const selectedCountry = countries.find(c => c.code === countryCode);

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
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-white/60">
            {mode === "signup" 
              ? "Sign up to complete your booking" 
              : "Sign in to continue with your booking"}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={email.split("@")[0]}
                    onChange={(e) => setEmail(e.target.value + (email.includes("@") ? "@" + email.split("@")[1] : ""))}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {mode === "login" ? (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center gap-2 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10"
                    >
                      <span>{selectedCountry?.flag}</span>
                      <span className="text-sm">{countryCode}</span>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute top-full mt-1 left-0 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10">
                        {countries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setCountryCode(country.code);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 text-left"
                          >
                            <span>{country.flag}</span>
                            <span className="text-sm">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send OTP <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                required
              />
              <p className="text-white/40 text-xs text-center mt-2">
                OTP sent to {mode === "login" && phone ? `${countryCode} ${phone}` : email}
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading || otp.length < 4}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify & Continue"
              )}
            </Button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-white/60 text-sm hover:text-white"
            >
              Change {mode === "login" && phone ? "phone number" : "email"}
            </button>
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#0a0a0a] text-white/40">or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full py-6 text-base font-medium bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-white/60 text-sm mt-6">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setOtpSent(false); }}
                className="text-[#D9FC67] font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signup"); setOtpSent(false); }}
                className="text-[#D9FC67] font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

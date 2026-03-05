"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, User, Phone, ArrowRight, Check, RotateCcw } from "lucide-react";

type Step = "email" | "otp" | "profile";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationToken, setVerificationToken] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setIsLoading(false);
    if (!res.ok) { setError(data.error || "Failed to send code."); return; }
    setStep("otp");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp.join("") }),
    });
    const data = await res.json();
    setIsLoading(false);
    if (!res.ok) { setError(data.error || "Invalid code."); return; }
    setVerificationToken(data.token);
    setStep("profile");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: verificationToken, name, mobile }),
    });
    const result = await signIn("credentials", { email, token: verificationToken, redirect: false });
    if (result?.error) {
      setError("Sign in failed. Please try the login page.");
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const stepNum = step === "email" ? 1 : step === "otp" ? 2 : 3;

  const GoogleButton = () => (
    <Button type="button" variant="outline" onClick={handleGoogleSignup} disabled={isLoading}
      className="w-full mb-6 bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/30 rounded-full h-12">
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </Button>
  );

  return (
    <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className={`flex items-center ${i < 2 ? "flex-1" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${stepNum > s ? "bg-[#D9FC67] text-black" : stepNum === s ? "bg-[#D9FC67] text-black ring-4 ring-[#D9FC67]/20" : "bg-white/10 text-white/40"}`}>
              {stepNum > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${stepNum > s ? "bg-[#D9FC67]" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}

      {step === "email" && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-white/60 text-sm">Start your podcasting journey with PodX</p>
          </div>
          <GoogleButton />
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#141414] text-white/40">Or sign up with email</span></div>
          </div>
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-full" required />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-full disabled:opacity-50">
              {isLoading ? "Sending code…" : "Send verification code"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
            <p className="text-white/60 text-sm">We sent a 6-digit code to <span className="text-[#D9FC67] font-medium">{email}</span></p>
          </div>
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input key={index} id={`otp-${index}`} type="text" inputMode="numeric" value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-white/10 text-white focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-xl" maxLength={1} />
              ))}
            </div>
            <Button type="submit" disabled={isLoading || otp.some((d) => !d)} className="w-full h-12 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-full disabled:opacity-50">
              {isLoading ? "Verifying…" : "Verify Email"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
          <button type="button" onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
            className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors">
            <RotateCcw className="w-4 h-4" /> Use a different email or resend code
          </button>
        </>
      )}

      {step === "profile" && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Complete your profile</h1>
            <p className="text-white/60 text-sm">Tell us a bit about yourself</p>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <Input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-full" required />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <Input type="tel" placeholder="Mobile number (optional)" value={mobile} onChange={(e) => setMobile(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-full" />
            </div>
            <Button type="submit" disabled={isLoading || !name} className="w-full h-12 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-full disabled:opacity-50">
              {isLoading ? "Creating account…" : "Complete Signup"} {!isLoading && <Check className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[#D9FC67] hover:text-[#E8FF8A] font-medium transition-colors">Sign in</Link>
      </p>
    </div>
  );
}

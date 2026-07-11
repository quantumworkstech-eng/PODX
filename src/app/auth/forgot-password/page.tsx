"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, Check, Lock, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStep(2);
    setIsLoading(false);
    console.log("OTP sent to:", email);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStep(3);
    setIsLoading(false);
    console.log("OTP verified:", otp.join(""));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStep(4);
    setIsLoading(false);
    console.log("Password reset successfully");
  };

  const renderEmailStep = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D9FC67]/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#D9FC67]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
        <p className="text-white/60 text-sm">
          No worries, we&apos;ll send you reset instructions
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-full"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-full transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </>
  );

  const renderOtpStep = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
        <p className="text-white/60 text-sm">
          We sent a 6-digit code to <span className="text-[#D9FC67]">{email}</span>
        </p>
      </div>

      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-white/10 text-white focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-xl"
              maxLength={1}
            />
          ))}
        </div>

        <Button
          type="submit"
          disabled={isLoading || otp.some((d) => !d)}
          className="w-full h-12 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-full transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>
      </form>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
        <p className="text-white/60 text-sm">Your new password must be different from previous passwords</p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-full"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:ring-[#D9FC67]/20 rounded-full"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !password || password !== confirmPassword}
          className="w-full h-12 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-full transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D9FC67] flex items-center justify-center">
        <Check className="w-10 h-10 text-black" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Password reset!</h1>
      <p className="text-white/60 text-sm mb-8">
        Your password has been successfully reset. Click below to log in.
      </p>
      <Link href="/auth/login">
        <Button className="w-full h-12 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-full transition-all hover:scale-[1.02]">
          Back to login
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-2xl">
      {step !== 4 && (
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      )}

      {step === 1 && renderEmailStep()}
      {step === 2 && renderOtpStep()}
      {step === 3 && renderPasswordStep()}
      {step === 4 && renderSuccessStep()}
    </div>
  );
}

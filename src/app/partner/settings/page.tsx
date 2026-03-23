"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  CreditCard,
  Camera,
  Save,
  Check,
  Building2,
  X,
  Smartphone,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PartnerSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "payment">("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Settings saved successfully!");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
  });

  // Bank account form state
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "savings" as "savings" | "current",
    upiId: "",
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState(false);

  // 2FA modal
  const [show2FAModal, setShow2FAModal] = useState(false);

  useEffect(() => {
    fetch("/api/partner/profile")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setProfile(d);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const [notifications, setNotifications] = useState({
    newBookings: true,
    bookingReminders: true,
    cancellations: true,
    payments: true,
    emailDigest: false,
  });

  const showSuccessFor = (msg = "Settings saved successfully!") => {
    setSuccessMsg(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, businessName: profile.businessName }),
      });
      showSuccessFor();
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
    setIsSaving(false);
  };

  const handleBankSave = async () => {
    setBankError(null);
    if (!bankForm.accountHolderName.trim()) return setBankError("Account holder name is required.");
    if (!bankForm.accountNumber.trim()) return setBankError("Account number is required.");
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) return setBankError("Account numbers do not match.");
    if (!bankForm.ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifscCode.toUpperCase())) return setBankError("Enter a valid IFSC code (e.g. HDFC0001234).");
    if (!bankForm.bankName.trim()) return setBankError("Bank name is required.");

    setBankSaving(true);
    try {
      const res = await fetch("/api/partner/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_account: bankForm.accountNumber,
          ifsc_code: bankForm.ifscCode.toUpperCase(),
          account_holder_name: bankForm.accountHolderName,
          bank_name: bankForm.bankName,
          account_type: bankForm.accountType,
          upi_id: bankForm.upiId || null,
          payment_method: "bank_transfer",
          action: "save_bank_details",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save bank details");
      setBankSuccess(true);
      showSuccessFor("Bank account saved successfully!");
    } catch (err: any) {
      setBankError(err.message);
    } finally {
      setBankSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payment", label: "Payment", icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-white/40">Manage your account settings and preferences</p>
      </div>

      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-400/10 border border-green-400/20 rounded-xl text-green-400">
          <Check className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-[#D9FC67]/10 text-[#D9FC67]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-black" />
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-[#D9FC67] rounded-full text-black">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                    <Input
                      value={profile.businessName}
                      onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                    <Input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="pl-10 bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                  {isSaving ? "Saving..." : "Save Changes"}
                  {!isSaving && <Save className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Security Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Current Password</label>
                  <Input type="password" placeholder="Enter current password" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">New Password</label>
                  <Input type="password" placeholder="Enter new password" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Confirm New Password</label>
                  <Input type="password" placeholder="Confirm new password" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#D9FC67]/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-[#D9FC67]" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Two-Factor Authentication</p>
                      <p className="text-white/40 text-xs">Extra layer of security for your account</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShow2FAModal(true)}
                    className="border-white/10 text-white hover:bg-white/5 text-xs"
                  >
                    Enable 2FA
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                  {isSaving ? "Saving..." : "Update Password"}
                  {!isSaving && <Save className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>

              <div className="space-y-4">
                {[
                  { key: "newBookings", label: "New Bookings", desc: "Get notified when someone books your studio" },
                  { key: "bookingReminders", label: "Booking Reminders", desc: "Receive reminders about upcoming sessions" },
                  { key: "cancellations", label: "Cancellations", desc: "Get notified about cancelled bookings" },
                  { key: "payments", label: "Payment Updates", desc: "Receive payment and payout notifications" },
                  { key: "emailDigest", label: "Email Digest", desc: "Weekly summary of your studio activity" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-white/40 text-sm">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        notifications[item.key as keyof typeof notifications] ? "bg-[#D9FC67]" : "bg-white/20"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-black transition-transform",
                          notifications[item.key as keyof typeof notifications] ? "left-7" : "left-1"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                  {isSaving ? "Saving..." : "Save Preferences"}
                  {!isSaving && <Save className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#D9FC67]/10 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-[#D9FC67]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Bank Account</h3>
                  <p className="text-white/40 text-sm">Earnings are transferred to this account</p>
                </div>
              </div>

              {bankError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <X className="w-4 h-4 flex-shrink-0" />
                  {bankError}
                </div>
              )}
              {bankSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Bank account saved successfully!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-white/60 text-sm mb-2 block">Account Holder Name *</label>
                  <Input
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                    placeholder="As per bank records"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Account Number *</label>
                  <Input
                    type="password"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Confirm Account Number *</label>
                  <Input
                    value={bankForm.confirmAccountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                    placeholder="Re-enter account number"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">IFSC Code *</label>
                  <Input
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 uppercase"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Bank Name *</label>
                  <Input
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Account Type</label>
                  <div className="flex gap-2">
                    {(["savings", "current"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBankForm({ ...bankForm, accountType: type })}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm capitalize transition-colors",
                          bankForm.accountType === type
                            ? "border-[#D9FC67]/50 bg-[#D9FC67]/10 text-[#D9FC67]"
                            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">UPI ID <span className="text-white/30">(optional)</span></label>
                  <Input
                    value={bankForm.upiId}
                    onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                    placeholder="e.g. yourname@upi"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#D9FC67]/5 rounded-xl border border-[#D9FC67]/15">
                <p className="text-[#D9FC67] font-medium text-sm mb-1">Payout Schedule</p>
                <p className="text-white/50 text-sm">Payouts are processed every Monday for the previous week's confirmed earnings.</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBankSave} disabled={bankSaving} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                  {bankSaving ? "Saving..." : "Save Bank Account"}
                  {!bankSaving && <Save className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2FA Modal ── */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#D9FC67]" />
                </div>
                <h3 className="text-white font-semibold">Two-Factor Authentication</h3>
              </div>
              <button onClick={() => setShow2FAModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white font-medium text-sm mb-1">How it works</p>
                <p className="text-white/50 text-sm">
                  2FA adds a second verification step when you sign in. After entering your password,
                  you&apos;ll be asked for a one-time code from an authenticator app (e.g. Google Authenticator, Authy).
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#D9FC67]/5 rounded-xl border border-[#D9FC67]/15">
                <Shield className="w-5 h-5 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#D9FC67] font-medium text-sm mb-1">Coming Soon</p>
                  <p className="text-white/50 text-sm">
                    Authenticator-app based 2FA is currently being rolled out. You&apos;ll receive an email
                    at <span className="text-white">{profile.email || "your registered email"}</span> as soon as it&apos;s available for your account.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShow2FAModal(false)}
              className="w-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

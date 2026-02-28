"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Camera,
  Save,
  Check,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PartnerSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "payment">("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [profile, setProfile] = useState({
    name: "Partner Account",
    email: "partner@podx.com",
    phone: "+91 98765 43210",
    businessName: "PodX Studios",
  });

  const [notifications, setNotifications] = useState({
    newBookings: true,
    bookingReminders: true,
    cancellations: true,
    payments: true,
    emailDigest: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
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
          Settings saved successfully!
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
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
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
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-[#D9FC67]" />
                  <span className="text-white font-medium">Two-Factor Authentication</span>
                </div>
                <p className="text-white/60 text-sm">Add an extra layer of security to your account</p>
                <Button variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/5">Enable 2FA</Button>
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
              <h3 className="text-lg font-semibold text-white">Payment Settings</h3>

              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-[#D9FC67]" />
                  <span className="text-white font-medium">Bank Account</span>
                </div>
                <p className="text-white/60 text-sm mb-4">Payments will be transferred to this account</p>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white text-sm">**** **** **** 1234</p>
                  <p className="text-white/40 text-xs">HDFC Bank • Primary Account</p>
                </div>
                <Button variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/5">Update Bank Account</Button>
              </div>

              <div className="p-4 bg-[#D9FC67]/10 rounded-xl border border-[#D9FC67]/20">
                <p className="text-[#D9FC67] font-medium mb-2">Payout Schedule</p>
                <p className="text-white/60 text-sm">Payouts are processed every Monday for the previous week's earnings</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                  {isSaving ? "Saving..." : "Save Settings"}
                  {!isSaving && <Save className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

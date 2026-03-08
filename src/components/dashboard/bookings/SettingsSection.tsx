"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Bell, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SettingsSection() {
  const { data: session } = useSession();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.full_name !== undefined) setFullName(data.full_name);
        if (data.phone !== undefined) setPhone(data.phone);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, phone }),
      });
      setSaveMsg(res.ok ? "Profile updated successfully." : "Failed to save. Please try again.");
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div id="profile" className="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#D9FC67]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Profile Information</h3>
                  <p className="text-white/50 text-sm">Update your personal details</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                  <input
                    type="email"
                    value={session?.user?.email || ""}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67] transition-colors"
                  />
                </div>
              </div>
              {saveMsg && (
                <p className={`text-sm ${saveMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>
                  {saveMsg}
                </p>
              )}
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </div>

          {/* Notifications */}
          <div id="notifications" className="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Notifications</h3>
                  <p className="text-white/50 text-sm">Choose how you want to be notified</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
                { key: "sms", label: "SMS Notifications", desc: "Receive updates via SMS" },
                { key: "push", label: "Push Notifications", desc: "Receive browser notifications" },
              ].map(({ key, label, desc }, i) => (
                <div key={key} className={cn("flex items-center justify-between py-3", i > 0 && "border-t border-white/5")}>
                  <div>
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-white/50 text-sm">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                    className={cn("w-12 h-6 rounded-full transition-colors relative", notifications[key as keyof typeof notifications] ? "bg-[#D9FC67]" : "bg-white/20")}
                  >
                    <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform", notifications[key as keyof typeof notifications] ? "translate-x-6" : "translate-x-0.5")} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div id="preferences" className="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Preferences</h3>
                  <p className="text-white/50 text-sm">Customize your experience</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Language</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors">
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Currency</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              {[
                { icon: User, label: "Profile Information", target: "profile" },
                { icon: Bell, label: "Notifications", target: "notifications" },
                { icon: Globe, label: "Preferences", target: "preferences" },
              ].map(({ icon: Icon, label, target }) => (
                <button
                  key={label}
                  onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-white/50" />
                    <span className="text-white/70">{label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#D9FC67]/10 to-[#B8E050]/10 rounded-2xl border border-[#D9FC67]/20 p-6">
            <h3 className="text-white font-semibold mb-2">Need Help?</h3>
            <p className="text-white/50 text-sm mb-4">Our support team is available 24/7 to assist you.</p>
            <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

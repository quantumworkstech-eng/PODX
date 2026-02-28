"use client";

import { useState } from "react";
import { User, Bell, Shield, CreditCard, Globe, Moon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SettingsSection() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const [preferences, setPreferences] = useState({
    language: "English",
    currency: "INR",
    timezone: "Asia/Kolkata",
  });

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
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
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="john@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue="+91 9876543210"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Location</label>
                  <input
                    type="text"
                    defaultValue="Mumbai, India"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors"
                  />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold">
                Save Changes
              </Button>
            </div>
          </div>

          <div className="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
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
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-white/50 text-sm">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, email: !n.email }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    notifications.email ? "bg-[#D9FC67]" : "bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform",
                      notifications.email ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-white/5">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-white/50 text-sm">Receive updates via SMS</p>
                </div>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, sms: !n.sms }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    notifications.sms ? "bg-[#D9FC67]" : "bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform",
                      notifications.sms ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-white/5">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-white/50 text-sm">Receive browser notifications</p>
                </div>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, push: !n.push }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    notifications.push ? "bg-[#D9FC67]" : "bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform",
                      notifications.push ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
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
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Timezone</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences((p) => ({ ...p, timezone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D9FC67] transition-colors"
                  >
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
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
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-white/50" />
                  <span className="text-white/70">Privacy & Security</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-white/50" />
                  <span className="text-white/70">Payment Methods</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-white/50" />
                  <span className="text-white/70">Appearance</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#D9FC67]/10 to-[#B8E050]/10 rounded-2xl border border-[#D9FC67]/20 p-6">
            <h3 className="text-white font-semibold mb-2">Need Help?</h3>
            <p className="text-white/50 text-sm mb-4">
              Our support team is available 24/7 to assist you with any questions.
            </p>
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

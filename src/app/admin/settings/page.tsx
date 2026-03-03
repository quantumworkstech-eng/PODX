"use client";

import { useState } from "react";
import { Settings, Save, Shield, Bell, Database, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      icon: Globe,
      title: "Platform Settings",
      color: "text-blue-400 bg-blue-500/10",
      fields: [
        { label: "Platform Name", value: "PodX", type: "text" },
        { label: "Support Email", value: "support@podx.in", type: "email" },
        { label: "Default Currency", value: "INR", type: "text" },
        { label: "GST Rate (%)", value: "18", type: "number" },
      ],
    },
    {
      icon: Shield,
      title: "Security Settings",
      color: "text-red-400 bg-red-500/10",
      fields: [
        { label: "Max Login Attempts", value: "5", type: "number" },
        { label: "Session Timeout (hours)", value: "24", type: "number" },
      ],
    },
    {
      icon: Bell,
      title: "Notification Settings",
      color: "text-[#D9FC67] bg-[#D9FC67]/10",
      fields: [
        { label: "Admin Alert Email", value: "admin@podx.in", type: "email" },
      ],
    },
    {
      icon: Database,
      title: "Data Retention",
      color: "text-purple-400 bg-purple-500/10",
      fields: [
        { label: "Booking History (days)", value: "365", type: "number" },
        { label: "Log Retention (days)", value: "90", type: "number" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white">Admin Settings</h2>
        <p className="text-white/40 text-sm">Configure platform-wide settings and policies</p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="bg-[#18181b] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.color}`}>
              <section.icon className="w-5 h-5" />
            </div>
            <h3 className="text-white font-semibold">{section.title}</h3>
          </div>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.label}>
                <label className="text-white/60 text-sm block mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  defaultValue={field.value}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D9FC67] to-[#B8E050] text-black font-semibold text-sm transition-all hover:from-[#E8FF8A] hover:to-[#D9FC67]"
      >
        <Save className="w-4 h-4" />
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

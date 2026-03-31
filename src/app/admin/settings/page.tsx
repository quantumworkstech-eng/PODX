"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Shield, RefreshCw, Check, Globe, CreditCard, Package } from "lucide-react";

const DEFAULT_SETTINGS: Record<string, string> = {
  gst_percent: "18",
  platform_commission_percent: "10",
  default_currency: "INR",
  default_language: "en",
  min_booking_hours: "1",
  max_booking_hours: "8",
  cancellation_full_refund_hours: "48",
  cancellation_partial_refund_hours: "24",
  cancellation_partial_refund_percent: "50",
  partner_min_payout: "1000",
  maintenance_mode: "false",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save settings");
    }
  };

  const set = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    {
      icon: Globe,
      title: "Platform Settings",
      color: "text-blue-400 bg-blue-500/10",
      fields: [
        { label: "Default Currency", key: "default_currency", type: "text" },
        { label: "Default Language", key: "default_language", type: "text" },
      ],
    },
    {
      icon: CreditCard,
      title: "Payment Settings",
      color: "text-green-400 bg-green-500/10",
      fields: [
        { label: "GST Rate (%)", key: "gst_percent", type: "number" },
        { label: "Platform Commission (%)", key: "platform_commission_percent", type: "number" },
        { label: "Partner Min. Payout (₹)", key: "partner_min_payout", type: "number" },
      ],
    },
    {
      icon: Package,
      title: "Booking Settings",
      color: "text-[#D9FC67] bg-[#D9FC67]/10",
      fields: [
        { label: "Min. Booking Hours", key: "min_booking_hours", type: "number" },
        { label: "Max. Booking Hours", key: "max_booking_hours", type: "number" },
        { label: "Full Refund Before (hours)", key: "cancellation_full_refund_hours", type: "number" },
        { label: "Partial Refund Before (hours)", key: "cancellation_partial_refund_hours", type: "number" },
        { label: "Partial Refund Amount (%)", key: "cancellation_partial_refund_percent", type: "number" },
      ],
    },
    {
      icon: Shield,
      title: "System Settings",
      color: "text-red-400 bg-red-500/10",
      fields: [
        { label: "Maintenance Mode", key: "maintenance_mode", type: "text", hint: "Set to 'true' to enable" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">Configure global platform settings and policies</p>
        </div>
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <Settings className="w-3.5 h-3.5" />
          Changes apply immediately
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

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
              <div key={field.key}>
                <label className="text-white/60 text-sm block mb-1.5">
                  {field.label}
                  {(field as any).hint && (
                    <span className="text-white/30 text-xs ml-2">{(field as any).hint}</span>
                  )}
                </label>
                <input
                  type={field.type}
                  value={settings[field.key] ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D9FC67] to-[#B8E050] text-black font-semibold text-sm transition-all hover:from-[#E8FF8A] hover:to-[#D9FC67] disabled:opacity-60"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Mail, Save, Check, AlertCircle, Send, Server, ShieldCheck,
  RefreshCw, Eye, EyeOff, Info, Database, FileCode,
} from "lucide-react";

type Settings = {
  configured: boolean;
  provider: "ses_smtp" | "smtp" | "resend";
  ses_region: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_rate_limit: number;
  smtp_max_connections: number;
  from_email: string;
  from_name: string;
  reply_to: string;
  support_email: string;
  admin_alert_emails: string;
  is_enabled: boolean;
  smtp_password_set: boolean;
  smtp_password_hint: string | null;
  smtp_password_source: "database" | "environment" | "none";
  resend_api_key_set: boolean;
  resend_api_key_hint: string | null;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_error: string | null;
  updated_at: string | null;
  updated_by_email: string | null;
};

type TestResult = {
  ok: boolean;
  stage: string;
  transport?: string;
  host?: string;
  message?: string;
  error?: string;
  simulated?: boolean;
};

const input =
  "w-full bg-[#0f0f11] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40 transition-colors";
const label = "block text-xs font-medium text-white/50 mb-1.5";
const card = "bg-[#18181b] border border-white/5 rounded-2xl p-6";

export default function AdminEmailSettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);

  // Bumped after a save or test so the screen re-reads the stored settings.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = () => setReloadToken((n) => n + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/mailer-settings");
        const d = await res.json();
        if (cancelled) return;
        if (d.settings) setS(d.settings);
        else setError(d.error || "Failed to load settings");
      } catch {
        if (!cancelled) setError("Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [reloadToken]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!s) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/mailer-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...s,
        // Only sent when the admin actually typed a new secret.
        smtp_password: password || undefined,
        resend_api_key: resendKey || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      if (d.settings) setS(d.settings);
      setPassword("");
      setResendKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(d.error || "Failed to save settings");
    }
  };

  const handleTest = async (withSend: boolean) => {
    setTesting(true);
    setTest(null);
    const res = await fetch("/api/admin/mailer-settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withSend ? { to: testTo } : {}),
    });
    const d = await res.json().catch(() => ({}));
    setTesting(false);
    setTest(res.ok ? d : { ok: false, stage: "request", error: d.error || "Test failed" });
    reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!s) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
        {error || "Could not load mailer settings."}
      </div>
    );
  }

  const usingDb = s.smtp_password_source === "database";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-400" /> Email Settings
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Transport and sender identity for all transactional email.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Where config is coming from */}
      <div className={`${card} flex flex-col sm:flex-row gap-4 sm:items-center justify-between`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${usingDb ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
            {usingDb ? <Database className="w-4 h-4 text-green-400" /> : <FileCode className="w-4 h-4 text-yellow-400" />}
          </div>
          <div>
            <p className="text-sm text-white font-medium">
              {usingDb ? "Using credentials saved here" : "Using credentials from environment variables"}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {usingDb
                ? "These settings override the .env values on every send."
                : "Save an SMTP password below to manage it from this screen instead of .env."}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2.5 shrink-0 cursor-pointer">
          <span className="text-xs text-white/50">Sending enabled</span>
          <button
            type="button"
            onClick={() => set("is_enabled", !s.is_enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${s.is_enabled ? "bg-green-500/30" : "bg-white/10"}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${s.is_enabled ? "translate-x-6 bg-green-400" : "translate-x-1 bg-white/40"}`} />
          </button>
        </label>
      </div>

      {!s.is_enabled && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-2 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          Sending is turned off. Emails are still recorded in the log but nothing is delivered.
        </div>
      )}

      {/* SMTP */}
      <div className={card}>
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-blue-400" /> SMTP transport
        </h2>
        <p className="text-xs text-white/40 mb-5">
          Amazon SES. The host is derived from the region unless you set it explicitly.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>SES region</label>
            <input className={input} value={s.ses_region} onChange={(e) => set("ses_region", e.target.value)} placeholder="ap-south-1" />
            <p className="text-[11px] text-white/25 mt-1.5">Host: {s.smtp_host || `email-smtp.${s.ses_region || "ap-south-1"}.amazonaws.com`}</p>
          </div>
          <div>
            <label className={label}>SMTP host <span className="text-white/25">(optional override)</span></label>
            <input className={input} value={s.smtp_host} onChange={(e) => set("smtp_host", e.target.value)} placeholder="derived from region" />
          </div>
          <div>
            <label className={label}>Port</label>
            <input className={input} type="number" value={s.smtp_port} onChange={(e) => set("smtp_port", Number(e.target.value))} />
            <p className="text-[11px] text-white/25 mt-1.5">587 STARTTLS · 465 implicit TLS</p>
          </div>
          <div>
            <label className={label}>SMTP username</label>
            <input className={input} value={s.smtp_user} onChange={(e) => set("smtp_user", e.target.value)} placeholder="AKIA…" spellCheck={false} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>SMTP password</label>
            <div className="relative">
              <input
                className={`${input} pr-10 font-mono`}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={s.smtp_password_set ? `Saved — ${s.smtp_password_hint} (leave blank to keep)` : "Enter SMTP password"}
                spellCheck={false}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-white/25 mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              Stored encrypted (AES-256-GCM) and never sent back to the browser.
            </p>
          </div>
          <div>
            <label className={label}>Rate limit (per second)</label>
            <input className={input} type="number" value={s.smtp_rate_limit} onChange={(e) => set("smtp_rate_limit", Number(e.target.value))} />
            <p className="text-[11px] text-white/25 mt-1.5">SES sandbox allows 1/sec</p>
          </div>
          <div>
            <label className={label}>Max connections</label>
            <input className={input} type="number" value={s.smtp_max_connections} onChange={(e) => set("smtp_max_connections", Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Sender identity */}
      <div className={card}>
        <h2 className="text-sm font-semibold text-white mb-1">Sender identity</h2>
        <p className="text-xs text-white/40 mb-5">The from address must be a verified identity in SES.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>From address</label>
            <input className={input} value={s.from_email} onChange={(e) => set("from_email", e.target.value)} placeholder="support@yanisa.in" />
          </div>
          <div>
            <label className={label}>From name</label>
            <input className={input} value={s.from_name} onChange={(e) => set("from_name", e.target.value)} placeholder="Yanisa Studios" />
          </div>
          <div>
            <label className={label}>Reply-to <span className="text-white/25">(optional)</span></label>
            <input className={input} value={s.reply_to} onChange={(e) => set("reply_to", e.target.value)} />
          </div>
          <div>
            <label className={label}>Support address</label>
            <input className={input} value={s.support_email} onChange={(e) => set("support_email", e.target.value)} />
            <p className="text-[11px] text-white/25 mt-1.5">Shown in every email footer</p>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Admin alert recipients</label>
            <input className={input} value={s.admin_alert_emails} onChange={(e) => set("admin_alert_emails", e.target.value)} placeholder="ops@yanisa.in, founders@yanisa.in" />
            <p className="text-[11px] text-white/25 mt-1.5">
              Comma-separated. Receives payout and refund failure alerts. Leave blank to use every active admin account.
            </p>
          </div>
        </div>
      </div>

      {/* Test */}
      <div className={card}>
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Send className="w-4 h-4 text-green-400" /> Test connection
        </h2>
        <p className="text-xs text-white/40 mb-5">
          Save your changes first — the test uses the stored settings.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input className={input} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com (optional)" />
          <div className="flex gap-2 shrink-0">
            <button onClick={() => handleTest(false)} disabled={testing} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/70 border border-white/10 text-sm font-medium hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap">
              {testing ? "Testing…" : "Verify only"}
            </button>
            <button onClick={() => handleTest(true)} disabled={testing || !testTo.includes("@")} className="px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-40 whitespace-nowrap">
              Send test
            </button>
          </div>
        </div>

        {test && (
          <div className={`mt-4 rounded-xl p-4 text-sm flex gap-2 ${test.ok ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {test.ok ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <p className="font-medium">{test.ok ? test.message || "Success" : test.error}</p>
              {test.host && <p className="text-xs opacity-70 mt-1 break-all">{test.transport} · {test.host}</p>}
            </div>
          </div>
        )}

        {s.last_tested_at && !test && (
          <p className="text-[11px] text-white/25 mt-4 flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            Last tested {new Date(s.last_tested_at).toLocaleString()} —{" "}
            {s.last_test_ok ? "succeeded" : `failed: ${s.last_test_error}`}
          </p>
        )}
      </div>

      {s.updated_at && (
        <p className="text-[11px] text-white/25 text-center">
          Last updated {new Date(s.updated_at).toLocaleString()}
          {s.updated_by_email ? ` by ${s.updated_by_email}` : ""}
        </p>
      )}
    </div>
  );
}

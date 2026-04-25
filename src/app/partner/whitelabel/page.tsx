"use client";

import { useState, useEffect } from "react";
import {
  Globe, Palette, Link as LinkIcon, Mail, Image, Save,
  ExternalLink, Copy, CheckCircle, AlertCircle, Loader2,
  Eye, RefreshCw, Shield, Trash2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhiteLabelAssetUpload } from "@/components/partner/WhiteLabelAssetUpload";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/partner/FeatureGate";

interface Branding {
  brand_name?: string;
  partner_slug?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  button_text_color?: string;
  font_family?: string;
  booking_page_title?: string;
  booking_page_description?: string;
  website_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  email_sender_name?: string;
  email_sender_address?: string;
  email_footer_text?: string;
  subdomain?: string;
  custom_domain?: string;
  url_mode?: string;
  is_published?: boolean;
  admin_disabled?: boolean;
  domain_verified?: boolean;
  domain_verification_token?: string;
}

const TABS = [
  { id: "identity", label: "Identity", icon: Image },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "content", label: "Page Content", icon: Globe },
  { id: "contact", label: "Contact & Social", icon: Mail },
  { id: "domain", label: "Domain & URLs", icon: LinkIcon },
  { id: "email", label: "Email Branding", icon: Mail },
];

export default function WhiteLabelSettingsPage() {
  const [activeTab, setActiveTab] = useState("identity");
  const [branding, setBranding] = useState<Branding>({
    primary_color: "#D9FC67",
    secondary_color: "#0a0a0a",
    background_color: "#09090b",
    text_color: "#ffffff",
    button_text_color: "#000000",
    url_mode: "slug",
    is_published: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [domainToken, setDomainToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/partner/branding")
      .then((r) => r.json())
      .then(({ branding: b }) => {
        if (b) setBranding(b);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string | boolean) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setBranding(data.branding);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const generateDomainToken = async () => {
    setDomainVerifying(true);
    try {
      const res = await fetch("/api/partner/branding/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verify: false }),
      });
      const data = await res.json();
      if (data.token) setDomainToken(data.token);
    } catch {
      setError("Failed to generate token");
    } finally {
      setDomainVerifying(false);
    }
  };

  const verifyDomain = async () => {
    setDomainVerifying(true);
    try {
      const res = await fetch("/api/partner/branding/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verify: true }),
      });
      const data = await res.json();
      if (data.verified) {
        setBranding((prev) => ({ ...prev, domain_verified: true }));
        setSaved(false);
      } else {
        setError(data.error || "Verification failed — check DNS propagation");
      }
    } catch {
      setError("Verification check failed");
    } finally {
      setDomainVerifying(false);
    }
  };

  const resetBranding = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/branding", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset configuration");
      // Reset state to initial
      setBranding({
        primary_color: "#D9FC67",
        secondary_color: "#0a0a0a",
        background_color: "#09090b",
        text_color: "#ffffff",
        button_text_color: "#000000",
        url_mode: "slug",
        is_published: false,
      });
      setShowDeleteConfirm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewUrl = branding.partner_slug
    ? `${window?.location?.origin || ""}/p/${branding.partner_slug}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <FeatureGate featureKey="white_label">
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white/40">Configure your branded booking platform</p>
        </div>
        <div className="flex items-center gap-3">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-sm transition-all"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-white/60">Published</span>
            <button
              onClick={() => update("is_published", !branding.is_published)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                branding.is_published ? "bg-[#D9FC67]" : "bg-white/10"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                  branding.is_published ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </label>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Admin-disabled warning — shown when admin has blocked this partner's white-label */}
      {branding.admin_disabled && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Your white-label site has been disabled by the platform admin.</p>
            <p className="text-red-400/70 text-xs mt-1">
              Your branding settings are preserved. Please contact support to re-enable your white-label platform.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "bg-[#D9FC67] text-black"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">

        {/* IDENTITY */}
        {activeTab === "identity" && (
          <>
            <SectionTitle>Brand Identity</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand Name" required>
                <input value={branding.brand_name || ""} onChange={(e) => update("brand_name", e.target.value)}
                  placeholder="e.g. Mumbai Podcast Hub" className={inputCls} />
              </Field>
              <Field label="URL Slug" hint="Used in /p/{slug}">
                <div className="flex">
                  <span className="flex items-center px-3 bg-white/5 border border-r-0 border-white/10 rounded-l-xl text-white/40 text-sm">/p/</span>
                  <input value={branding.partner_slug || ""} onChange={(e) => update("partner_slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="my-studio" className={cn(inputCls, "rounded-l-none")} />
                </div>
              </Field>
              <div className="sm:col-span-1">
                <WhiteLabelAssetUpload
                  kind="logo"
                  url={branding.logo_url}
                  hint="Recommended: 200×60px (PNG, transparent)"
                  onBrandingUpdate={(b) => {
                    setBranding((prev) => ({ ...prev, ...b }));
                    setSaved(false);
                  }}
                />
              </div>
              <div className="sm:col-span-1">
                <WhiteLabelAssetUpload
                  kind="favicon"
                  url={branding.favicon_url}
                  hint="32×32 or 64×64 — PNG or ICO"
                  onBrandingUpdate={(b) => {
                    setBranding((prev) => ({ ...prev, ...b }));
                    setSaved(false);
                  }}
                />
              </div>
              <Field label="Tagline" className="col-span-2">
                <input value={branding.tagline || ""} onChange={(e) => update("tagline", e.target.value)}
                  placeholder="Your studio booking tagline" className={inputCls} />
              </Field>
            </div>
          </>
        )}

        {/* COLORS */}
        {activeTab === "colors" && (
          <>
            <SectionTitle>Brand Colors</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { field: "primary_color", label: "Primary / Accent", hint: "Buttons, links, highlights" },
                { field: "secondary_color", label: "Secondary / Header", hint: "Navigation background" },
                { field: "background_color", label: "Page Background" },
                { field: "text_color", label: "Body Text" },
                { field: "button_text_color", label: "Button Text", hint: "Text on primary buttons" },
                { field: "accent_color", label: "Accent" },
              ].map(({ field, label, hint }) => (
                <Field key={field} label={label} hint={hint}>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={(branding as Record<string, string>)[field] || "#ffffff"}
                      onChange={(e) => update(field, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      value={(branding as Record<string, string>)[field] || ""}
                      onChange={(e) => update(field, e.target.value)}
                      placeholder="#000000"
                      className={cn(inputCls, "flex-1")}
                    />
                  </div>
                </Field>
              ))}
            </div>
            {/* Live preview */}
            <div className="mt-4 p-4 rounded-xl border border-white/10">
              <p className="text-white/40 text-xs mb-3">Preview</p>
              <div
                className="rounded-xl p-6 text-center"
                style={{ background: branding.background_color || "#09090b", color: branding.text_color || "#ffffff" }}
              >
                <p className="text-lg font-bold mb-3">{branding.brand_name || "Your Brand"}</p>
                <button
                  className="px-6 py-2 rounded-xl font-semibold text-sm"
                  style={{ background: branding.primary_color || "#D9FC67", color: branding.button_text_color || "#000000" }}
                >
                  Book Now
                </button>
              </div>
            </div>
          </>
        )}

        {/* CONTENT */}
        {activeTab === "content" && (
          <>
            <SectionTitle>Booking Page Content</SectionTitle>
            <div className="space-y-4">
              <Field label="Page Title">
                <input value={branding.booking_page_title || ""} onChange={(e) => update("booking_page_title", e.target.value)}
                  placeholder="Book Your Podcast Studio Session" className={inputCls} />
              </Field>
              <Field label="Page Description">
                <textarea value={branding.booking_page_description || ""} onChange={(e) => update("booking_page_description", e.target.value)}
                  placeholder="Describe your studio booking experience..." rows={3}
                  className={cn(inputCls, "resize-none")} />
              </Field>
              <Field label="Font Family" hint="Google Fonts name">
                <select value={branding.font_family || "Inter"} onChange={(e) => update("font_family", e.target.value)}
                  className={inputCls}>
                  {["Inter", "Poppins", "Roboto", "Montserrat", "Raleway", "Nunito", "Open Sans", "Lato"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        )}

        {/* CONTACT & SOCIAL */}
        {activeTab === "contact" && (
          <>
            <SectionTitle>Contact Details</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact Email">
                <input type="email" value={branding.contact_email || ""} onChange={(e) => update("contact_email", e.target.value)}
                  placeholder="hello@yourstudio.com" className={inputCls} />
              </Field>
              <Field label="Contact Phone">
                <input value={branding.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)}
                  placeholder="+91 98765 43210" className={inputCls} />
              </Field>
              <Field label="Address" className="col-span-2">
                <input value={branding.contact_address || ""} onChange={(e) => update("contact_address", e.target.value)}
                  placeholder="123 Studio Lane, Mumbai" className={inputCls} />
              </Field>
            </div>
            <SectionTitle className="mt-6">Social Links</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { field: "website_url", label: "Website", placeholder: "https://yourstudio.com" },
                { field: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/yourstudio" },
                { field: "twitter_url", label: "Twitter / X", placeholder: "https://twitter.com/yourstudio" },
                { field: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourstudio" },
                { field: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@yourstudio" },
              ].map(({ field, label, placeholder }) => (
                <Field key={field} label={label}>
                  <input value={(branding as Record<string, string>)[field] || ""} onChange={(e) => update(field, e.target.value)}
                    placeholder={placeholder} className={inputCls} />
                </Field>
              ))}
            </div>
          </>
        )}

        {/* DOMAIN & URLs */}
        {activeTab === "domain" && (
          <>
            <SectionTitle>URL Configuration</SectionTitle>
            <div className="space-y-4">
              <Field label="URL Mode">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "slug", label: "Path Slug", desc: "yanisastudios.com/p/your-slug" },
                    { value: "subdomain", label: "Subdomain", desc: "yourslug.yanisastudios.com" },
                    { value: "custom_domain", label: "Custom Domain", desc: "booking.yourdomain.com" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update("url_mode", opt.value)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        branding.url_mode === opt.value
                          ? "border-[#D9FC67] bg-[#D9FC67]/5"
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <p className={cn("font-medium text-sm", branding.url_mode === opt.value ? "text-[#D9FC67]" : "text-white")}>{opt.label}</p>
                      <p className="text-white/40 text-xs mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              {branding.url_mode === "subdomain" && (
                <Field label="Subdomain" hint="Will appear as {subdomain}.yanisastudios.com">
                  <div className="flex">
                    <input value={branding.subdomain || ""} onChange={(e) => update("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="mystudio" className={cn(inputCls, "rounded-r-none")} />
                    <span className="flex items-center px-3 bg-white/5 border border-l-0 border-white/10 rounded-r-xl text-white/40 text-sm">.yanisastudios.com</span>
                  </div>
                </Field>
              )}

              {branding.url_mode === "custom_domain" && (
                <div className="space-y-4">
                  <Field label="Custom Domain">
                    <input value={branding.custom_domain || ""} onChange={(e) => update("custom_domain", e.target.value.toLowerCase())}
                      placeholder="booking.yourstudio.com" className={inputCls} />
                  </Field>

                  {/* Domain verification */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-white/40" />
                        <span className="text-sm font-medium text-white">Domain Verification</span>
                      </div>
                      {branding.domain_verified ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">Unverified</span>
                      )}
                    </div>

                    {domainToken ? (
                      <div className="space-y-2">
                        <p className="text-xs text-white/60">Add this DNS TXT record to your domain:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 bg-black/40 rounded-lg">
                            <p className="text-white/40 mb-1">Type</p>
                            <p className="text-white font-mono">TXT</p>
                          </div>
                          <div className="p-2 bg-black/40 rounded-lg">
                            <p className="text-white/40 mb-1">Name</p>
                            <p className="text-white font-mono">_yanisa-verify</p>
                          </div>
                          <div className="p-2 bg-black/40 rounded-lg relative">
                            <p className="text-white/40 mb-1">Value</p>
                            <p className="text-white font-mono text-xs truncate">{domainToken}</p>
                            <button onClick={() => copyToClipboard(domainToken)} className="absolute top-2 right-2 text-white/40 hover:text-white">
                              {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <Button onClick={verifyDomain} disabled={domainVerifying} size="sm"
                          className="bg-white/5 hover:bg-white/10 text-white border border-white/10">
                          {domainVerifying ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />}
                          Check DNS
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={generateDomainToken} disabled={domainVerifying || !branding.custom_domain} size="sm"
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10">
                        {domainVerifying ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Shield className="w-3 h-3 mr-2" />}
                        Generate Verification Token
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Live URL display */}
              {branding.partner_slug && (
                <div className="p-4 bg-[#D9FC67]/5 rounded-xl border border-[#D9FC67]/20">
                  <p className="text-xs text-[#D9FC67]/60 mb-1">Your booking page URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-[#D9FC67] text-sm flex-1 truncate">
                      {typeof window !== "undefined" ? window.location.origin : "https://yanisastudios.com"}/p/{branding.partner_slug}
                    </code>
                    <button
                      onClick={() => copyToClipboard(`${typeof window !== "undefined" ? window.location.origin : ""}/p/${branding.partner_slug}`)}
                      className="text-[#D9FC67]/60 hover:text-[#D9FC67]"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={`/p/${branding.partner_slug}`} target="_blank" rel="noreferrer" className="text-[#D9FC67]/60 hover:text-[#D9FC67]">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* EMAIL BRANDING */}
        {activeTab === "email" && (
          <>
            <SectionTitle>Email Branding</SectionTitle>
            <p className="text-white/40 text-sm">Emails will be sent via Yanisa Studio infrastructure with your branding applied.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Sender Name" hint="Shown as 'From' name">
                <input value={branding.email_sender_name || ""} onChange={(e) => update("email_sender_name", e.target.value)}
                  placeholder="Mumbai Podcast Hub" className={inputCls} />
              </Field>
              <Field label="Reply-to Email">
                <input type="email" value={branding.email_sender_address || ""} onChange={(e) => update("email_sender_address", e.target.value)}
                  placeholder="bookings@yourstudio.com" className={inputCls} />
              </Field>
              <Field label="Email Footer Text" className="col-span-2">
                <textarea value={(branding as Record<string, string>).email_footer_text || ""} onChange={(e) => update("email_footer_text", e.target.value)}
                  placeholder="Thank you for booking with us. For queries contact hello@yourstudio.com" rows={3}
                  className={cn(inputCls, "resize-none")} />
              </Field>
            </div>
          </>
        )}
      </div>

      {/* ── Danger Zone ────────────────────────────────────────── */}
      <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-white/40 text-sm mt-1">
            Permanently delete your white-label configuration. All branding, domain settings, and content will be lost. Your studios and bookings are not affected.
          </p>
        </div>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Reset White-Label Configuration
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400 font-medium">
              Are you absolutely sure? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetBranding}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting…" : "Yes, Reset Everything"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}

// ── Helper components ──────────────────────────────────────────

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-base font-semibold text-white mb-2", className)}>{children}</h3>;
}

function Field({
  label, hint, children, required, className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-white/70">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
        {hint && <span className="text-white/30 font-normal ml-2 text-xs">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/50 focus:ring-1 focus:ring-[#D9FC67]/20 transition-colors";

"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, ExternalLink, Image as ImageIcon, Video, Check, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Tab = "hero" | "stats" | "marquee" | "services" | "how_it_works" | "testimonials" | "bundles" | "faq" | "footer" | "nav";

const TABS: { id: Tab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "stats", label: "Stats" },
  { id: "marquee", label: "Marquee" },
  { id: "services", label: "Services" },
  { id: "how_it_works", label: "How It Works" },
  { id: "testimonials", label: "Testimonials" },
  { id: "bundles", label: "Bundles" },
  { id: "faq", label: "FAQ" },
  { id: "footer", label: "Footer" },
  { id: "nav", label: "Navigation" },
];

export default function LandingCMSPage() {
  const [activeTab, setActiveTab] = useState<Tab>("hero");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/landing")
      .then((r) => r.json())
      .then((d) => setContent(d.content || {}))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const save = async (section: string, data: unknown) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, content: data }),
      });
      setContent((prev) => ({ ...prev, [section]: data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Landing Page CMS</h2>
          <p className="text-white/40">Manage all content sections of the landing page</p>
        </div>
        <Link href="/" target="_blank">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
            <Globe className="w-4 h-4" />
            View Landing Page
            <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-white/5 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[#D9FC67] text-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        {activeTab === "hero" && (
          <HeroEditor data={content.hero as Record<string, unknown> || {}} onSave={(d) => save("hero", d)} saving={saving} saved={saved} />
        )}
        {activeTab === "stats" && (
          <ArrayEditor
            title="Stats"
            description="Numbers displayed in the hero section"
            data={(content.stats as unknown[]) || []}
            fields={[
              { key: "number", label: "Number (e.g. 500+)" },
              { key: "label", label: "Label (e.g. Creators)" },
            ]}
            onSave={(d) => save("stats", d)}
            saving={saving}
            saved={saved}
          />
        )}
        {activeTab === "marquee" && (
          <MarqueeEditor data={(content.marquee as string[]) || []} onSave={(d) => save("marquee", d)} saving={saving} saved={saved} />
        )}
        {activeTab === "services" && (
          <ArrayEditor
            title="Services"
            description="The 3 service pillar cards"
            data={(content.services as unknown[]) || []}
            fields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", multiline: true },
              { key: "image_url", label: "Image URL" },
            ]}
            onSave={(d) => save("services", d)}
            saving={saving}
            saved={saved}
          />
        )}
        {activeTab === "how_it_works" && (
          <ArrayEditor
            title="How It Works"
            description="The 4-step process section"
            data={(content.how_it_works as unknown[]) || []}
            fields={[
              { key: "step", label: "Step Number (e.g. 01)" },
              { key: "title", label: "Title" },
              { key: "description", label: "Description", multiline: true },
            ]}
            onSave={(d) => save("how_it_works", d)}
            saving={saving}
            saved={saved}
          />
        )}
        {activeTab === "testimonials" && (
          <ArrayEditor
            title="Testimonials"
            description="Customer testimonial quotes"
            data={(content.testimonials as unknown[]) || []}
            fields={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role / Followers" },
              { key: "quote", label: "Quote", multiline: true },
              { key: "avatar_url", label: "Avatar Image URL (optional)" },
            ]}
            onSave={(d) => save("testimonials", d)}
            saving={saving}
            saved={saved}
          />
        )}
        {activeTab === "bundles" && (
          <BundlesEditor data={(content.bundles as unknown[]) || []} onSave={(d) => save("bundles", d)} saving={saving} saved={saved} />
        )}
        {activeTab === "faq" && (
          <ArrayEditor
            title="FAQ"
            description="Frequently asked questions"
            data={(content.faq as unknown[]) || []}
            fields={[
              { key: "question", label: "Question" },
              { key: "answer", label: "Answer", multiline: true },
            ]}
            onSave={(d) => save("faq", d)}
            saving={saving}
            saved={saved}
          />
        )}
        {activeTab === "footer" && (
          <FooterEditor data={content.footer as Record<string, unknown> || {}} onSave={(d) => save("footer", d)} saving={saving} saved={saved} />
        )}
        {activeTab === "nav" && (
          <NavEditor data={content.nav as Record<string, unknown> || {}} onSave={(d) => save("nav", d)} saving={saving} saved={saved} />
        )}
      </div>
    </div>
  );
}

// ─── Hero Editor ──────────────────────────────────────────────────────────────

function HeroEditor({ data, onSave, saving, saved }: { data: Record<string, unknown>; onSave: (d: unknown) => void; saving: boolean; saved: boolean }) {
  const [form, setForm] = useState({
    headline: (data.headline as string) || "",
    subheadline: (data.subheadline as string) || "",
    cta_primary_text: (data.cta_primary_text as string) || "",
    cta_primary_url: (data.cta_primary_url as string) || "",
    cta_secondary_text: (data.cta_secondary_text as string) || "",
    cta_secondary_url: (data.cta_secondary_url as string) || "",
    media_type: (data.media_type as string) || "image",
    media_url: (data.media_url as string) || "",
    overlay_opacity: (data.overlay_opacity as number) ?? 60,
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Hero Section" description="The main banner at the top of the page" />

      <div className="grid grid-cols-1 gap-4">
        <Field label="Headline">
          <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className="bg-white/5 border-white/10 text-white" placeholder="Where Great Podcasts Begin" />
        </Field>
        <Field label="Sub-headline">
          <textarea value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:outline-none resize-none text-sm"
            placeholder="Describe your platform..." />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary CTA Text">
            <Input value={form.cta_primary_text} onChange={(e) => setForm({ ...form, cta_primary_text: e.target.value })}
              className="bg-white/5 border-white/10 text-white" placeholder="Browse Studios" />
          </Field>
          <Field label="Primary CTA URL">
            <Input value={form.cta_primary_url} onChange={(e) => setForm({ ...form, cta_primary_url: e.target.value })}
              className="bg-white/5 border-white/10 text-white" placeholder="/studios" />
          </Field>
          <Field label="Secondary CTA Text">
            <Input value={form.cta_secondary_text} onChange={(e) => setForm({ ...form, cta_secondary_text: e.target.value })}
              className="bg-white/5 border-white/10 text-white" placeholder="Book a Session" />
          </Field>
          <Field label="Secondary CTA URL">
            <Input value={form.cta_secondary_url} onChange={(e) => setForm({ ...form, cta_secondary_url: e.target.value })}
              className="bg-white/5 border-white/10 text-white" placeholder="/book" />
          </Field>
        </div>

        <Field label="Background Media">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ ...form, media_type: "image" })}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",
                  form.media_type === "image" ? "bg-[#D9FC67]/10 border-[#D9FC67]/40 text-[#D9FC67]" : "border-white/10 text-white/60 hover:border-white/20")}>
                <ImageIcon className="w-4 h-4" /> Image
              </button>
              <button type="button" onClick={() => setForm({ ...form, media_type: "video" })}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",
                  form.media_type === "video" ? "bg-[#D9FC67]/10 border-[#D9FC67]/40 text-[#D9FC67]" : "border-white/10 text-white/60 hover:border-white/20")}>
                <Video className="w-4 h-4" /> Video
              </button>
            </div>
            <Input value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder={form.media_type === "image" ? "https://... image URL" : "https://... video URL (mp4)"} />
            <p className="text-white/30 text-xs">
              {form.media_type === "image" ? "Enter a direct image URL (JPG/PNG/WebP)" : "Enter a direct MP4 video URL for autoplay background"}
            </p>
          </div>
        </Field>

        <Field label={`Overlay Opacity: ${form.overlay_opacity}%`}>
          <input type="range" min={0} max={90} value={form.overlay_opacity}
            onChange={(e) => setForm({ ...form, overlay_opacity: parseInt(e.target.value) })}
            className="w-full accent-[#D9FC67]" />
        </Field>
      </div>

      <SaveButton onSave={() => onSave(form)} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Marquee Editor ───────────────────────────────────────────────────────────

function MarqueeEditor({ data, onSave, saving, saved }: { data: string[]; onSave: (d: unknown) => void; saving: boolean; saved: boolean }) {
  const [items, setItems] = useState<string[]>(data);

  return (
    <div className="space-y-6">
      <SectionHeader title="Marquee / Client Logos" description="Brand names or text that scroll horizontally across the page" />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item} onChange={(e) => { const n = [...items]; n[i] = e.target.value; setItems(n); }}
              className="bg-white/5 border-white/10 text-white" placeholder="Brand name" />
            <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              className="p-2 text-red-400/60 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, ""])}
          className="flex items-center gap-2 text-[#D9FC67]/70 hover:text-[#D9FC67] text-sm transition-colors mt-2">
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>
      <SaveButton onSave={() => onSave(items)} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Generic Array Editor ─────────────────────────────────────────────────────

function ArrayEditor({ title, description, data, fields, onSave, saving, saved }: {
  title: string; description: string;
  data: unknown[];
  fields: { key: string; label: string; multiline?: boolean }[];
  onSave: (d: unknown) => void;
  saving: boolean; saved: boolean;
}) {
  const [items, setItems] = useState<Record<string, string>[]>(data as Record<string, string>[]);

  const updateItem = (i: number, key: string, value: string) => {
    const n = items.map((item, idx) => idx === i ? { ...item, [key]: value } : item);
    setItems(n);
  };

  const addItem = () => {
    const empty: Record<string, string> = {};
    fields.forEach((f) => (empty[f.key] = ""));
    setItems([...items, empty]);
  };

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <SectionHeader title={title} description={description} />
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider">Item {i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-red-400/60 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {fields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.multiline ? (
                  <textarea value={item[f.key] || ""} onChange={(e) => updateItem(i, f.key, e.target.value)}
                    className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:outline-none resize-none text-sm" />
                ) : (
                  <Input value={item[f.key] || ""} onChange={(e) => updateItem(i, f.key, e.target.value)}
                    className="bg-white/5 border-white/10 text-white" />
                )}
              </Field>
            ))}
          </div>
        ))}
        <button type="button" onClick={addItem}
          className="flex items-center gap-2 text-[#D9FC67]/70 hover:text-[#D9FC67] text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add {title.toLowerCase().replace(/s$/, "")}
        </button>
      </div>
      <SaveButton onSave={() => onSave(items)} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Bundles Editor ───────────────────────────────────────────────────────────

function BundlesEditor({ data, onSave, saving, saved }: { data: unknown[]; onSave: (d: unknown) => void; saving: boolean; saved: boolean }) {
  const [items, setItems] = useState<Record<string, unknown>[]>(data as Record<string, unknown>[]);

  const update = (i: number, key: string, value: unknown) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  };

  const updateFeature = (i: number, fi: number, value: string) => {
    const features = [...((items[i].features as string[]) || [])];
    features[fi] = value;
    update(i, "features", features);
  };

  const addFeature = (i: number) => update(i, "features", [...((items[i].features as string[]) || []), ""]);
  const removeFeature = (i: number, fi: number) => update(i, "features", ((items[i].features as string[]) || []).filter((_: unknown, idx: number) => idx !== fi));

  return (
    <div className="space-y-6">
      <SectionHeader title="Pricing Bundles" description="Subscription/bundle packages shown on the landing page" />
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/40 text-xs uppercase tracking-wider">Bundle {i + 1}</span>
              <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400/60 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Name"><Input value={(item.name as string) || ""} onChange={(e) => update(i, "name", e.target.value)} className="bg-white/5 border-white/10 text-white" /></Field>
              <Field label="Price (e.g. ₹5,999)"><Input value={(item.price as string) || ""} onChange={(e) => update(i, "price", e.target.value)} className="bg-white/5 border-white/10 text-white" /></Field>
              <Field label="Billing (e.g. per month)"><Input value={(item.billing as string) || ""} onChange={(e) => update(i, "billing", e.target.value)} className="bg-white/5 border-white/10 text-white" /></Field>
            </div>
            <Field label="Description">
              <textarea value={(item.description as string) || ""} onChange={(e) => update(i, "description", e.target.value)}
                className="w-full h-16 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D9FC67] focus:outline-none resize-none text-sm" />
            </Field>
            <div>
              <label className="text-white/40 text-xs mb-2 block">Features</label>
              <div className="space-y-2">
                {((item.features as string[]) || []).map((f: string, fi: number) => (
                  <div key={fi} className="flex gap-2">
                    <Input value={f} onChange={(e) => updateFeature(i, fi, e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" />
                    <button type="button" onClick={() => removeFeature(i, fi)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addFeature(i)} className="text-[#D9FC67]/70 hover:text-[#D9FC67] text-xs flex items-center gap-1 mt-1">
                  <Plus className="w-3.5 h-3.5" /> Add feature
                </button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, { name: "", price: "", billing: "per month", description: "", features: [] }])}
          className="flex items-center gap-2 text-[#D9FC67]/70 hover:text-[#D9FC67] text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add bundle
        </button>
      </div>
      <SaveButton onSave={() => onSave(items)} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Footer Editor ────────────────────────────────────────────────────────────

function FooterEditor({ data, onSave, saving, saved }: { data: Record<string, unknown>; onSave: (d: unknown) => void; saving: boolean; saved: boolean }) {
  const [form, setForm] = useState({
    tagline: (data.tagline as string) || "",
    address: (data.address as string) || "",
    hours: (data.hours as string) || "",
    email: (data.email as string) || "",
    phone: (data.phone as string) || "",
    instagram_url: (data.instagram_url as string) || "",
    linkedin_url: (data.linkedin_url as string) || "",
    youtube_url: (data.youtube_url as string) || "",
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Footer" description="Footer contact info and social links" />
      <Field label="Tagline"><textarea value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="w-full h-16 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D9FC67] focus:outline-none resize-none text-sm" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-white/5 border-white/10 text-white" /></Field>
        <Field label="Hours"><Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="bg-white/5 border-white/10 text-white" /></Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white/5 border-white/10 text-white" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/5 border-white/10 text-white" /></Field>
        <Field label="Instagram URL"><Input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} className="bg-white/5 border-white/10 text-white" /></Field>
        <Field label="LinkedIn URL"><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} className="bg-white/5 border-white/10 text-white" /></Field>
        <Field label="YouTube URL"><Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} className="bg-white/5 border-white/10 text-white" /></Field>
      </div>
      <SaveButton onSave={() => onSave(form)} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Nav Editor ───────────────────────────────────────────────────────────────

function NavEditor({ data, onSave, saving, saved }: { data: Record<string, unknown>; onSave: (d: unknown) => void; saving: boolean; saved: boolean }) {
  const [logoText, setLogoText] = useState((data.logo_text as string) || "");
  const [links, setLinks] = useState<{ label: string; url: string }[]>((data.nav_links as { label: string; url: string }[]) || []);

  return (
    <div className="space-y-4">
      <SectionHeader title="Navigation" description="Site header logo text and navigation links" />
      <Field label="Logo Text">
        <Input value={logoText} onChange={(e) => setLogoText(e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </Field>
      <div>
        <label className="text-white/40 text-xs mb-3 block uppercase tracking-wider">Navigation Links</label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input value={link.label} onChange={(e) => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; setLinks(n); }}
                className="bg-white/5 border-white/10 text-white" placeholder="Label" />
              <Input value={link.url} onChange={(e) => { const n = [...links]; n[i] = { ...n[i], url: e.target.value }; setLinks(n); }}
                className="bg-white/5 border-white/10 text-white" placeholder="URL" />
              <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="text-red-400/60 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setLinks([...links, { label: "", url: "" }])}
            className="flex items-center gap-2 text-[#D9FC67]/70 hover:text-[#D9FC67] text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add link
          </button>
        </div>
      </div>
      <SaveButton onSave={() => onSave({ logo_text: logoText, nav_links: links })} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-2">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-white/40 text-sm">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-white/60 text-sm mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="pt-2 border-t border-white/5">
      <Button onClick={onSave} disabled={saving} className={cn("gap-2", saved ? "bg-green-500 hover:bg-green-600 text-white" : "bg-[#D9FC67] hover:bg-[#E8FF8A] text-black")}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </Button>
    </div>
  );
}

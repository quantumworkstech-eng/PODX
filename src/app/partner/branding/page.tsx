"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Eye, EyeOff, Trash2, Plus, Save, Globe, Sparkles,
  LayoutTemplate, ChevronRight, Loader2, CheckCircle, AlertCircle,
  Palette, Image as ImageIcon, Search, ExternalLink, X, Wand2,
  Monitor, Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionRenderer } from "@/components/landing-sections/SectionRenderer";
import {
  SECTION_LABELS, SECTION_DESCRIPTIONS, DEFAULT_SECTION_CONTENT,
  type LandingSection, type LandingPage, type SectionType, type SectionBranding,
  type LandingTemplate,
} from "@/types/landing";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/partner/FeatureGate";

// ── Types ──────────────────────────────────────────────────────────────────

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
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  website_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  partner_id?: string;
}

type PanelMode = "sections" | "appearance" | "seo";
type PreviewMode = "desktop" | "mobile";

const ALL_SECTION_TYPES: SectionType[] = [
  "hero", "studios", "features", "reviews", "about", "cta", "contact", "footer", "custom",
];

// ── Sortable Section Row ───────────────────────────────────────────────────

function SortableRow({
  section, isActive, impressionCount,
  onSelect, onToggleVisibility, onDelete,
}: {
  section: LandingSection;
  isActive: boolean;
  impressionCount: number;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
        isActive
          ? "bg-[#D9FC67]/10 border border-[#D9FC67]/30"
          : "border border-transparent hover:bg-white/5 hover:border-white/10"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="p-0.5 rounded text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isActive ? "text-[#D9FC67]" : "text-white/80")}>
          {SECTION_LABELS[section.type]}
        </p>
        {impressionCount > 0 && (
          <p className="text-xs text-white/30">{impressionCount.toLocaleString()} views</p>
        )}
      </div>

      {/* Visibility */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
        className="p-1 rounded text-white/30 hover:text-white/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title={section.is_visible ? "Hide" : "Show"}
      >
        {section.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 rounded text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Delete section"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Hidden indicator */}
      {!section.is_visible && (
        <EyeOff className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
      )}
    </div>
  );
}

// ── Section Editor Panel ───────────────────────────────────────────────────

function SectionEditor({
  section,
  onChange,
}: {
  section: LandingSection;
  onChange: (content: LandingSection["content_json"]) => void;
}) {
  const content = section.content_json as Record<string, unknown>;

  const field = (
    key: string,
    label: string,
    type: "text" | "textarea" | "url" | "select" | "number" | "color" = "text",
    options?: { value: string; label: string }[],
    placeholder?: string
  ) => (
    <div key={key} className="space-y-1.5">
      <label className="block text-xs font-medium text-white/60">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={(content[key] as string) || ""}
          onChange={(e) => onChange({ ...content, [key]: e.target.value })}
          placeholder={placeholder}
          rows={3}
          className={inputCls + " resize-none"}
        />
      ) : type === "select" && options ? (
        <select
          value={(content[key] as string) || ""}
          onChange={(e) => onChange({ ...content, [key]: e.target.value })}
          className={inputCls}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={(content[key] as string) || ""}
          onChange={(e) =>
            onChange({ ...content, [key]: type === "number" ? Number(e.target.value) : e.target.value })
          }
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </div>
  );

  const toggle = (key: string, label: string) => (
    <div key={key} className="flex items-center justify-between">
      <label className="text-xs font-medium text-white/60">{label}</label>
      <button
        onClick={() => onChange({ ...content, [key]: !content[key] })}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors",
          content[key] ? "bg-[#D9FC67]" : "bg-white/15"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
          content[key] ? "translate-x-4" : "translate-x-0"
        )} />
      </button>
    </div>
  );

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Hero Section</p>
          {field("heading", "Heading", "text", undefined, "Book Your Studio Session")}
          {field("subheading", "Subheading", "textarea", undefined, "Professional recording spaces...")}
          {field("cta_primary_text", "Primary CTA Text", "text", undefined, "Browse Studios")}
          {field("cta_primary_url", "Primary CTA URL", "url", undefined, "#studios")}
          {field("cta_secondary_text", "Secondary CTA Text", "text", undefined, "Get in Touch")}
          {field("cta_secondary_url", "Secondary CTA URL", "url", undefined, "#contact")}
          {field("background_image_url", "Background Image URL", "url", undefined, "https://...")}
          {field("background_video_url", "Background Video URL", "url", undefined, "https://...")}
          {field("overlay_opacity", "Overlay Opacity (0-100)", "number")}
        </div>
      );

    case "studios":
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Studios Section</p>
          {field("heading", "Heading", "text", undefined, "Our Studios")}
          {field("subheading", "Subheading", "text", undefined, "Professional spaces...")}
          {field("columns", "Columns", "select", [
            { value: "2", label: "2 Columns" },
            { value: "3", label: "3 Columns" },
            { value: "4", label: "4 Columns" },
          ])}
          {toggle("show_price", "Show Pricing")}
          {toggle("show_capacity", "Show Capacity")}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/40">
              Studios are automatically fetched from your account. Add studios in My Studios.
            </p>
          </div>
        </div>
      );

    case "features": {
      const items = (content.items as Array<{ icon?: string; title: string; description: string }>) || [];
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Features Section</p>
          {field("heading", "Heading", "text", undefined, "Everything You Need")}
          {field("subheading", "Subheading", "text", undefined, "World-class equipment...")}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-white/60">Feature Items</p>
              <button
                onClick={() => onChange({
                  ...content,
                  items: [...items, { icon: "Zap", title: "New Feature", description: "Description here" }],
                })}
                className="text-xs text-[#D9FC67] hover:text-[#E8FF8A] flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">Item {i + 1}</p>
                  <button
                    onClick={() => onChange({ ...content, items: items.filter((_, j) => j !== i) })}
                    className="text-red-400/60 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <input
                  value={item.icon || ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, icon: e.target.value };
                    onChange({ ...content, items: next });
                  }}
                  placeholder="Icon name (e.g. Mic, Camera)"
                  className={inputCls}
                />
                <input
                  value={item.title}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, title: e.target.value };
                    onChange({ ...content, items: next });
                  }}
                  placeholder="Title"
                  className={inputCls}
                />
                <input
                  value={item.description}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, description: e.target.value };
                    onChange({ ...content, items: next });
                  }}
                  placeholder="Description"
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "reviews":
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Reviews Section</p>
          {field("heading", "Heading", "text", undefined, "What Our Clients Say")}
          {field("subheading", "Subheading", "text", undefined, "Trusted by creators...")}
          {toggle("show_dynamic", "Auto-load reviews from your account")}
        </div>
      );

    case "about":
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">About Section</p>
          {field("heading", "Heading", "text", undefined, "About Us")}
          {field("description", "Description", "textarea", undefined, "Tell your story...")}
          {field("image_url", "Image URL", "url", undefined, "https://...")}
          {field("image_position", "Image Position", "select", [
            { value: "right", label: "Right" },
            { value: "left", label: "Left" },
          ])}
        </div>
      );

    case "cta":
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">CTA Banner</p>
          {field("heading", "Heading", "text", undefined, "Ready to Record?")}
          {field("subheading", "Subheading", "textarea", undefined, "Join hundreds of creators...")}
          {field("cta_text", "Button Text", "text", undefined, "Book a Studio Now")}
          {field("cta_url", "Button URL", "url", undefined, "#studios")}
          {field("background_style", "Background Style", "select", [
            { value: "gradient", label: "Gradient" },
            { value: "solid", label: "Solid Color" },
            { value: "image", label: "Background Image" },
          ])}
          {content.background_style === "image" && field("background_image_url", "Background Image URL", "url")}
        </div>
      );

    case "contact":
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Contact Section</p>
          {field("heading", "Heading", "text", undefined, "Get in Touch")}
          {field("subheading", "Subheading", "text", undefined, "We'd love to help...")}
          {toggle("show_email", "Show Email")}
          {toggle("show_phone", "Show Phone")}
          {toggle("show_address", "Show Address")}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/40">
              Contact details are pulled from White-Label Settings → Contact & Social.
            </p>
          </div>
        </div>
      );

    case "footer": {
      const navLinks = (content.nav_links as Array<{ label: string; url: string }>) || [];
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Footer</p>
          {field("tagline", "Tagline", "text", undefined, "Premium recording studios...")}
          {field("copyright_text", "Copyright Text", "text", undefined, `© ${new Date().getFullYear()} Your Brand`)}
          {toggle("show_social", "Show Social Links")}
          {toggle("show_nav", "Show Navigation Links")}
          {(content.show_nav !== false) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/60">Nav Links</p>
                <button
                  onClick={() => onChange({ ...content, nav_links: [...navLinks, { label: "Link", url: "#" }] })}
                  className="text-xs text-[#D9FC67] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {navLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const next = [...navLinks];
                      next[i] = { ...link, label: e.target.value };
                      onChange({ ...content, nav_links: next });
                    }}
                    placeholder="Label"
                    className={cn(inputCls, "flex-1")}
                  />
                  <input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...navLinks];
                      next[i] = { ...link, url: e.target.value };
                      onChange({ ...content, nav_links: next });
                    }}
                    placeholder="URL"
                    className={cn(inputCls, "flex-1")}
                  />
                  <button
                    onClick={() => onChange({ ...content, nav_links: navLinks.filter((_, j) => j !== i) })}
                    className="text-red-400/60 hover:text-red-400 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "custom": {
      type CustomBlockLocal = {
        id: string;
        type: "text" | "image" | "video" | "button";
        content: string;
        url?: string;
        align?: "left" | "center" | "right";
        size?: "sm" | "md" | "lg" | "xl";
      };
      const blocks = (content.blocks as CustomBlockLocal[]) || [];
      const newBlockId = () => Math.random().toString(36).slice(2);
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Custom Section</p>
          {field("heading", "Section Heading", "text", undefined, "Custom Section")}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-white/60">Content Blocks</p>
              <div className="flex gap-1.5">
                {(["text", "image", "video", "button"] as const).map((bt) => (
                  <button
                    key={bt}
                    onClick={() => onChange({
                      ...content,
                      blocks: [...blocks, { id: newBlockId(), type: bt, content: "", align: "left" as const, size: "md" as const }] as CustomBlockLocal[],
                    })}
                    className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white capitalize"
                  >
                    + {bt}
                  </button>
                ))}
              </div>
            </div>
            {blocks.map((block, i) => (
              <div key={block.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40 capitalize">{block.type} block</p>
                  <button
                    onClick={() => onChange({ ...content, blocks: blocks.filter((_, j) => j !== i) })}
                    className="text-red-400/60 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <textarea
                  value={block.content}
                  onChange={(e) => {
                    const next = [...blocks];
                    next[i] = { ...block, content: e.target.value };
                    onChange({ ...content, blocks: next });
                  }}
                  placeholder={block.type === "button" ? "Button label" : block.type === "image" ? "Caption" : "Content / caption"}
                  rows={2}
                  className={cn(inputCls, "resize-none")}
                />
                {(block.type === "image" || block.type === "video" || block.type === "button") && (
                  <input
                    value={block.url || ""}
                    onChange={(e) => {
                      const next = [...blocks];
                      next[i] = { ...block, url: e.target.value };
                      onChange({ ...content, blocks: next });
                    }}
                    placeholder={block.type === "button" ? "Button URL" : "Media URL"}
                    className={inputCls}
                  />
                )}
                <div className="flex gap-2">
                  <select
                    value={block.align || "left"}
                    onChange={(e) => {
                      const next = [...blocks];
                      next[i] = { ...block, align: e.target.value as "left" | "center" | "right" };
                      onChange({ ...content, blocks: next });
                    }}
                    className={cn(inputCls, "flex-1")}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  {block.type === "text" && (
                    <select
                      value={block.size || "md"}
                      onChange={(e) => {
                        const next = [...blocks];
                        next[i] = { ...block, size: e.target.value as "sm" | "md" | "lg" | "xl" };
                        onChange({ ...content, blocks: next });
                      }}
                      className={cn(inputCls, "flex-1")}
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">XL</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return <p className="text-white/40 text-sm">Select a section to edit it.</p>;
  }
}

// ── Main Builder Page ──────────────────────────────────────────────────────

export default function LandingBuilderPage() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [branding, setBranding] = useState<Branding>({});
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelMode>("sections");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [templates, setTemplates] = useState<LandingTemplate[]>([]);
  const [aiTone, setAiTone] = useState("professional");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [seoData, setSeoData] = useState({ meta_title: "", meta_description: "", og_image_url: "" });
  const [impressions, setImpressions] = useState<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load initial data ──────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch("/api/partner/branding").then((r) => r.json()),
      fetch("/api/partner/landing/sections").then((r) => r.json()),
      fetch("/api/partner/landing").then((r) => r.json()),
    ])
      .then(([brandingData, sectionsData, landingData]) => {
        if (brandingData.branding) setBranding(brandingData.branding);
        if (sectionsData.sections) setSections(sectionsData.sections);
        if (landingData.landingPage) {
          setLandingPage(landingData.landingPage);
          setSeoData({
            meta_title: landingData.landingPage.meta_title || "",
            meta_description: landingData.landingPage.meta_description || "",
            og_image_url: landingData.landingPage.og_image_url || "",
          });
        }
      })
      .catch(() => showToast("error", "Failed to load builder data"))
      .finally(() => setLoading(false));
  }, [showToast]);

  // Load templates once
  useEffect(() => {
    fetch("/api/partner/landing/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {});
  }, []);

  // Load analytics impressions
  useEffect(() => {
    fetch("/api/partner/landing/analytics")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.impressions) setImpressions(d.impressions as Record<string, number>);
      })
      .catch(() => {});
  }, []);

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? null;

  // ── Section CRUD ──────────────────────────────────────────────────────

  const addSection = async (type: SectionType) => {
    setShowAddSection(false);
    const res = await fetch("/api/partner/landing/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        content_json: DEFAULT_SECTION_CONTENT[type],
        order_index: sections.length,
      }),
    });
    const data = await res.json();
    if (!res.ok) return showToast("error", data.error || "Failed to add section");
    setSections((prev) => [...prev, data.section]);
    setActiveSectionId(data.section.id);
    showToast("success", `${SECTION_LABELS[type]} section added`);
  };

  const deleteSection = async (id: string) => {
    const res = await fetch(`/api/partner/landing/sections?id=${id}`, { method: "DELETE" });
    if (!res.ok) return showToast("error", "Failed to delete section");
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (activeSectionId === id) setActiveSectionId(null);
  };

  const toggleVisibility = async (section: LandingSection) => {
    const res = await fetch("/api/partner/landing/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, is_visible: !section.is_visible }),
    });
    const data = await res.json();
    if (!res.ok) return;
    setSections((prev) => prev.map((s) => (s.id === section.id ? data.section : s)));
  };

  const updateSectionContent = (id: string, content: LandingSection["content_json"]) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content_json: content } : s)));
  };

  // ── Drag & drop ────────────────────────────────────────────────────────

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      order_index: idx,
    }));
    setSections(reordered);

    await fetch("/api/partner/landing/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reorder: true,
        order: reordered.map((s) => ({ id: s.id, order_index: s.order_index })),
      }),
    });
  };

  // ── Save ───────────────────────────────────────────────────────────────

  const saveAll = async () => {
    setSaving(true);
    try {
      // Save each modified section
      await Promise.all(
        sections.map((s) =>
          fetch("/api/partner/landing/sections", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: s.id, content_json: s.content_json }),
          })
        )
      );
      // Save SEO data
      await fetch("/api/partner/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seoData),
      });
      showToast("success", "Changes saved");
    } catch {
      showToast("error", "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Publish ────────────────────────────────────────────────────────────

  const togglePublish = async () => {
    setPublishing(true);
    const newStatus = landingPage?.status === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/partner/landing/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLandingPage(data.landingPage);
      showToast("success", newStatus === "published" ? "Landing page published!" : "Reverted to draft");
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setPublishing(false);
    }
  };

  // ── Apply template ─────────────────────────────────────────────────────

  const applyTemplate = async (template: LandingTemplate) => {
    setShowTemplates(false);
    const res = await fetch("/api/partner/landing/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replace: true, sections: template.sections }),
    });
    const data = await res.json();
    if (!res.ok) return showToast("error", "Failed to apply template");
    setSections(data.sections || []);
    setActiveSectionId(null);
    showToast("success", `Template "${template.name}" applied!`);
  };

  // ── AI Generate ────────────────────────────────────────────────────────

  const generateWithAI = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/partner/landing/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: branding.brand_name || "My Studio",
          tagline: branding.tagline || "",
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Insert AI sections
      const saveRes = await fetch("/api/partner/landing/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace: true, sections: data.sections }),
      });
      const saveData = await saveRes.json();
      setSections(saveData.sections || []);
      setShowAI(false);
      showToast("success", "AI landing page generated!");
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  };

  // ── Branding save ──────────────────────────────────────────────────────

  const saveBranding = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/partner/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBranding(data.branding);
      showToast("success", "Appearance saved");
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────

  const sectionBranding: SectionBranding = {
    brand_name: branding.brand_name || "My Studio",
    partner_slug: branding.partner_slug || "",
    logo_url: branding.logo_url ?? undefined,
    tagline: branding.tagline,
    primary_color: branding.primary_color || "#D9FC67",
    secondary_color: branding.secondary_color || "#0a0a0a",
    background_color: branding.background_color || "#09090b",
    text_color: branding.text_color || "#ffffff",
    button_text_color: branding.button_text_color || "#000000",
    font_family: branding.font_family,
    contact_email: branding.contact_email,
    contact_phone: branding.contact_phone,
    contact_address: branding.contact_address,
    website_url: branding.website_url,
    instagram_url: branding.instagram_url,
    twitter_url: branding.twitter_url,
    linkedin_url: branding.linkedin_url,
    youtube_url: branding.youtube_url,
    partner_id: branding.partner_id || "",
  };

  const previewUrl = branding.partner_slug ? `/p/${branding.partner_slug}` : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <FeatureGate featureKey="landing_builder">
    <div className="flex flex-col h-[calc(100vh-73px)] -m-6 overflow-hidden">

      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-white/5 flex-shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Panel toggles */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
            {([
              { id: "sections", icon: LayoutTemplate, label: "Sections" },
              { id: "appearance", icon: Palette, label: "Appearance" },
              { id: "seo", icon: Search, label: "SEO" },
            ] as { id: PanelMode; icon: typeof Palette; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setPanel(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  panel === t.id ? "bg-[#D9FC67] text-black" : "text-white/50 hover:text-white"
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Preview mode */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={cn("p-1.5 rounded-lg transition-all", previewMode === "desktop" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60")}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={cn("p-1.5 rounded-lg transition-all", previewMode === "mobile" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60")}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Templates */}
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs font-medium transition-all"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            Templates
          </button>

          {/* AI Generate */}
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-medium border border-purple-500/20 transition-all"
          >
            <Wand2 className="w-3.5 h-3.5" />
            AI Generate
          </button>

          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs font-medium transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </a>
          )}

          <Button
            onClick={saveAll}
            disabled={saving}
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save Draft
          </Button>

          <Button
            onClick={togglePublish}
            disabled={publishing}
            size="sm"
            className={cn(
              "text-xs font-semibold",
              landingPage?.status === "published"
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                : "bg-[#D9FC67] hover:bg-[#E8FF8A] text-black"
            )}
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Globe className="w-3.5 h-3.5 mr-1" />}
            {landingPage?.status === "published" ? "Published" : "Publish"}
          </Button>
        </div>
      </div>

      {/* ── 3-Panel Layout ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL — Sections / Appearance / SEO */}
        <aside className="w-64 flex-shrink-0 bg-[#0a0a0a] border-r border-white/5 flex flex-col overflow-hidden">
          {panel === "sections" && (
            <>
              <div className="p-3 border-b border-white/5">
                <button
                  onClick={() => setShowAddSection(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#D9FC67]/10 text-[#D9FC67] hover:bg-[#D9FC67]/20 text-sm font-medium transition-all border border-[#D9FC67]/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sections.length === 0 ? (
                  <div className="text-center py-12">
                    <LayoutTemplate className="w-8 h-8 mx-auto mb-3 text-white/20" />
                    <p className="text-sm text-white/40 mb-2">No sections yet</p>
                    <p className="text-xs text-white/25">Add sections or apply a template</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sections.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sections.map((section) => (
                        <SortableRow
                          key={section.id}
                          section={section}
                          isActive={activeSectionId === section.id}
                          impressionCount={impressions[section.id] || 0}
                          onSelect={() => {
                            setActiveSectionId(section.id);
                            setPanel("sections");
                          }}
                          onToggleVisibility={() => toggleVisibility(section)}
                          onDelete={() => deleteSection(section.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </>
          )}

          {panel === "appearance" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Appearance</p>

              {/* Logo */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Logo URL</label>
                <input
                  value={branding.logo_url || ""}
                  onChange={(e) => setBranding((b) => ({ ...b, logo_url: e.target.value }))}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>

              {/* Brand name */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Brand Name</label>
                <input
                  value={branding.brand_name || ""}
                  onChange={(e) => setBranding((b) => ({ ...b, brand_name: e.target.value }))}
                  placeholder="My Studio"
                  className={inputCls}
                />
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Colors</p>
                {([
                  { key: "primary_color", label: "Primary / Accent" },
                  { key: "secondary_color", label: "Secondary / Header" },
                  { key: "background_color", label: "Background" },
                  { key: "text_color", label: "Body Text" },
                  { key: "button_text_color", label: "Button Text" },
                ] as { key: keyof Branding; label: string }[]).map(({ key, label }) => (
                  <div key={String(key)} className="space-y-1">
                    <label className="text-xs text-white/50">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(branding[key] as string) || "#ffffff"}
                        onChange={(e) => setBranding((b) => ({ ...b, [key]: e.target.value }))}
                        className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"
                      />
                      <input
                        value={(branding[key] as string) || ""}
                        onChange={(e) => setBranding((b) => ({ ...b, [key]: e.target.value }))}
                        placeholder="#000000"
                        className={cn(inputCls, "flex-1 text-xs")}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Font */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Font Family</label>
                <select
                  value={branding.font_family || "Inter"}
                  onChange={(e) => setBranding((b) => ({ ...b, font_family: e.target.value }))}
                  className={inputCls}
                >
                  {["Inter", "Poppins", "Roboto", "Montserrat", "Raleway", "Nunito", "Open Sans", "Lato"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Color preview */}
              <div className="rounded-xl overflow-hidden border border-white/10">
                <div
                  className="p-4 text-center"
                  style={{ background: branding.background_color || "#09090b", color: branding.text_color || "#fff" }}
                >
                  <p className="text-sm font-bold mb-2">{branding.brand_name || "Your Brand"}</p>
                  <button
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: branding.primary_color || "#D9FC67", color: branding.button_text_color || "#000" }}
                  >
                    Book Now
                  </button>
                </div>
              </div>

              <Button
                onClick={saveBranding}
                disabled={saving}
                className="w-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Appearance
              </Button>
            </div>
          )}

          {panel === "seo" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">SEO & Metadata</p>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Meta Title</label>
                <input
                  value={seoData.meta_title}
                  onChange={(e) => setSeoData((s) => ({ ...s, meta_title: e.target.value }))}
                  placeholder={`${branding.brand_name || "Studio"} – Book a Session`}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Meta Description</label>
                <textarea
                  value={seoData.meta_description}
                  onChange={(e) => setSeoData((s) => ({ ...s, meta_description: e.target.value }))}
                  placeholder="Book professional recording studios..."
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
                <p className="text-xs text-white/30">{seoData.meta_description.length}/160</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> OG Image URL
                </label>
                <input
                  value={seoData.og_image_url}
                  onChange={(e) => setSeoData((s) => ({ ...s, og_image_url: e.target.value }))}
                  placeholder="https://... (1200×630px)"
                  className={inputCls}
                />
              </div>
              <Button
                onClick={saveAll}
                disabled={saving}
                className="w-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save SEO
              </Button>
            </div>
          )}
        </aside>

        {/* CENTER — Live Preview */}
        <main className="flex-1 overflow-y-auto bg-[#0d0d0d]">
          <div
            className={cn(
              "transition-all duration-300 mx-auto",
              previewMode === "mobile" ? "max-w-sm" : "max-w-none"
            )}
            style={{
              color: sectionBranding.text_color,
              background: sectionBranding.background_color,
              minHeight: "100%",
            }}
          >
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <LayoutTemplate className="w-16 h-16 text-white/10 mb-6" />
                <h2 className="text-2xl font-bold text-white/30 mb-3">Your page is empty</h2>
                <p className="text-white/20 mb-8 max-w-sm">
                  Start by adding sections from the left panel, applying a template, or generating with AI.
                </p>
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => setShowAddSection(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D9FC67]/10 text-[#D9FC67] border border-[#D9FC67]/20 hover:bg-[#D9FC67]/20 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Section
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all text-sm font-medium"
                  >
                    <LayoutTemplate className="w-4 h-4" /> Use Template
                  </button>
                </div>
              </div>
            ) : (
              sections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => { setActiveSectionId(section.id); setPanel("sections"); }}
                  className={cn(
                    "relative cursor-pointer transition-all",
                    !section.is_visible && "opacity-40",
                    activeSectionId === section.id && "ring-2 ring-inset ring-[#D9FC67]/40"
                  )}
                >
                  {activeSectionId === section.id && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-[#D9FC67] text-black text-xs font-semibold rounded-full">
                      <Sparkles className="w-3 h-3" />
                      {SECTION_LABELS[section.type]}
                    </div>
                  )}
                  {!section.is_visible && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-black/60 text-white/50 text-xs rounded-full">
                      <EyeOff className="w-3 h-3" /> Hidden
                    </div>
                  )}
                  <SectionRenderer
                    section={section}
                    branding={sectionBranding}
                    studios={[]}
                    isPreview
                  />
                </div>
              ))
            )}
          </div>
        </main>

        {/* RIGHT PANEL — Section Editor */}
        <aside className="w-72 flex-shrink-0 bg-[#0a0a0a] border-l border-white/5 overflow-y-auto">
          {activeSection ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{SECTION_LABELS[activeSection.type]}</h3>
                <button
                  onClick={() => setActiveSectionId(null)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/30">{SECTION_DESCRIPTIONS[activeSection.type]}</p>
              <div className="h-px bg-white/5" />
              <SectionEditor
                section={activeSection}
                onChange={(content) => updateSectionContent(activeSection.id, content)}
              />
              <div className="h-px bg-white/5 mt-4" />
              <div className="flex gap-2">
                <button
                  onClick={() => toggleVisibility(activeSection)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-xs transition-all"
                >
                  {activeSection.is_visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {activeSection.is_visible ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => { deleteSection(activeSection.id); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center py-16">
              <ChevronRight className="w-8 h-8 text-white/10 mb-4 -rotate-90" />
              <p className="text-sm text-white/30">Select a section in the preview to edit its content</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl z-50 transition-all",
            toast.type === "success"
              ? "bg-[#D9FC67] text-black"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          )}
        >
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Add Section Modal ─────────────────────────────────────── */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">Add Section</h2>
              <button onClick={() => setShowAddSection(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {ALL_SECTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="flex flex-col items-start p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-left transition-all"
                >
                  <p className="text-sm font-semibold text-white mb-1">{SECTION_LABELS[type]}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{SECTION_DESCRIPTIONS[type]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Templates Modal ───────────────────────────────────────── */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h2 className="text-base font-semibold text-white">Choose a Template</h2>
                <p className="text-xs text-white/40 mt-0.5">Applying a template will replace all current sections</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="flex flex-col p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D9FC67]/30 text-left transition-all group"
                >
                  <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center"
                    style={{ background: "rgba(217,252,103,0.05)", border: "1px solid rgba(217,252,103,0.1)" }}>
                    <LayoutTemplate className="w-8 h-8 text-[#D9FC67]/30 group-hover:text-[#D9FC67]/60 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">{tpl.name}</p>
                  <p className="text-xs text-white/40">{tpl.description}</p>
                  <p className="text-xs text-[#D9FC67]/60 mt-2">{tpl.sections.length} sections</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Generate Modal ─────────────────────────────────────── */}
      {showAI && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Landing Page Generator
                </h2>
                <p className="text-xs text-white/40 mt-0.5">Generates a complete landing page using AI</p>
              </div>
              <button onClick={() => setShowAI(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-xs font-medium text-white/60">Generating for:</p>
                <p className="text-sm text-white font-semibold">{branding.brand_name || "Your Studio"}</p>
                {branding.tagline && <p className="text-xs text-white/40">{branding.tagline}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60">Tone & Style</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className={inputCls}
                >
                  <option value="professional">Professional</option>
                  <option value="creative">Creative & Bold</option>
                  <option value="friendly">Friendly & Approachable</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="luxury">Luxury & Premium</option>
                </select>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <p className="text-xs text-yellow-400/80">
                  This will replace all existing sections. You can undo by re-applying a template.
                  Requires OPENAI_API_KEY to be configured.
                </p>
              </div>
              <Button
                onClick={generateWithAI}
                disabled={aiGenerating}
                className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#D9FC67]/50 focus:ring-1 focus:ring-[#D9FC67]/20 transition-colors";

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Eye, Globe, Loader2, Plus, Search, Settings2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";
import { cmsFetch, del, patch, post } from "./api";
import { CmsIcon } from "@/components/cms/CmsIcon";
import { sectionTypesForPage } from "@/lib/cms/section-types";
import type { CmsPage, CmsSection } from "@/lib/cms/types";

interface Props {
  slug: string;
  title: string;
  path: string;
}

export function PageBuilder({ slug, title, path }: Props) {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishIssues, setPublishIssues] = useState<{ name: string; message: string }[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const notify = useCallback((kind: "error" | "success", message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const fetchPage = useCallback(
    () => cmsFetch<{ page: CmsPage; sections: CmsSection[] }>(`/api/admin/cms/pages/${slug}`),
    [slug],
  );

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof fetchPage>>) => {
      if (!result.ok || !result.data) notify("error", result.error ?? "Could not load this page");
      else {
        setPage(result.data.page);
        setSections(result.data.sections);
      }
      setLoading(false);
    },
    [notify],
  );

  const load = useCallback(async () => apply(await fetchPage()), [apply, fetchPage]);

  useEffect(() => {
    fetchPage().then(apply);
  }, [fetchPage, apply]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const next = arrayMove(sections, oldIndex, newIndex);
    setSections(next);

    const result = await patch("/api/admin/cms/sections", { slug, order: next.map((s) => s.id) });
    if (!result.ok) {
      notify("error", result.error ?? "Could not save the new order");
      await load();
    } else {
      await load();
    }
  };

  const addSection = async (type: string) => {
    setShowAdd(false);
    const result = await post<{ section: CmsSection }>("/api/admin/cms/sections", { slug, type });
    if (!result.ok) return notify("error", result.error ?? "Could not add the section");
    await load();
    if (result.data?.section) setExpanded(result.data.section.id);
    notify("success", "Section added — fill it in and save.");
  };

  const publish = async () => {
    setPublishing(true);
    setPublishIssues([]);
    const result = await post<{ version: number; sectionErrors?: { name: string; message: string }[] }>(
      `/api/admin/cms/pages/${slug}/publish`,
    );
    setPublishing(false);

    if (!result.ok) {
      const issues = (result.data as { sectionErrors?: { name: string; message: string }[] })?.sectionErrors;
      if (issues?.length) setPublishIssues(issues);
      return notify("error", result.error ?? "Could not publish");
    }

    await load();
    notify("success", `Published — version ${result.data?.version} is now live at ${path}`);
  };

  const unpublish = async () => {
    const result = await del(`/api/admin/cms/pages/${slug}/publish`);
    if (!result.ok) return notify("error", result.error ?? "Could not unpublish");
    await load();
    notify("success", "Page unpublished — the built-in page is showing again.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hiddenCount = sections.filter((s) => !s.is_visible).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/admin/landing"
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-2 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Landing Pages
            </Link>
            <h2 className="text-white text-xl font-semibold">{title}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              <StatusPill page={page} />
              <span className="text-white/30">
                {sections.length} sections{hiddenCount > 0 && ` · ${hiddenCount} hidden`}
              </span>
              <span className="text-white/30">{path}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSeo(true)}
              className="inline-flex items-center gap-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Settings2 className="w-4 h-4" /> SEO
            </button>
            <Link href={`/preview/${slug}`} target="_blank">
              <span className="inline-flex items-center gap-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl text-sm transition-colors">
                <Eye className="w-4 h-4" /> Preview
                <ExternalLink className="w-3 h-3" />
              </span>
            </Link>
            {page?.status === "published" && (
              <Link href={path} target="_blank">
                <span className="inline-flex items-center gap-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl text-sm transition-colors">
                  <Globe className="w-4 h-4" /> View live
                </span>
              </Link>
            )}
            <button
              onClick={publish}
              disabled={publishing}
              className="inline-flex items-center gap-2 bg-[#D9FC67] text-black hover:bg-[#E8FF8A] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {page?.status === "published" ? "Publish changes" : "Publish"}
            </button>
          </div>
        </div>

        <p className="text-white/30 text-xs mt-4">
          Edits save to the draft as you go. The public page only changes when you publish.
          {page?.status === "published" && (
            <button onClick={unpublish} className="ml-2 text-white/40 hover:text-white underline">
              Unpublish
            </button>
          )}
        </p>

        {publishIssues.length > 0 && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-300 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Fix these before publishing
            </p>
            <ul className="mt-2 space-y-1">
              {publishIssues.map((issue, i) => (
                <li key={i} className="text-red-300/80 text-xs">
                  <span className="font-medium">{issue.name}</span> — {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                total={sections.length}
                expanded={expanded === section.id}
                onToggleExpand={() => setExpanded(expanded === section.id ? null : section.id)}
                onChanged={load}
                onConfirmDelete={(message, onConfirm) => setConfirm({ message, onConfirm })}
                onError={(message) => notify("error", message)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="bg-[#141414] border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/50 text-sm">This page has no sections yet.</p>
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-white/15 hover:border-[#D9FC67]/40 text-white/50 hover:text-[#D9FC67] rounded-2xl py-4 text-sm transition-colors"
      >
        <Plus className="w-4 h-4" /> Add section
      </button>

      {showAdd && <AddSectionModal slug={slug} onClose={() => setShowAdd(false)} onSelect={addSection} />}
      {showSeo && page && (
        <SeoModal
          slug={slug}
          page={page}
          onClose={() => setShowSeo(false)}
          onSaved={async () => {
            await load();
            notify("success", "SEO settings saved");
          }}
          onError={(message) => notify("error", message)}
        />
      )}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            confirm.onConfirm();
            setConfirm(null);
          }}
        />
      )}

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl border text-sm shadow-lg",
            toast.kind === "error"
              ? "bg-red-500/15 border-red-500/30 text-red-200"
              : "bg-[#D9FC67]/15 border-[#D9FC67]/30 text-[#D9FC67]",
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function StatusPill({ page }: { page: CmsPage | null }) {
  if (!page) return null;

  if (page.status !== "published") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
        Draft — not live
      </span>
    );
  }

  if (page.has_unpublished_changes) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#D9FC67] bg-[#D9FC67]/10 border border-[#D9FC67]/25 rounded-full px-2.5 py-1">
        Published · unpublished changes
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-green-300 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1">
      Published · up to date
    </span>
  );
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-8">
      <div
        className={cn(
          "bg-[#141414] border border-white/10 rounded-2xl w-full my-auto",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <button
          onClick={onClose}
          className="float-right m-4 text-white/40 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function AddSectionModal({
  slug,
  onClose,
  onSelect,
}: {
  slug: string;
  onClose: () => void;
  onSelect: (type: string) => void;
}) {
  const [query, setQuery] = useState("");
  const types = sectionTypesForPage(slug).filter(
    (t) =>
      !query ||
      t.label.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Modal onClose={onClose} wide>
      <div className="p-6">
        <h3 className="text-white text-lg font-semibold mb-1">Add a section</h3>
        <p className="text-white/40 text-sm mb-4">
          Sections are added at the bottom of the page — drag them wherever you need.
        </p>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search section types"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:border-[#D9FC67] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {types.map((type) => (
            <button
              key={type.type}
              onClick={() => onSelect(type.type)}
              className="text-left bg-white/[0.03] border border-white/5 hover:border-[#D9FC67]/30 hover:bg-[#D9FC67]/[0.04] rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-8 h-8 rounded-lg bg-[#D9FC67]/10 flex items-center justify-center text-[#D9FC67]">
                  <CmsIcon name={type.icon.toLowerCase()} className="w-4 h-4" />
                </span>
                <p className="text-white text-sm font-medium">{type.label}</p>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">{type.description}</p>
            </button>
          ))}
          {types.length === 0 && <p className="text-white/40 text-sm">No section types match that search.</p>}
        </div>
      </div>
    </Modal>
  );
}

const SEO_FIELDS: { key: keyof CmsPage; label: string; help?: string; long?: boolean }[] = [
  { key: "title", label: "Page title (admin)" },
  { key: "seo_title", label: "SEO title", help: "Shown in search results — around 60 characters" },
  { key: "meta_description", label: "Meta description", long: true, help: "Around 155 characters" },
  { key: "og_title", label: "Open Graph title" },
  { key: "og_description", label: "Open Graph description", long: true },
  { key: "og_image_url", label: "Open Graph image URL" },
  { key: "canonical_url", label: "Canonical URL" },
];

function SeoModal({
  slug,
  page,
  onClose,
  onSaved,
  onError,
}: {
  slug: string;
  page: CmsPage;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(SEO_FIELDS.map((f) => [f.key, String(page[f.key] ?? "")])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setErrors({});
    const result = await patch(`/api/admin/cms/pages/${slug}`, form);
    setSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      return onError(result.error ?? "Could not save SEO settings");
    }

    await onSaved();
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h3 className="text-white text-lg font-semibold mb-1">Page settings & SEO</h3>
        <p className="text-white/40 text-sm mb-5">Used for search engines and link previews.</p>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {SEO_FIELDS.map((field) => (
            <div key={String(field.key)}>
              <label className="text-white/60 text-sm mb-1.5 block">{field.label}</label>
              {field.long ? (
                <textarea
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#D9FC67] focus:outline-none resize-none"
                />
              ) : (
                <input
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#D9FC67] focus:outline-none"
                />
              )}
              {errors[field.key] ? (
                <p className="text-red-400 text-xs mt-1.5">{errors[field.key]}</p>
              ) : (
                field.help && <p className="text-white/30 text-xs mt-1.5">{field.help}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#D9FC67] text-black hover:bg-[#E8FF8A] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save settings
          </button>
          <button onClick={onClose} className="text-white/50 hover:text-white text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({
  message,
  onCancel,
  onConfirm,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6">
        <div className="flex items-start gap-3 mb-5">
          <span className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </span>
          <div>
            <h3 className="text-white font-semibold mb-1">Are you sure?</h3>
            <p className="text-white/50 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Delete
          </button>
          <button onClick={onCancel} className="text-white/50 hover:text-white text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

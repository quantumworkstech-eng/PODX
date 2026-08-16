"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown, Copy, Eye, EyeOff, GripVertical, Loader2, MoveDown, MoveUp, Save, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldInput } from "./FieldInput";
import { IconAction, ItemGroupEditor } from "./ItemGroupEditor";
import { del, patch, post } from "./api";
import { getSectionType } from "@/lib/cms/section-types";
import type { CmsSection, SectionSettings } from "@/lib/cms/types";

const SETTING_OPTIONS: Record<string, { label: string; options: { value: string; label: string }[] }> = {
  alignment: {
    label: "Alignment",
    options: [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ],
  },
  image_position: {
    label: "Image position",
    options: [
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
      { value: "top", label: "Top" },
      { value: "bottom", label: "Bottom" },
    ],
  },
  width: {
    label: "Content width",
    options: [
      { value: "narrow", label: "Narrow" },
      { value: "medium", label: "Medium" },
      { value: "wide", label: "Wide" },
      { value: "full", label: "Full width" },
    ],
  },
  spacing: {
    label: "Spacing",
    options: [
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" },
      { value: "large", label: "Large" },
    ],
  },
  background: {
    label: "Background",
    options: [
      { value: "default", label: "Default" },
      { value: "muted", label: "Muted" },
      { value: "dark", label: "Dark" },
      { value: "accent", label: "Accent tint" },
      { value: "image", label: "Image" },
    ],
  },
  columns: {
    label: "Columns",
    options: [
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
    ],
  },
};

interface Props {
  section: CmsSection;
  index: number;
  total: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onChanged: () => Promise<void> | void;
  onConfirmDelete: (message: string, onConfirm: () => void) => void;
  onError: (message: string) => void;
}

export function SectionCard({
  section, index, total, expanded, onToggleExpand, onChanged, onConfirmDelete, onError,
}: Props) {
  const def = getSectionType(section.type);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const [name, setName] = useState(section.name);
  const [content, setContent] = useState<Record<string, unknown>>(section.content ?? {});
  const [settings, setSettings] = useState<SectionSettings>(section.settings ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-sync the form when the section is reloaded from the server (save, duplicate,
  // reorder). Adjusting state during render keeps the card mounted, so open item
  // rows stay open.
  const [stamp, setStamp] = useState(section.updated_at);
  if (stamp !== section.updated_at) {
    setStamp(section.updated_at);
    setName(section.name);
    setContent(section.content ?? {});
    setSettings(section.settings ?? {});
  }

  const dirty =
    name !== section.name ||
    JSON.stringify(content) !== JSON.stringify(section.content ?? {}) ||
    JSON.stringify(settings) !== JSON.stringify(section.settings ?? {});

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.ok) onError(result.error ?? "Something went wrong");
    else await onChanged();
    return result.ok;
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    const result = await patch(`/api/admin/cms/sections/${section.id}`, { name, content, settings });
    setSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      onError(result.error ?? "Could not save this section");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    await onChanged();
  };

  const supports = def?.supports ?? [];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-[#141414] border rounded-2xl overflow-hidden transition-colors",
        isDragging ? "border-[#D9FC67]/40 opacity-70" : "border-white/5",
        !section.is_visible && "opacity-60",
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 p-4">
        <button
          {...attributes}
          {...listeners}
          className="text-white/25 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder section"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleExpand}
          className="flex-1 min-w-[55%] flex items-center gap-3 text-left"
        >
          <ChevronDown className={cn("w-4 h-4 text-white/30 transition-transform flex-shrink-0", expanded && "rotate-180")} />
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{section.name}</p>
            <p className="text-white/30 text-xs">{def?.label ?? section.type}</p>
          </div>
          {!section.is_visible && (
            <span className="text-[10px] uppercase tracking-wider text-white/40 border border-white/10 rounded px-2 py-0.5">
              Hidden
            </span>
          )}
          {dirty && (
            <span className="text-[10px] uppercase tracking-wider text-[#D9FC67] border border-[#D9FC67]/30 rounded px-2 py-0.5">
              Unsaved
            </span>
          )}
        </button>

        <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
          {busy && <Loader2 className="w-4 h-4 text-white/40 animate-spin mr-1" />}
          <IconAction
            label={section.is_visible ? "Hide section" : "Show section"}
            onClick={() => run(() => patch(`/api/admin/cms/sections/${section.id}`, { is_visible: !section.is_visible }))}
          >
            {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </IconAction>
          <IconAction
            label="Duplicate section"
            onClick={() => run(() => post(`/api/admin/cms/sections/${section.id}/duplicate`))}
          >
            <Copy className="w-4 h-4" />
          </IconAction>
          <IconAction
            label="Move up"
            disabled={index === 0}
            onClick={() => run(() => post(`/api/admin/cms/sections/${section.id}/move`, { direction: "up" }))}
          >
            <MoveUp className="w-4 h-4" />
          </IconAction>
          <IconAction
            label="Move down"
            disabled={index === total - 1}
            onClick={() => run(() => post(`/api/admin/cms/sections/${section.id}/move`, { direction: "down" }))}
          >
            <MoveDown className="w-4 h-4" />
          </IconAction>
          <IconAction
            label="Delete section"
            danger
            onClick={() =>
              onConfirmDelete(
                `Delete "${section.name}"? This will also delete all content inside this section.`,
                () => {
                  void run(() => del(`/api/admin/cms/sections/${section.id}`));
                },
              )
            }
          >
            <Trash2 className="w-4 h-4" />
          </IconAction>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          {!def && (
            <p className="text-amber-400/80 text-sm mt-4">
              This section uses an unrecognised type ({section.type}) and cannot be edited here.
            </p>
          )}

          {def && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="sm:col-span-2">
                  <label className="text-white/60 text-sm mb-1.5 block">
                    Section name <span className="text-white/30">(admin only)</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#D9FC67] focus:outline-none"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
                </div>

                {def.fields.map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={content[field.key]}
                    record={content}
                    error={errors[field.key]}
                    onChange={(key, value) => setContent((prev) => ({ ...prev, [key]: value }))}
                  />
                ))}
              </div>

              {supports.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/5">
                  <h4 className="text-white text-sm font-semibold mb-3">Layout</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {supports
                      .filter((key) => SETTING_OPTIONS[key])
                      .map((key) => {
                        const config = SETTING_OPTIONS[key];
                        const current = String((settings as Record<string, unknown>)[key] ?? "");
                        return (
                          <div key={key}>
                            <label className="text-white/50 text-xs mb-1.5 block">{config.label}</label>
                            <select
                              value={current}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  [key]: key === "columns" ? Number(e.target.value) : e.target.value,
                                }))
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-10 text-white text-sm focus:border-[#D9FC67] focus:outline-none"
                            >
                              <option value="" className="bg-[#141414]">
                                Default
                              </option>
                              {config.options.map((option) => (
                                <option key={option.value} value={option.value} className="bg-[#141414]">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                  </div>

                  {settings.background === "image" && (
                    <div className="mt-4 max-w-lg">
                      <FieldInput
                        field={{ key: "background_image_url", label: "Background image", type: "image" }}
                        value={settings.background_image_url}
                        record={settings as Record<string, unknown>}
                        onChange={(key, value) => setSettings((prev) => ({ ...prev, [key]: value }))}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={save}
                  disabled={saving || !dirty}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40",
                    saved ? "bg-green-500 text-white" : "bg-[#D9FC67] text-black hover:bg-[#E8FF8A]",
                  )}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : saved ? "Saved" : "Save section"}
                </button>
                {dirty && !saving && <span className="text-white/30 text-xs">Unsaved changes</span>}
              </div>

              {(def.groups ?? []).map((group) => (
                <ItemGroupEditor
                  key={group.key}
                  sectionId={section.id}
                  group={group}
                  items={section.items?.[group.key] ?? []}
                  onChanged={onChanged}
                  onConfirmDelete={onConfirmDelete}
                  onError={onError}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

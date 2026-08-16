"use client";

import { useState } from "react";
import {
  DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown, Copy, Eye, EyeOff, GripVertical, Loader2, MoveDown, MoveUp, Plus, Save, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldInput } from "./FieldInput";
import { del, patch, post } from "./api";
import type { CmsSectionItem, ItemGroupDef } from "@/lib/cms/types";

interface Props {
  sectionId: string;
  group: ItemGroupDef;
  items: CmsSectionItem[];
  onChanged: () => Promise<void> | void;
  onConfirmDelete: (message: string, onConfirm: () => void) => void;
  onError: (message: string) => void;
}

export function ItemGroupEditor({ sectionId, group, items, onChanged, onConfirmDelete, onError }: Props) {
  const [order, setOrder] = useState<CmsSectionItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const list = order ?? items;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.ok) onError(result.error ?? "Something went wrong");
    else await onChanged();
    setOrder(null);
    return result.ok;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((i) => i.id === active.id);
    const newIndex = list.findIndex((i) => i.id === over.id);
    const next = arrayMove(list, oldIndex, newIndex);
    setOrder(next);

    await run(() =>
      patch("/api/admin/cms/items", {
        section_id: sectionId,
        group_key: group.key,
        order: next.map((i) => i.id),
      }),
    );
  };

  const atLimit = group.max !== undefined && list.length >= group.max;

  return (
    <div className="border-t border-white/5 pt-5 mt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-white text-sm font-semibold">{group.label}</h4>
          <p className="text-white/30 text-xs">
            {list.length} {list.length === 1 ? "item" : "items"}
            {list.some((i) => !i.is_visible) && ` · ${list.filter((i) => !i.is_visible).length} hidden`}
          </p>
        </div>
        {busy && <Loader2 className="w-4 h-4 text-white/40 animate-spin" />}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {list.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                total={list.length}
                group={group}
                onSave={(data) => run(() => patch(`/api/admin/cms/items/${item.id}`, { data }))}
                onToggle={() =>
                  run(() => patch(`/api/admin/cms/items/${item.id}`, { is_visible: !item.is_visible }))
                }
                onDuplicate={() => run(() => post(`/api/admin/cms/items/${item.id}/duplicate`))}
                onMove={(direction) => run(() => post(`/api/admin/cms/items/${item.id}/move`, { direction }))}
                onDelete={() =>
                  onConfirmDelete(`Delete this ${group.itemLabel}? This cannot be undone.`, () => {
                    void run(() => del(`/api/admin/cms/items/${item.id}`));
                  })
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        disabled={busy || atLimit}
        onClick={() =>
          run(() => post("/api/admin/cms/items", { section_id: sectionId, group_key: group.key }))
        }
        className="flex items-center gap-2 text-[#D9FC67]/70 hover:text-[#D9FC67] text-sm transition-colors mt-3 disabled:opacity-40"
      >
        <Plus className="w-4 h-4" /> Add {group.itemLabel}
        {atLimit && <span className="text-white/30 text-xs">(limit reached)</span>}
      </button>
    </div>
  );
}

function SortableItem({
  item,
  index,
  total,
  group,
  onSave,
  onToggle,
  onDuplicate,
  onMove,
  onDelete,
}: {
  item: CmsSectionItem;
  index: number;
  total: number;
  group: ItemGroupDef;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
  onToggle: () => void;
  onDuplicate: () => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(item.data ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(item.data ?? {});
  const title =
    String(form[group.titleKey ?? "title"] ?? "").slice(0, 60) || `${group.itemLabel} ${index + 1}`;

  const save = async () => {
    setSaving(true);
    setErrors({});
    const ok = await onSave(form);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-white/[0.03] border border-white/5 rounded-xl",
        isDragging && "opacity-60 ring-1 ring-[#D9FC67]/40",
        !item.is_visible && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="text-white/25 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-2 text-left min-w-0">
          <ChevronDown className={cn("w-3.5 h-3.5 text-white/30 transition-transform", open && "rotate-180")} />
          <span className="text-white/80 text-sm truncate">{title}</span>
          {!item.is_visible && (
            <span className="text-[10px] uppercase tracking-wider text-white/30 border border-white/10 rounded px-1.5 py-0.5">
              Hidden
            </span>
          )}
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-[#D9FC67]" title="Unsaved changes" />}
        </button>

        <div className="flex items-center gap-0.5">
          <IconAction label={item.is_visible ? "Hide" : "Show"} onClick={onToggle}>
            {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </IconAction>
          <IconAction label="Duplicate" onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5" />
          </IconAction>
          <IconAction label="Move up" onClick={() => onMove("up")} disabled={index === 0}>
            <MoveUp className="w-3.5 h-3.5" />
          </IconAction>
          <IconAction label="Move down" onClick={() => onMove("down")} disabled={index === total - 1}>
            <MoveDown className="w-3.5 h-3.5" />
          </IconAction>
          <IconAction label="Delete" onClick={onDelete} danger>
            <Trash2 className="w-3.5 h-3.5" />
          </IconAction>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {group.fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={form[field.key]}
                record={form}
                error={errors[field.key]}
                onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40",
                saved ? "bg-green-500 text-white" : "bg-[#D9FC67] text-black hover:bg-[#E8FF8A]",
              )}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : saved ? "Saved" : "Save item"}
            </button>
            {dirty && !saving && <span className="text-white/30 text-xs">Unsaved changes</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function IconAction({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed",
        danger ? "text-red-400/60 hover:text-red-400 hover:bg-red-500/10" : "text-white/40 hover:text-white hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}

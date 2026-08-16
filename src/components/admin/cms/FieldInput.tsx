"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CMS_ICON_NAMES, CmsIcon } from "@/components/cms/CmsIcon";
import { RichTextField } from "./RichTextField";
import { uploadImage } from "./api";
import type { FieldDef } from "@/lib/cms/types";

const inputClass = "bg-white/5 border-white/10 text-white";
const textareaClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none text-sm";

interface Props {
  field: FieldDef;
  value: unknown;
  /** Extra values from the same record — used for the companion alt-text key. */
  record?: Record<string, unknown>;
  error?: string;
  onChange: (key: string, value: unknown) => void;
}

export function FieldInput({ field, value, record, error, onChange }: Props) {
  const set = (v: unknown) => onChange(field.key, v);

  return (
    <div className={field.half ? "" : "sm:col-span-2"}>
      <label className="text-white/60 text-sm mb-1.5 block">
        {field.label}
        {field.required && <span className="text-[#D9FC67] ml-1">*</span>}
      </label>

      {renderControl(field, value, set, record, onChange)}

      {field.help && !error && <p className="text-white/30 text-xs mt-1.5">{field.help}</p>}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

function renderControl(
  field: FieldDef,
  value: unknown,
  set: (v: unknown) => void,
  record?: Record<string, unknown>,
  onChange?: (key: string, value: unknown) => void,
) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={cn(textareaClass, "h-24 resize-y")}
        />
      );

    case "richtext":
      return <RichTextField value={String(value ?? "")} placeholder={field.placeholder} onChange={set} />;

    case "toggle":
      return (
        <button
          type="button"
          onClick={() => set(!value)}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors",
            value ? "bg-[#D9FC67]" : "bg-white/15",
          )}
          role="switch"
          aria-checked={Boolean(value)}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform",
              value ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      );

    case "number":
      return (
        <Input
          type="number"
          value={value === null || value === undefined || value === "" ? "" : String(value)}
          min={field.min}
          max={field.max}
          onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))}
          className={inputClass}
        />
      );

    case "select":
      return (
        <select
          value={String(value ?? field.default ?? "")}
          onChange={(e) => set(e.target.value)}
          className={cn(textareaClass, "h-11 py-0")}
        >
          {!field.required && <option value="">—</option>}
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value} className="bg-[#141414]">
              {option.label}
            </option>
          ))}
        </select>
      );

    case "list":
      return <ListField value={value} onChange={set} />;

    case "icon":
      return <IconField value={String(value ?? "")} onChange={set} />;

    case "image":
      return (
        <ImageField
          value={String(value ?? "")}
          altValue={String(record?.[`${field.key}_alt`] ?? "")}
          onChange={set}
          onAltChange={(v) => onChange?.(`${field.key}_alt`, v)}
        />
      );

    default:
      return (
        <Input
          value={String(value ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={inputClass}
        />
      );
  }
}

function ListField({ value, onChange }: { value: unknown; onChange: (v: string[]) => void }) {
  const list = Array.isArray(value) ? (value as unknown[]).map((v) => String(v)) : [];

  return (
    <div className="space-y-2">
      {list.map((entry, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={entry}
            onChange={(e) => onChange(list.map((v, idx) => (idx === i ? e.target.value : v)))}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
            className="p-2 text-red-400/60 hover:text-red-400 transition-colors"
            aria-label="Remove entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, ""])}
        className="flex items-center gap-2 text-[#D9FC67]/70 hover:text-[#D9FC67] text-sm transition-colors"
      >
        <Plus className="w-4 h-4" /> Add entry
      </button>
    </div>
  );
}

function IconField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 border border-[#D9FC67]/20 flex items-center justify-center text-[#D9FC67] flex-shrink-0">
        <CmsIcon name={value} className="w-4 h-4" />
      </span>
      <Input
        list="cms-icon-names"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="calendar"
        className={inputClass}
      />
      <datalist id="cms-icon-names">
        {CMS_ICON_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}

function ImageField({
  value,
  altValue,
  onChange,
  onAltChange,
}: {
  value: string;
  altValue: string;
  onChange: (v: string) => void;
  onAltChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    const result = await uploadImage(file);
    setUploading(false);
    if (result.error) setError(result.error);
    else if (result.url) onChange(result.url);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black border border-white/20 text-white/70 hover:text-white flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-xl border border-dashed border-white/15 text-white/40 hover:text-white hover:border-white/30 flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="text-[10px]">Upload</span>
          </button>
        )}

        <div className="flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or upload"
            className={inputClass}
          />
          <Input
            value={altValue}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Alt text (for accessibility)"
            maxLength={200}
            className={cn(inputClass, "text-xs")}
          />
          {value && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[#D9FC67]/70 hover:text-[#D9FC67] text-xs flex items-center gap-1"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Replace image
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 2 * 1024 * 1024;

type Kind = "logo" | "favicon";

function validateLogo(file: File): string | null {
  const ok = file.type === "image/png" || file.type === "image/jpeg";
  if (!ok) return "Logo must be PNG or JPG.";
  if (file.size > MAX_BYTES) return "File must be 2MB or smaller.";
  return null;
}

function validateFavicon(file: File): string | null {
  const name = file.name.toLowerCase();
  const isIco =
    name.endsWith(".ico") &&
    (!file.type ||
      file.type === "application/octet-stream" ||
      file.type === "image/x-icon" ||
      file.type === "image/vnd.microsoft.icon");
  const isPng = file.type === "image/png" || name.endsWith(".png");
  if (!isIco && !isPng) return "Favicon must be PNG or ICO.";
  if (file.size > MAX_BYTES) return "File must be 2MB or smaller.";
  return null;
}

function uploadWithProgress(
  file: File,
  kind: Kind,
  onProgress: (pct: number) => void
): Promise<{ url: string; branding: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          url?: string;
          branding?: Record<string, unknown>;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && data.url && data.branding) {
          resolve({ url: data.url, branding: data.branding });
        } else {
          reject(new Error(data.error || "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", "/api/partner/branding/upload");
    xhr.send(fd);
  });
}

export function WhiteLabelAssetUpload({
  kind,
  url,
  onBrandingUpdate,
  hint,
}: {
  kind: Kind;
  url?: string | null;
  onBrandingUpdate: (branding: Record<string, unknown>) => void;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const label = kind === "logo" ? "Upload Logo" : "Upload Favicon";
  const successMsg =
    kind === "logo" ? "Logo uploaded successfully" : "Favicon uploaded successfully";

  const runUpload = useCallback(
    async (file: File) => {
      setLocalError(null);
      setSuccess(null);
      const err =
        kind === "logo" ? validateLogo(file) : validateFavicon(file);
      if (err) {
        setLocalError(err);
        return;
      }
      setUploading(true);
      setProgress(0);
      try {
        const { branding } = await uploadWithProgress(file, kind, setProgress);
        onBrandingUpdate(branding);
        setSuccess(successMsg);
        setTimeout(() => setSuccess(null), 4000);
      } catch (e: unknown) {
        setLocalError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [kind, onBrandingUpdate, successMsg]
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void runUpload(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void runUpload(f);
  };

  const remove = async () => {
    setLocalError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const res = await fetch(`/api/partner/branding/upload?kind=${kind}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        branding?: Record<string, unknown> | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Remove failed");
      if (data.branding) onBrandingUpdate(data.branding);
      else
        onBrandingUpdate(
          kind === "logo" ? { logo_url: null } : { favicon_url: null }
        );
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setUploading(false);
    }
  };

  const accept =
    kind === "logo"
      ? "image/png,image/jpeg,.jpg,.jpeg,.png"
      : "image/png,image/x-icon,.png,.ico";

  const isFavicon = kind === "favicon";

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/70">
        {label}
        <span className="text-white/30 font-normal ml-2 text-xs">({hint})</span>
      </label>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border border-dashed transition-colors",
          drag ? "border-[#D9FC67] bg-[#D9FC67]/5" : "border-white/15 bg-white/[0.03]",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-3 p-4",
            url ? "sm:flex-row sm:items-center" : ""
          )}
        >
          {url ? (
            <div
              className={cn(
                "flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40",
                isFavicon ? "h-16 w-16" : "h-14 min-w-[120px] max-w-[200px] px-2"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={cn(
                  "object-contain",
                  isFavicon ? "h-12 w-12" : "max-h-12 w-auto max-w-full"
                )}
              />
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {url ? (
              <p className="truncate text-xs text-white/50" title={url}>
                {url.split("/").pop() || "Uploaded image"}
              </p>
            ) : (
              <p className="text-xs text-white/40">
                Drag and drop or choose a file — max 2MB
              </p>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D9FC67] transition-[width] duration-150"
                    style={{ width: `${progress || 8}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/40">Uploading… {progress}%</p>
              </div>
            )}

            {localError && (
              <p className="text-xs text-red-400">{localError}</p>
            )}
            {success && !localError && (
              <p className="text-xs text-green-400/90">{success}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={onInput}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                {uploading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : url ? (
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                )}
                {url ? "Replace" : "Choose file"}
              </Button>
              {url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={() => void remove()}
                  className="text-white/50 hover:bg-white/5 hover:text-red-400"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

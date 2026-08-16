"use client";

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Thin fetch wrapper that surfaces server validation errors instead of swallowing them. */
export async function cmsFetch<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...(init?.headers ?? {}) } : init?.headers,
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: (payload as { error?: string }).error || `Request failed (${res.status})`,
        fieldErrors: (payload as { fieldErrors?: Record<string, string> }).fieldErrors,
        data: payload as T,
      };
    }

    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, error: "Network error — please check your connection and try again." };
  }
}

export const post = <T>(url: string, body?: unknown) =>
  cmsFetch<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const patch = <T>(url: string, body: unknown) =>
  cmsFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });

export const del = <T>(url: string) => cmsFetch<T>(url, { method: "DELETE" });

/** Compresses to a max edge before upload — mirrors the studio/add-on upload flow. */
export async function compressImage(file: File, maxSize = 1920, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 1_000_000) return resolve(file);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { error: "Only JPG, PNG and WebP images are supported" };
  if (file.size > 10 * 1024 * 1024) return { error: "Image must be under 10MB" };

  const body = new FormData();
  body.append("file", await compressImage(file));

  try {
    const res = await fetch("/api/admin/upload-image", { method: "POST", body });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return { error: (payload as { error?: string }).error || "Upload failed" };
    return { url: (payload as { url?: string }).url };
  } catch {
    return { error: "Upload failed — please try again" };
  }
}

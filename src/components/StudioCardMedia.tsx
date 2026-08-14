"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

interface StudioCardMediaProps {
  alt: string;
  coverImage: string;
  imageUrls?: string[];
  videoUrl?: string;
  className?: string;
  imageClassName?: string;
  /** Fit for the video layer — pass "object-contain" to letterbox instead of crop */
  videoClassName?: string;
  hoverScaleClassName?: string;
  /** The "Video" pill shown before hover. Hide it when the parent draws its own badges. */
  showVideoBadge?: boolean;
}

export interface VideoInfo {
  /** The URL to pass to `<video src>` or `<iframe src>` */
  embedUrl: string;
  /** True for YouTube / Vimeo / Google Drive — rendered with <iframe> */
  isEmbedded: boolean;
}

interface VideoInfoOptions {
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
}

/** Parse any video URL and return the best embeddable form. */
export function getVideoInfo(url: string, options: VideoInfoOptions = {}): VideoInfo | null {
  if (!url) return null;
  const controls = options.controls ?? false;
  const muted = options.muted ?? true;
  const loop = options.loop ?? true;

  // YouTube: watch, shorts, youtu.be
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    const params = new URLSearchParams({
      autoplay: "1",
      mute: muted ? "1" : "0",
      controls: controls ? "1" : "0",
      playsinline: "1",
      rel: "0",
    });
    if (loop) {
      params.set("loop", "1");
      params.set("playlist", id);
    }
    return {
      embedUrl: `https://www.youtube.com/embed/${id}?${params.toString()}`,
      isEmbedded: true,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    const params = new URLSearchParams({
      autoplay: "1",
      muted: muted ? "1" : "0",
      loop: loop ? "1" : "0",
    });
    if (!controls) params.set("background", "1");
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?${params.toString()}`,
      isEmbedded: true,
    };
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      isEmbedded: true,
    };
  }

  // Direct video file (mp4, webm, ogg, mov …)
  return { embedUrl: url, isEmbedded: false };
}

export function StudioCardMedia({
  alt,
  coverImage,
  imageUrls,
  videoUrl,
  className,
  imageClassName = "object-cover",
  videoClassName = "object-cover",
  hoverScaleClassName = "",
  showVideoBadge = true,
}: StudioCardMediaProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);
  const [videoError, setVideoError] = useState(false);
  /** iframe src is set on first hover and kept so the video doesn't reload on re-hover. */
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaImages = useMemo(() => {
    const all = [coverImage, ...(imageUrls || [])].filter(Boolean);
    return Array.from(new Set(all));
  }, [coverImage, imageUrls]);

  const videoInfo = useMemo(() => (videoUrl ? getVideoInfo(videoUrl) : null), [videoUrl]);
  const showVideo = !!videoInfo && !videoError;

  // Auto-scroll images on hover when no video is available (or errored)
  useEffect(() => {
    if (!isHovered || showVideo || mediaImages.length <= 1) return;
    const timer = setInterval(() => {
      setImageIdx((prev) => (prev + 1) % mediaImages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [isHovered, showVideo, mediaImages]);

  // Reset image when mouse leaves
  useEffect(() => {
    if (!isHovered) setImageIdx(0);
  }, [isHovered]);

  // Load iframe src on first hover (set once, keep it to avoid reload on re-hover)
  useEffect(() => {
    if (isHovered && videoInfo?.isEmbedded && !videoError && !iframeSrc) {
      setIframeSrc(videoInfo.embedUrl);
    }
  }, [isHovered, videoInfo, videoError, iframeSrc]);

  // Play / pause direct <video> on hover
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !videoInfo || videoInfo.isEmbedded || !showVideo) return;
    if (isHovered) {
      vid.currentTime = 0;
      vid.play().catch(() => setVideoError(true));
    } else {
      vid.pause();
      vid.currentTime = 0;
    }
  }, [isHovered, videoInfo, showVideo]);

  const imageSrc = mediaImages[imageIdx] || coverImage;

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Image layer — always present as placeholder / fallback ── */}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`
          ${imageClassName} ${hoverScaleClassName}
          transition-opacity duration-500
          ${isHovered && showVideo ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* ── Video badge — visible when video is available but not yet playing ── */}
      {showVideo && showVideoBadge && !isHovered && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold pointer-events-none">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Video
        </div>
      )}

      {/* ── Direct <video> layer (mp4 / webm / etc.) ── */}
      {showVideo && videoInfo && !videoInfo.isEmbedded && (
        <video
          ref={videoRef}
          src={videoInfo.embedUrl}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoError(true)}
          className={`
            absolute inset-0 w-full h-full ${videoClassName}
            transition-opacity duration-500
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
        />
      )}

      {/* ── Embedded <iframe> layer (YouTube / Vimeo / Google Drive) ── */}
      {showVideo && videoInfo && videoInfo.isEmbedded && (
        <iframe
          src={iframeSrc ?? undefined}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={`
            absolute inset-0 w-full h-full border-0
            transition-opacity duration-500
            ${isHovered && iframeSrc ? "opacity-100" : "opacity-0"}
          `}
          onError={() => setVideoError(true)}
        />
      )}
    </div>
  );
}

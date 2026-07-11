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
  hoverScaleClassName?: string;
}

interface VideoInfo {
  /** The URL to pass to `<video src>` or `<iframe src>` */
  embedUrl: string;
  /** True for YouTube / Vimeo / Google Drive — rendered with <iframe> */
  isEmbedded: boolean;
}

/** Parse any video URL and return the best embeddable form. */
function getVideoInfo(url: string): VideoInfo | null {
  if (!url) return null;

  // YouTube: watch, shorts, youtu.be
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0`,
      isEmbedded: true,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`,
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
  hoverScaleClassName = "",
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
      {showVideo && !isHovered && (
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
            absolute inset-0 w-full h-full object-cover
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

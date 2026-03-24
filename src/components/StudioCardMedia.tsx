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
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaImages = useMemo(() => {
    const all = [coverImage, ...(imageUrls || [])].filter(Boolean);
    return Array.from(new Set(all));
  }, [coverImage, imageUrls]);

  const showVideo = !!videoUrl && !videoError;

  // Auto-scroll images on hover when there is no video (or video errored)
  useEffect(() => {
    if (!isHovered || showVideo || mediaImages.length <= 1) return;
    const timer = setInterval(() => {
      setImageIdx((prev) => (prev + 1) % mediaImages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [isHovered, showVideo, mediaImages]);

  // Reset image to cover when mouse leaves
  useEffect(() => {
    if (!isHovered) setImageIdx(0);
  }, [isHovered]);

  // Explicitly play / pause the video instead of relying on autoPlay
  // This avoids the blank flash caused by remounting the element
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !showVideo) return;
    if (isHovered) {
      vid.currentTime = 0;
      vid.play().catch(() => setVideoError(true));
    } else {
      vid.pause();
      vid.currentTime = 0;
    }
  }, [isHovered, showVideo]);

  const imageSrc = mediaImages[imageIdx] || coverImage;

  return (
    <div
      className={`${className ?? ""} relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Image layer (always present — acts as fallback / placeholder) ── */}
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

      {/* ── Video layer (always in DOM when videoUrl exists, opacity-toggled) ─ */}
      {showVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
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
    </div>
  );
}

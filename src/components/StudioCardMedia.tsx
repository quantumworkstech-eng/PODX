"use client";

import { useEffect, useMemo, useState } from "react";
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

  const mediaImages = useMemo(() => {
    const all = [coverImage, ...(imageUrls || [])].filter(Boolean);
    return Array.from(new Set(all));
  }, [coverImage, imageUrls]);

  useEffect(() => {
    if (!isHovered || videoUrl || mediaImages.length <= 1) return;
    const timer = setInterval(() => {
      setImageIdx((prev) => (prev + 1) % mediaImages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [isHovered, videoUrl, mediaImages]);

  useEffect(() => {
    if (!isHovered) setImageIdx(0);
  }, [isHovered]);

  const imageSrc = mediaImages[imageIdx] || coverImage;

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {videoUrl && isHovered ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className={`w-full h-full ${imageClassName} ${hoverScaleClassName}`}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={`${imageClassName} ${hoverScaleClassName}`}
        />
      )}
    </div>
  );
}

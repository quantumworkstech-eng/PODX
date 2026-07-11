"use client";

import type { AboutContent, SectionBranding } from "@/types/landing";

interface Props {
  content: AboutContent;
  branding: SectionBranding;
}

export function AboutSection({ content, branding }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const { heading, description, image_url, image_position = "right" } = content;

  const textBlock = (
    <div className="flex-1">
      {heading && (
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">{heading}</h2>
      )}
      <p className="text-base leading-relaxed" style={{ opacity: 0.65 }}>
        {description}
      </p>
    </div>
  );

  const imageBlock = image_url ? (
    <div className="flex-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image_url}
        alt={heading || "About"}
        className="w-full h-72 object-cover rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      />
    </div>
  ) : (
    <div
      className="flex-1 h-72 rounded-2xl flex items-center justify-center"
      style={{ background: `${primary}08`, border: `1px solid ${primary}15` }}
    >
      <span className="text-6xl font-black" style={{ color: `${primary}20` }}>
        {branding.brand_name?.[0] || "A"}
      </span>
    </div>
  );

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col ${image_position === "left" ? "md:flex-row-reverse" : "md:flex-row"} gap-12 items-center`}>
          {textBlock}
          {imageBlock}
        </div>
      </div>
    </section>
  );
}

"use client";

import type { CustomContent, CustomBlock, SectionBranding } from "@/types/landing";

interface Props {
  content: CustomContent;
  branding: SectionBranding;
}

function BlockRenderer({ block, primary }: { block: CustomBlock; primary: string }) {
  const alignClass =
    block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left";

  const sizeClass =
    block.size === "xl"
      ? "text-4xl font-bold"
      : block.size === "lg"
      ? "text-2xl font-semibold"
      : block.size === "sm"
      ? "text-sm"
      : "text-base";

  switch (block.type) {
    case "text":
      return (
        <p className={`${sizeClass} ${alignClass} leading-relaxed`} style={{ opacity: 0.75 }}>
          {block.content}
        </p>
      );

    case "image":
      return block.url ? (
        <div className={alignClass}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.content || ""}
            className="max-w-full rounded-2xl mx-auto"
            style={{ maxHeight: 500 }}
          />
          {block.content && (
            <p className={`text-sm mt-2 ${alignClass}`} style={{ opacity: 0.45 }}>
              {block.content}
            </p>
          )}
        </div>
      ) : null;

    case "video":
      return block.url ? (
        <div className={alignClass}>
          {block.url.includes("youtube.com") || block.url.includes("youtu.be") ? (
            <iframe
              src={block.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
              className="w-full aspect-video rounded-2xl mx-auto"
              style={{ maxWidth: 800 }}
              allowFullScreen
              title={block.content || "Video"}
            />
          ) : (
            <video
              src={block.url}
              controls
              className="w-full rounded-2xl mx-auto"
              style={{ maxWidth: 800 }}
            />
          )}
          {block.content && (
            <p className={`text-sm mt-2 ${alignClass}`} style={{ opacity: 0.45 }}>
              {block.content}
            </p>
          )}
        </div>
      ) : null;

    case "button":
      return (
        <div className={alignClass}>
          <a
            href={block.url || "#"}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all hover:scale-105 ${sizeClass}`}
            style={{ background: primary, color: "#000" }}
          >
            {block.content || "Click Here"}
          </a>
        </div>
      );

    default:
      return null;
  }
}

export function CustomSection({ content, branding }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const { heading, blocks = [] } = content;

  return (
    <section className="px-6 py-20">
      <div className="max-w-4xl mx-auto space-y-8">
        {heading && (
          <h2 className="text-3xl sm:text-4xl font-bold text-center">{heading}</h2>
        )}
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} primary={primary} />
        ))}
      </div>
    </section>
  );
}

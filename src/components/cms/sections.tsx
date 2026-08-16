"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Quote, Star } from "lucide-react";
import { CmsIcon } from "./CmsIcon";
import { BrowserMockup, DashboardMockup } from "./mockups";
import { bool, items, layoutClasses, num, sectionAnchor, strList, text } from "@/lib/cms/render";
import type { CmsSection, ItemData } from "@/lib/cms/types";

// ── Shared pieces ───────────────────────────────────────────────────────────

const ACCENT = "#D9FC67";

function SectionShell({
  section,
  children,
  className = "",
}: {
  section: CmsSection;
  children: React.ReactNode;
  className?: string;
}) {
  const l = layoutClasses(section.settings);
  const bgImage = section.settings?.background === "image" ? section.settings.background_image_url : undefined;

  return (
    <section
      id={sectionAnchor(section)}
      className={`relative px-4 ${l.spacing} ${l.background} ${className}`}
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {bgImage && <div className="absolute inset-0 bg-black/70" />}
      <div className={`relative mx-auto ${l.width}`}>{children}</div>
    </section>
  );
}

function SectionHeading({ section, className = "" }: { section: CmsSection; className?: string }) {
  const c = section.content;
  const eyebrow = text(c, "eyebrow");
  const heading = text(c, "heading");
  const accent = text(c, "heading_accent");
  const subheading = text(c, "subheading");
  const description = text(c, "description");
  const l = layoutClasses(section.settings);

  if (!eyebrow && !heading && !description && !subheading) return null;

  return (
    <div className={`${l.align} mb-16 ${className}`}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-3">
          {eyebrow}
        </span>
      )}
      {heading && (
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-3xl mx-auto">
          {heading} {accent && <span className="text-[#D9FC67]">{accent}</span>}
        </h2>
      )}
      {subheading && <p className="mt-3 text-white/60 text-lg">{subheading}</p>}
      {description && <p className="mt-4 text-white/50 max-w-2xl mx-auto">{description}</p>}
    </div>
  );
}

function PrimaryButton({ href, children, size = "md" }: { href: string; children: React.ReactNode; size?: "md" | "lg" }) {
  const pad = size === "lg" ? "px-10 py-4 text-lg" : "px-8 py-4 text-base";
  return (
    <Link href={href || "#"}>
      <span
        className={`group inline-flex items-center gap-2 bg-[#D9FC67] text-black font-bold ${pad} rounded-2xl hover:bg-[#E8FF8A] transition-all shadow-[0_0_40px_#D9FC6740]`}
      >
        {children}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}

function SecondaryButton({ href, children, size = "md" }: { href: string; children: React.ReactNode; size?: "md" | "lg" }) {
  const pad = size === "lg" ? "px-10 py-4 text-lg" : "px-8 py-4 text-base";
  return (
    <Link href={href || "#"}>
      <span
        className={`inline-flex items-center gap-2 border border-white/15 text-white/80 font-medium ${pad} rounded-2xl hover:bg-white/5 hover:border-white/25 transition-all`}
      >
        {children}
      </span>
    </Link>
  );
}

function CtaPair({ section, size = "md" }: { section: CmsSection; size?: "md" | "lg" }) {
  const c = section.content;
  const primary = text(c, "cta_text");
  const secondary = text(c, "cta_secondary_text");
  const l = layoutClasses(section.settings);
  if (!primary && !secondary) return null;

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${l.alignItems}`}>
      {primary && <PrimaryButton href={text(c, "cta_url")} size={size}>{primary}</PrimaryButton>}
      {secondary && <SecondaryButton href={text(c, "cta_secondary_url")} size={size}>{secondary}</SecondaryButton>}
    </div>
  );
}

function CmsImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={className} />;
}

// ── Section renderers ───────────────────────────────────────────────────────

function HeroSection({ section }: { section: CmsSection }) {
  const c = section.content;
  const l = layoutClasses(section.settings);
  const badge = text(c, "badge_text");
  const preset = text(c, "media_preset") || "none";
  const bgImage = text(c, "background_image_url");
  const bgVideo = text(c, "background_video_url");
  const overlay = num(c, "overlay_opacity", 60);
  const stats = items(section, "stats");
  const trust = items(section, "trust");

  return (
    <section
      id={sectionAnchor(section)}
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 overflow-hidden"
    >
      {bgVideo ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={bgVideo}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        bgImage && <CmsImage src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {(bgVideo || bgImage) && <div className="absolute inset-0 bg-black" style={{ opacity: overlay / 100 }} />}

      {!bgVideo && !bgImage && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#D9FC67]/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#D9FC67]/5 rounded-full blur-[100px]" />
        </div>
      )}

      <div className={`relative w-full mx-auto ${l.width} flex flex-col ${l.alignItems} ${l.align}`}>
        {badge && (
          <div className="mb-6 inline-flex items-center gap-2 bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-full px-4 py-1.5">
            <CmsIcon name="sparkles" className="w-3.5 h-3.5 text-[#D9FC67]" />
            <span className="text-[#D9FC67] text-xs font-semibold tracking-wider uppercase">{badge}</span>
          </div>
        )}

        <h1 className="font-bold tracking-tight text-white leading-[1.1] max-w-5xl">
          <span className="block text-4xl sm:text-5xl lg:text-7xl mb-2">{text(c, "heading")}</span>
          {text(c, "heading_accent") && (
            <span className="block text-4xl sm:text-5xl lg:text-7xl bg-gradient-to-r from-[#D9FC67] via-[#E8FF8A] to-[#B8E050] bg-clip-text text-transparent">
              {text(c, "heading_accent")}
            </span>
          )}
        </h1>

        {text(c, "subheading") && <p className="mt-4 text-white/70 text-xl max-w-2xl">{text(c, "subheading")}</p>}
        {text(c, "description") && (
          <p className="mt-6 text-white/60 text-lg sm:text-xl max-w-2xl leading-relaxed">{text(c, "description")}</p>
        )}

        <div className="mt-10">
          <CtaPair section={section} />
        </div>

        {trust.length > 0 && (
          <div className={`mt-12 flex flex-wrap gap-6 text-sm text-white/40 ${l.alignItems}`}>
            {trust.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D9FC67]" />
                {String(item.text ?? "")}
              </span>
            ))}
          </div>
        )}

        {stats.length > 0 && (
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full text-center">
            {stats.map((item, i) => (
              <div key={i}>
                <p className="text-3xl lg:text-4xl font-bold text-[#D9FC67] mb-1">{String(item.value ?? "")}</p>
                <p className="text-white/50 text-sm">{String(item.label ?? "")}</p>
              </div>
            ))}
          </div>
        )}

        {preset === "dashboard_mockup" && <DashboardMockup />}
        {preset === "image" && text(c, "hero_image_url") && (
          <div className="mt-16 w-full max-w-5xl mx-auto">
            <CmsImage
              src={text(c, "hero_image_url")}
              alt={text(c, "heading")}
              className="w-full rounded-2xl border border-white/10"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StatsSection({ section }: { section: CmsSection }) {
  const list = items(section);
  if (!list.length) return null;
  const l = layoutClasses(section.settings);

  return (
    <SectionShell section={section} className="border-y border-white/8">
      <SectionHeading section={section} className="!mb-8" />
      <div className={`grid ${l.columns} gap-8 text-center`}>
        {list.map((item, i) => (
          <div key={i}>
            <p className="text-3xl lg:text-4xl font-bold text-[#D9FC67] mb-1">{String(item.value ?? "")}</p>
            <p className="text-white/50 text-sm">{String(item.label ?? "")}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

const CARD_ICON_STYLE: Record<string, string> = {
  default: "bg-white/5 border-white/10 text-white/70",
  accent: "bg-[#D9FC67]/8 border-[#D9FC67]/15 text-[#D9FC67]",
  warning: "bg-red-500/10 border-red-500/20 text-red-400",
  plain: "",
};

function CardsSection({ section }: { section: CmsSection }) {
  const list = items(section);
  const style = text(section.content, "card_style") || "default";
  const l = layoutClasses(section.settings);
  if (!list.length) return <SectionShell section={section}><SectionHeading section={section} /></SectionShell>;

  const horizontal = style === "warning";

  return (
    <SectionShell section={section}>
      <SectionHeading section={section} />
      <div className={`grid ${l.columns} gap-6`}>
        {list.map((item, i) => (
          <div
            key={i}
            className={`bg-[#0D0D0D] border border-white/6 rounded-2xl p-6 hover:border-[#D9FC67]/20 transition-all group relative overflow-hidden ${
              horizontal ? "flex gap-5" : ""
            }`}
          >
            {String(item.tag ?? "") && (
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D9FC67]/15 text-[#D9FC67]">
                  {String(item.tag)}
                </span>
              </div>
            )}

            {String(item.image_url ?? "") ? (
              <CmsImage
                src={String(item.image_url)}
                alt={String(item.title ?? "")}
                className={`rounded-xl object-cover mb-5 ${horizontal ? "w-24 h-24 mb-0" : "w-full h-44"}`}
              />
            ) : (
              style !== "plain" &&
              String(item.icon ?? "") && (
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 mb-5 ${
                    CARD_ICON_STYLE[style] ?? CARD_ICON_STYLE.default
                  } ${horizontal ? "mb-0" : ""}`}
                >
                  <CmsIcon name={String(item.icon)} className="w-5 h-5" />
                </div>
              )
            )}

            <div className={horizontal ? "flex-1" : ""}>
              <h3 className="text-white font-semibold mb-2">{String(item.title ?? "")}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{String(item.description ?? "")}</p>
              {String(item.link_text ?? "") && (
                <Link
                  href={String(item.link_url ?? "#")}
                  className="inline-flex items-center gap-1 text-[#D9FC67] text-sm mt-4 hover:underline"
                >
                  {String(item.link_text)} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function BenefitsSection({ section }: { section: CmsSection }) {
  return <CardsSection section={section} />;
}

function ImageContentSection({ section }: { section: CmsSection }) {
  const c = section.content;
  const preset = text(c, "media_preset") || "image";
  const checklist = items(section, "checklist");
  const features = items(section, "features");
  const imageFirst = section.settings?.image_position === "left";
  const featureGrid = preset === "none" && features.length > 0;

  const media =
    preset === "browser_mockup" ? (
      <BrowserMockup />
    ) : preset === "dashboard_mockup" ? (
      <DashboardMockup />
    ) : preset === "image" && text(c, "image_url") ? (
      <CmsImage
        src={text(c, "image_url")}
        alt={text(c, "heading")}
        className="w-full rounded-2xl border border-white/10 object-cover"
      />
    ) : featureGrid ? (
      <div className="grid grid-cols-2 gap-4">
        {features.map((item, i) => (
          <div
            key={i}
            className="bg-[#0D0D0D] border border-white/6 rounded-2xl p-5 hover:border-[#D9FC67]/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center mb-3 group-hover:bg-[#D9FC67]/20 transition-colors">
              <CmsIcon name={String(item.icon ?? "")} className="w-5 h-5 text-[#D9FC67]" />
            </div>
            <p className="text-white font-semibold text-sm mb-1">{String(item.title ?? "")}</p>
            <p className="text-white/40 text-xs leading-relaxed">{String(item.description ?? "")}</p>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <SectionShell section={section}>
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className={imageFirst ? "order-2 lg:order-1" : "order-2"}>{media}</div>

        <div className={imageFirst ? "order-1 lg:order-2" : "order-1"}>
          {text(c, "badge_text") && (
            <div className="inline-flex items-center gap-2 bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-full px-4 py-1.5 mb-5">
              <CmsIcon name="sparkles" className="w-3.5 h-3.5 text-[#D9FC67]" />
              <span className="text-[#D9FC67] text-xs font-semibold">{text(c, "badge_text")}</span>
            </div>
          )}
          {text(c, "eyebrow") && (
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9FC67] mb-4">
              {text(c, "eyebrow")}
            </span>
          )}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {text(c, "heading")}{" "}
            {text(c, "heading_accent") && <span className="text-[#D9FC67]">{text(c, "heading_accent")}</span>}
          </h2>
          {text(c, "description") && (
            <p className="text-white/60 text-lg leading-relaxed mb-8">{text(c, "description")}</p>
          )}

          {checklist.length > 0 && (
            <div className="space-y-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#D9FC67] flex-shrink-0 mt-0.5" />
                  <span className="text-white/70 text-sm">{String(item.text ?? "")}</span>
                </div>
              ))}
            </div>
          )}

          {!featureGrid && features.length > 0 && (
            <div className="space-y-4 mt-6">
              {features.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 border border-[#D9FC67]/15 flex items-center justify-center flex-shrink-0">
                    <CmsIcon name={String(item.icon ?? "")} className="w-4 h-4 text-[#D9FC67]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{String(item.title ?? "")}</p>
                    <p className="text-white/50 text-sm">{String(item.description ?? "")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {text(c, "cta_text") && (
            <div className="mt-8">
              <PrimaryButton href={text(c, "cta_url")}>{text(c, "cta_text")}</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

function StepsSection({ section }: { section: CmsSection }) {
  const list = items(section);
  const l = layoutClasses(section.settings);

  return (
    <SectionShell section={section}>
      <SectionHeading section={section} />
      <div className="relative">
        <div className="hidden lg:block absolute top-10 left-[calc(10%+20px)] right-[calc(10%+20px)] h-px bg-gradient-to-r from-transparent via-[#D9FC67]/20 to-transparent" />
        <div className={`grid ${l.columns} gap-6`}>
          {list.map((item, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-2xl bg-[#111111] border border-white/8 flex items-center justify-center group-hover:border-[#D9FC67]/40 group-hover:bg-[#D9FC67]/5 transition-all">
                  <CmsIcon name={String(item.icon ?? "")} className="w-8 h-8 text-[#D9FC67]" />
                </div>
                {String(item.step ?? "") && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D9FC67] flex items-center justify-center">
                    <span className="text-black text-[10px] font-black">{String(item.step)}</span>
                  </div>
                )}
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{String(item.title ?? "")}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{String(item.description ?? "")}</p>
            </div>
          ))}
        </div>
      </div>

      {text(section.content, "cta_text") && (
        <div className="mt-14 text-center">
          <PrimaryButton href={text(section.content, "cta_url")}>{text(section.content, "cta_text")}</PrimaryButton>
        </div>
      )}
    </SectionShell>
  );
}

function LogosSection({ section }: { section: CmsSection }) {
  const list = items(section);
  const grayscale = bool(section.content, "grayscale");
  if (!list.length) return null;

  return (
    <SectionShell section={section}>
      {text(section.content, "heading") && (
        <p className="text-white/30 text-sm mb-6 text-center">{text(section.content, "heading")}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {list.map((item, i) => {
          const inner = String(item.logo_url ?? "") ? (
            <CmsImage
              src={String(item.logo_url)}
              alt={String(item.name ?? "")}
              className={`h-8 w-auto object-contain ${grayscale ? "grayscale hover:grayscale-0 transition-all" : ""}`}
            />
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#D9FC67]/30 flex items-center justify-center">
                <CmsIcon name="mic" className="w-2.5 h-2.5 text-[#D9FC67]" />
              </span>
              <span className="text-white/50 text-xs font-medium">{String(item.name ?? "")}</span>
            </span>
          );

          const chip = (
            <div className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-full px-4 py-2">
              {inner}
            </div>
          );

          return String(item.website_url ?? "") ? (
            <a key={i} href={String(item.website_url)} target="_blank" rel="noopener noreferrer">
              {chip}
            </a>
          ) : (
            <div key={i}>{chip}</div>
          );
        })}
      </div>
    </SectionShell>
  );
}

function TestimonialsSection({ section }: { section: CmsSection }) {
  const list = items(section);
  const l = layoutClasses(section.settings);
  if (!list.length) return null;

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <SectionShell section={section}>
      <SectionHeading section={section} />
      <div className={`grid ${l.columns} gap-6`}>
        {list.map((item, i) => {
          const name = String(item.name ?? "");
          const rating = Math.min(5, Math.max(0, Number(item.rating ?? 0)));
          return (
            <div
              key={i}
              className="bg-[#0D0D0D] border border-white/6 rounded-2xl p-7 flex flex-col hover:border-[#D9FC67]/15 transition-all group text-left"
            >
              <Quote className="w-8 h-8 text-[#D9FC67]/20 mb-4 group-hover:text-[#D9FC67]/40 transition-colors" />
              <p className="text-white/70 text-sm leading-relaxed flex-1 mb-6">&ldquo;{String(item.quote ?? "")}&rdquo;</p>
              <div className="flex items-center gap-3">
                {String(item.avatar_url ?? "") ? (
                  <CmsImage src={String(item.avatar_url)} alt={name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#D9FC67] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                    {initials(name)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{name}</p>
                  <p className="text-white/40 text-xs">{String(item.role ?? "")}</p>
                </div>
                {String(item.company_logo_url ?? "") && (
                  <CmsImage src={String(item.company_logo_url)} alt="" className="h-5 w-auto opacity-60" />
                )}
                {rating > 0 && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-[#D9FC67] fill-[#D9FC67]" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

function PricingSection({ section }: { section: CmsSection }) {
  const list = items(section);
  const l = layoutClasses(section.settings);
  if (!list.length) return null;

  return (
    <SectionShell section={section}>
      <SectionHeading section={section} />
      <div className={`grid ${l.columns} gap-6`}>
        {list.map((item, i) => {
          const highlighted = Boolean(item.highlighted);
          const features = strList(item as Record<string, unknown>, "features");
          const period = String(item.period ?? "");
          return (
            <div
              key={i}
              className={`relative rounded-2xl p-7 flex flex-col border transition-all text-left ${
                highlighted
                  ? "bg-[#D9FC67]/5 border-[#D9FC67]/30 shadow-[0_0_50px_#D9FC6710]"
                  : "bg-[#0D0D0D] border-white/6 hover:border-white/12"
              }`}
            >
              {String(item.badge ?? "") && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#D9FC67] text-black text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                    {String(item.badge)}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-white font-bold text-lg mb-1">{String(item.name ?? "")}</p>
                <div className="flex items-end gap-1 mb-3">
                  <span className={`text-4xl font-black ${highlighted ? "text-[#D9FC67]" : "text-white"}`}>
                    {String(item.price ?? "")}
                  </span>
                  {period && (
                    <span className={`text-sm mb-1 ${period === "forever" ? "text-[#D9FC67]/60" : "text-white/40"}`}>
                      {period === "forever" ? period : `/${period}`}
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-sm">{String(item.description ?? "")}</p>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? "text-[#D9FC67]" : "text-white/40"}`} />
                    <span className="text-white/70 text-sm">{f}</span>
                  </div>
                ))}
              </div>

              {String(item.cta_text ?? "") && (
                <Link href={String(item.cta_url ?? "#")} className="block">
                  <span
                    className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                      highlighted
                        ? "bg-[#D9FC67] text-black hover:bg-[#E8FF8A]"
                        : "border border-white/15 text-white hover:bg-white/5 hover:border-white/25"
                    }`}
                  >
                    {String(item.cta_text)}
                  </span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
      {text(section.content, "note") && (
        <p className="text-white/25 text-xs mt-8 text-center">{text(section.content, "note")}</p>
      )}
    </SectionShell>
  );
}

function EarningsSection({ section }: { section: CmsSection }) {
  const c = section.content;
  const rows = items(section, "rows");
  const summary = items(section, "summary");
  const tiers = items(section, "tiers");

  return (
    <SectionShell section={section}>
      <SectionHeading section={section} />

      {(rows.length > 0 || summary.length > 0) && (
        <div className="bg-gradient-to-br from-[#111111] to-[#0D0D0D] border border-[#D9FC67]/15 rounded-3xl p-8 lg:p-12 mb-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {text(c, "rows_title") && (
                <p className="text-white/50 text-sm mb-6 font-medium uppercase tracking-wider">{text(c, "rows_title")}</p>
              )}
              <div className="space-y-5">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="text-left">
                      <p className="text-white/70 text-sm">{String(row.label ?? "")}</p>
                      {String(row.sub ?? "") && <p className="text-white/30 text-xs mt-0.5">{String(row.sub)}</p>}
                    </div>
                    <p className="text-white font-bold">{String(row.value ?? "")}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-[#D9FC67]/8 border border-[#D9FC67]/20 rounded-3xl p-8 text-center w-full">
                {text(c, "highlight_label") && <p className="text-white/50 text-sm mb-2">{text(c, "highlight_label")}</p>}
                {text(c, "highlight_value") && (
                  <p className="text-5xl lg:text-6xl font-black text-[#D9FC67] mb-2">{text(c, "highlight_value")}</p>
                )}
                {text(c, "highlight_caption") && (
                  <p className="text-white/30 text-sm mb-6">{text(c, "highlight_caption")}</p>
                )}

                <div className="space-y-2">
                  {summary.map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white/50">{String(row.label ?? "")}</span>
                      <span className="text-white font-semibold">{String(row.value ?? "")}</span>
                    </div>
                  ))}
                </div>
              </div>
              {text(c, "footnote") && <p className="text-white/25 text-xs mt-4 text-center">{text(c, "footnote")}</p>}
            </div>
          </div>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className="bg-[#0D0D0D] border border-white/6 rounded-2xl p-5 text-center hover:border-[#D9FC67]/20 transition-colors"
            >
              {String(tier.icon_emoji ?? "") && <span className="text-2xl mb-3 block">{String(tier.icon_emoji)}</span>}
              <p className="text-white/50 text-xs mb-1">{String(tier.title ?? "")}</p>
              <p className="text-[#D9FC67] font-bold text-lg mb-2">{String(tier.value ?? "")}</p>
              <p className="text-white/30 text-xs">{String(tier.description ?? "")}</p>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function FaqSection({ section }: { section: CmsSection }) {
  const list = items(section);
  const [open, setOpen] = useState<number | null>(null);
  if (!list.length) return null;

  return (
    <SectionShell section={section}>
      <SectionHeading section={section} />
      <div className="space-y-3">
        {list.map((item, i) => (
          <div
            key={i}
            className={`border rounded-2xl overflow-hidden transition-all text-left ${
              open === i ? "border-[#D9FC67]/25 bg-[#D9FC67]/[0.03]" : "border-white/6 bg-[#0D0D0D] hover:border-white/12"
            }`}
          >
            <button
              className="w-full flex items-center justify-between px-6 py-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className={`font-semibold text-sm pr-4 ${open === i ? "text-white" : "text-white/80"}`}>
                {String(item.question ?? "")}
              </span>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform ${
                  open === i ? "rotate-180 text-[#D9FC67]" : "text-white/30"
                }`}
              />
            </button>
            {open === i && (
              <div className="px-6 pb-5">
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{String(item.answer ?? "")}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function CtaSection({ section }: { section: CmsSection }) {
  const c = section.content;
  const l = layoutClasses(section.settings);

  return (
    <section
      id={sectionAnchor(section)}
      className={`relative px-4 overflow-hidden ${l.spacing} ${l.background}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9FC67]/4 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D9FC67]/8 rounded-full blur-[120px]" />
      </div>

      <div className={`relative mx-auto ${l.width} ${l.align}`}>
        {text(c, "badge_text") && (
          <div className="inline-flex items-center gap-2 bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-full px-4 py-1.5 mb-6">
            <CmsIcon name="trending-up" className="w-3.5 h-3.5 text-[#D9FC67]" />
            <span className="text-[#D9FC67] text-xs font-semibold">{text(c, "badge_text")}</span>
          </div>
        )}

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          {text(c, "heading")} {text(c, "heading_accent") && <span className="text-[#D9FC67]">{text(c, "heading_accent")}</span>}
        </h2>

        {text(c, "description") && (
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">{text(c, "description")}</p>
        )}

        <div className={`flex flex-col sm:flex-row gap-4 ${l.alignItems}`}>
          {text(c, "cta_text") && (
            <PrimaryButton href={text(c, "cta_url")} size="lg">
              {text(c, "cta_text")}
            </PrimaryButton>
          )}
          {text(c, "cta_secondary_text") && (
            <SecondaryButton href={text(c, "cta_secondary_url")} size="lg">
              {text(c, "cta_secondary_text")}
            </SecondaryButton>
          )}
        </div>

        {text(c, "note") && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
            {text(c, "note")
              .split("·")
              .map((part) => part.trim())
              .filter(Boolean)
              .map((part) => (
                <span key={part} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D9FC67]" />
                  {part}
                </span>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

const RICH_TEXT_CLASS =
  "text-white/60 leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:text-white [&_a]:text-[#D9FC67] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#D9FC67]/40 [&_blockquote]:pl-4 [&_blockquote]:italic";

/** Body copy from the rich text editor. Older plain-text values still render correctly. */
function RichBody({ html }: { html: string }) {
  if (!html) return null;
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return <div className={`${RICH_TEXT_CLASS} whitespace-pre-line`}>{html}</div>;
  }
  return <div className={RICH_TEXT_CLASS} dangerouslySetInnerHTML={{ __html: html }} />;
}

function RichTextSection({ section }: { section: CmsSection }) {
  const c = section.content;
  const image = text(c, "image_url");
  const position = section.settings?.image_position ?? "right";
  const l = layoutClasses(section.settings);

  const body = (
    <div className={l.align}>
      <SectionHeading section={section} className="!mb-6" />
      <RichBody html={text(c, "body")} />
      {text(c, "cta_text") && (
        <div className="mt-8">
          <PrimaryButton href={text(c, "cta_url")}>{text(c, "cta_text")}</PrimaryButton>
        </div>
      )}
    </div>
  );

  if (!image) return <SectionShell section={section}>{body}</SectionShell>;

  const media = <CmsImage src={image} alt={text(c, "heading")} className="w-full rounded-2xl border border-white/10" />;
  const stacked = position === "top" || position === "bottom";

  return (
    <SectionShell section={section}>
      {stacked ? (
        <div className="space-y-10">
          {position === "top" ? media : body}
          {position === "top" ? body : media}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={position === "left" ? "order-1" : "order-2"}>{media}</div>
          <div className={position === "left" ? "order-2" : "order-1"}>{body}</div>
        </div>
      )}
    </SectionShell>
  );
}

function TextTickerSection({ section }: { section: CmsSection }) {
  const list = items(section).map((i) => String(i.text ?? "")).filter(Boolean);
  const display = text(section.content, "display") || "marquee";
  const prefix = text(section.content, "prefix");
  if (!list.length) return null;

  if (display === "pills") {
    return (
      <SectionShell section={section}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {list.map((item) => (
            <span key={item} className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white/60 text-sm">
              {item}
            </span>
          ))}
        </div>
      </SectionShell>
    );
  }

  if (display === "animated_words") {
    return (
      <SectionShell section={section}>
        <div className="text-center">
          {prefix && <p className="text-white/40 text-lg mb-4">{prefix}</p>}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {list.map((item) => (
              <span key={item} className="text-2xl sm:text-3xl font-bold text-[#D9FC67]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell section={section} className="overflow-hidden border-y border-white/5">
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {list.map((item) => (
          <span key={item} className="text-white/30 text-sm font-medium uppercase tracking-widest">
            {item}
          </span>
        ))}
      </div>
    </SectionShell>
  );
}

const BLOCK_SIZE: Record<string, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
};

function CustomSection({ section }: { section: CmsSection }) {
  const blocks = items(section);
  const l = layoutClasses(section.settings);

  return (
    <SectionShell section={section}>
      <SectionHeading section={section} className="!mb-8" />
      <div className={`space-y-6 ${l.align}`}>
        {blocks.map((block, i) => {
          const type = String(block.type ?? "text");
          const content = String(block.content ?? "");
          const url = String(block.url ?? "");
          const size = String(block.size ?? "md");

          if (type === "divider") return <hr key={i} className="border-white/10" />;
          if (type === "heading")
            return (
              <h3 key={i} className="text-2xl sm:text-3xl font-bold text-white">
                {content}
              </h3>
            );
          if (type === "image")
            return <CmsImage key={i} src={content || url} alt="" className="w-full rounded-2xl border border-white/10" />;
          if (type === "video")
            return (
              <video key={i} src={content || url} controls className="w-full rounded-2xl border border-white/10" />
            );
          if (type === "button")
            return (
              <div key={i}>
                <PrimaryButton href={url}>{content}</PrimaryButton>
              </div>
            );

          return (
            <p key={i} className={`text-white/60 leading-relaxed whitespace-pre-line ${BLOCK_SIZE[size] ?? BLOCK_SIZE.md}`}>
              {content}
            </p>
          );
        })}
      </div>
    </SectionShell>
  );
}

// ── Dispatch ────────────────────────────────────────────────────────────────

const RENDERERS: Record<string, (props: { section: CmsSection }) => React.ReactElement | null> = {
  hero: HeroSection,
  stats: StatsSection,
  cards: CardsSection,
  benefits: BenefitsSection,
  image_content: ImageContentSection,
  steps: StepsSection,
  logos: LogosSection,
  testimonials: TestimonialsSection,
  pricing: PricingSection,
  earnings: EarningsSection,
  faq: FaqSection,
  cta: CtaSection,
  rich_text: RichTextSection,
  text_ticker: TextTickerSection,
  custom: CustomSection,
};

/** Renders a section with the generic (partner-page) design system. */
export function CmsSection({ section }: { section: CmsSection }) {
  const Renderer = RENDERERS[section.type];
  if (!Renderer) return null;
  return <Renderer section={section} />;
}

export { ACCENT, CmsImage, PrimaryButton, SecondaryButton, SectionShell, SectionHeading };
export type { ItemData };

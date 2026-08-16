"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Instagram, Linkedin, Mail, MapPin, Menu, Mic, Phone, X, Youtube } from "lucide-react";
import { CmsImage, CmsSection } from "./sections";
import { items, text } from "@/lib/cms/render";
import type { CmsSection as Section } from "@/lib/cms/types";

/**
 * Public renderer for a CMS-managed landing page.
 * Nav and footer are pinned to the top and bottom; everything else renders in
 * the order stored in the database.
 */
export function CmsLandingPage({ sections }: { sections: Section[] }) {
  const nav = sections.find((s) => s.type === "nav");
  const footer = sections.find((s) => s.type === "footer");
  const body = sections.filter((s) => s.type !== "nav" && s.type !== "footer");

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {nav && <CmsNav section={nav} />}
      {body.map((section) => (
        <CmsSection key={section.id} section={section} />
      ))}
      {footer && <CmsFooter section={footer} />}
      {nav && <StickyCta section={nav} />}
    </div>
  );
}

function CmsNav({ section }: { section: Section }) {
  const c = section.content;
  const links = items(section);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logo = text(c, "logo_url");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/95 backdrop-blur-xl border-b border-white/8" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2">
            {logo ? (
              <CmsImage src={logo} alt={text(c, "logo_text")} className="h-8 w-auto object-contain" />
            ) : (
              <>
                <span className="w-8 h-8 rounded-lg bg-[#D9FC67] flex items-center justify-center">
                  <Mic className="w-4 h-4 text-black" />
                </span>
                <span className="text-xl font-bold tracking-tight text-white">
                  {text(c, "logo_text")}
                  <span className="text-[#D9FC67]">{text(c, "logo_accent")}</span>
                </span>
              </>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {links.map((link, i) => (
              <a
                key={i}
                href={String(link.url ?? "#")}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {String(link.label ?? "")}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {text(c, "cta_secondary_text") && (
              <Link href={text(c, "cta_secondary_url") || "#"} className="hidden sm:block">
                <span className="text-sm text-white/70 hover:text-white px-4 py-2 transition-colors">
                  {text(c, "cta_secondary_text")}
                </span>
              </Link>
            )}
            {text(c, "cta_text") && (
              <Link href={text(c, "cta_url") || "#"}>
                <span className="inline-block bg-[#D9FC67] text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#E8FF8A] transition-all">
                  {text(c, "cta_text")}
                </span>
              </Link>
            )}
            <button
              className="lg:hidden text-white/70 hover:text-white p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-black/98 border-t border-white/8 px-4 py-6 space-y-4">
          {links.map((link, i) => (
            <a
              key={i}
              href={String(link.url ?? "#")}
              className="block text-white/70 hover:text-white py-2 text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {String(link.label ?? "")}
            </a>
          ))}
          <div className="pt-2 border-t border-white/8 flex flex-col gap-2">
            {text(c, "cta_secondary_text") && (
              <Link href={text(c, "cta_secondary_url") || "#"}>
                <span className="block w-full text-center text-sm text-white/70 border border-white/10 rounded-xl py-2.5 hover:bg-white/5 transition-all">
                  {text(c, "cta_secondary_text")}
                </span>
              </Link>
            )}
            {text(c, "cta_text") && (
              <Link href={text(c, "cta_url") || "#"}>
                <span className="block w-full text-center bg-[#D9FC67] text-black text-sm font-semibold rounded-xl py-2.5 hover:bg-[#E8FF8A] transition-all">
                  {text(c, "cta_text")}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function StickyCta({ section }: { section: Section }) {
  const c = section.content;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const label = text(c, "sticky_cta_text");
  const button = text(c, "sticky_cta_button");
  if (!label && !button) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#D9FC67]/15 border border-[#D9FC67]/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-[#D9FC67]" />
            </span>
            <p className="text-white text-sm font-semibold">{label}</p>
          </div>
          {button && (
            <Link href={text(c, "sticky_cta_url") || "#"} className="w-full sm:w-auto">
              <span className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D9FC67] text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#E8FF8A] transition-all">
                {button}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function CmsFooter({ section }: { section: Section }) {
  const c = section.content;
  const links = items(section);

  const columns = links.reduce<Record<string, { label: string; url: string }[]>>((acc, link) => {
    const column = String(link.column ?? "Links");
    (acc[column] ??= []).push({ label: String(link.label ?? ""), url: String(link.url ?? "#") });
    return acc;
  }, {});

  const socials = [
    { url: text(c, "instagram_url"), Icon: Instagram },
    { url: text(c, "linkedin_url"), Icon: Linkedin },
    { url: text(c, "youtube_url"), Icon: Youtube },
  ].filter((s) => s.url);

  return (
    <footer className="bg-black border-t border-white/5 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <span className="w-8 h-8 rounded-lg bg-[#D9FC67] flex items-center justify-center">
                <Mic className="w-4 h-4 text-black" />
              </span>
              <span className="text-xl font-bold text-white">{text(c, "logo_text") || "PodX"}</span>
            </Link>
            {text(c, "tagline") && (
              <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">{text(c, "tagline")}</p>
            )}
            {socials.length > 0 && (
              <div className="flex items-center gap-3">
                {socials.map(({ url, Icon }, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {Object.entries(columns).slice(0, 1).map(([title, list]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-widest">{title}</h4>
              <ul className="space-y-3">
                {list.map((link, i) => (
                  <li key={i}>
                    <Link href={link.url} className="text-white/40 hover:text-white text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-widest">Contact</h4>
            <ul className="space-y-4">
              {text(c, "address") && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <span className="text-white/40 text-sm">{text(c, "address")}</span>
                </li>
              )}
              {text(c, "email") && (
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${text(c, "email")}`} className="text-white/40 hover:text-white text-sm transition-colors">
                    {text(c, "email")}
                  </a>
                </li>
              )}
              {text(c, "phone") && (
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#D9FC67] mt-0.5 flex-shrink-0" />
                  <a href={`tel:${text(c, "phone")}`} className="text-white/40 hover:text-white text-sm transition-colors">
                    {text(c, "phone")}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} {text(c, "copyright_text") || "Yanisa Studios. All rights reserved."}
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {Object.entries(columns).slice(1).flatMap(([, list]) => list).map((link, i) => (
              <Link
                key={i}
                href={link.url}
                className="text-white/20 hover:text-white/60 text-xs transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

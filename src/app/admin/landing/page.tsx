"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, FileText, Layout, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cmsFetch } from "@/components/admin/cms/api";

interface PageRow {
  slug: string;
  title: string;
  description: string;
  path: string;
  status: "draft" | "published";
  has_unpublished_changes: boolean;
  published_at: string | null;
  updated_at: string | null;
  provisioned: boolean;
}

export default function LandingPagesHub() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cmsFetch<{ pages: PageRow[] }>("/api/admin/cms/pages").then((result) => {
      if (!result.ok) setError(result.error ?? "Could not load landing pages");
      else setPages(result.data?.pages ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#D9FC67] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-white/40">
          Build and publish the public landing pages. Each page is made of sections you can add, reorder,
          hide and edit without touching code.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pages.map((page) => (
          <Link key={page.slug} href={`/admin/landing/${page.slug}`} className="group">
            <div className="bg-[#141414] border border-white/5 hover:border-[#D9FC67]/30 rounded-2xl p-6 transition-colors h-full">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center text-[#D9FC67]">
                    <Layout className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-white font-semibold">{page.title}</h3>
                    <p className="text-white/30 text-xs">{page.path}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#D9FC67] group-hover:translate-x-1 transition-all" />
              </div>

              <p className="text-white/40 text-sm mb-4">{page.description}</p>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 border",
                    page.status === "published"
                      ? page.has_unpublished_changes
                        ? "text-[#D9FC67] bg-[#D9FC67]/10 border-[#D9FC67]/25"
                        : "text-green-300 bg-green-500/10 border-green-500/20"
                      : "text-amber-300 bg-amber-500/10 border-amber-500/20",
                  )}
                >
                  {page.status === "published"
                    ? page.has_unpublished_changes
                      ? "Published · unpublished changes"
                      : "Published"
                    : "Draft — built-in page is live"}
                </span>
                {page.published_at && (
                  <span className="text-white/25">
                    Last published {new Date(page.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 flex-shrink-0">
            <FileText className="w-4 h-4" />
          </span>
          <div className="flex-1">
            <h3 className="text-white text-sm font-medium">Legacy homepage editor</h3>
            <p className="text-white/40 text-sm mt-1">
              The original tab-based editor for the homepage. It writes to the old content table, which the
              homepage falls back to until the Client Landing Page is published above.
            </p>
            <Link
              href="/admin/landing/legacy"
              className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mt-2 transition-colors"
            >
              Open legacy editor <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

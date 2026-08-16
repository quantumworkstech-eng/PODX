import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CmsLandingPage } from "@/components/cms/CmsLandingPage";
import { HomeLandingPage } from "@/components/cms/HomeLandingPage";
import { getAdminEmail } from "@/lib/admin-auth";
import { getDraftPage } from "@/lib/cms/server";
import { SEED_PAGES } from "@/lib/cms/seeds";

export const dynamic = "force-dynamic";

/**
 * Admin-only preview of the *draft* page — exactly what publishing would make
 * live, including hidden sections and items being left out. The banner reports
 * how much of the page is currently hidden.
 */
export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SEED_PAGES[slug]) notFound();

  const adminEmail = await getAdminEmail();
  if (!adminEmail) redirect("/admin/login");

  let draft: Awaited<ReturnType<typeof getDraftPage>>;
  try {
    draft = await getDraftPage(slug);
  } catch (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-white text-lg font-semibold mb-2">Preview unavailable</h1>
          <p className="text-white/50 text-sm mb-4">
            {error instanceof Error ? error.message : "Could not load the draft page."}
          </p>
          <Link href={`/admin/landing/${slug}`} className="text-[#D9FC67] text-sm underline">
            Back to editor
          </Link>
        </div>
      </div>
    );
  }

  const { page, sections } = draft;
  const visible = sections.filter((section) => section.is_visible);

  return (
    <div className="bg-black min-h-screen">
      <div className="sticky top-0 z-[60] bg-[#D9FC67] text-black text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">
            Draft preview — {page.title}
            {page.has_unpublished_changes && " · not yet published"}
          </span>
          <span className="flex items-center gap-4">
            <span className="opacity-70">
              {visible.length} of {sections.length} sections visible
            </span>
            <Link href={`/admin/landing/${slug}`} className="underline font-medium">
              Back to editor
            </Link>
          </span>
        </div>
      </div>

      {slug === "home" ? (
        <>
          <Header />
          <main className="bg-background">
            <HomeLandingPage sections={visible} />
          </main>
        </>
      ) : (
        <CmsLandingPage sections={visible} />
      )}
    </div>
  );
}

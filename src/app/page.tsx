import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { HomeLandingPage } from "@/components/cms/HomeLandingPage";
import { getPublishedSnapshot } from "@/lib/cms/server";
import { LegacyHome } from "./LegacyHome";

// Publishing calls revalidatePath("/"), so a long window is safe here.
export const revalidate = 300;

const SLUG = "home";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getPublishedSnapshot(SLUG);
  const seo = snapshot?.seo;
  if (!seo) return {};

  return {
    title: seo.seo_title ?? undefined,
    description: seo.meta_description ?? undefined,
    alternates: seo.canonical_url ? { canonical: seo.canonical_url } : undefined,
    openGraph: {
      title: seo.og_title ?? seo.seo_title ?? undefined,
      description: seo.og_description ?? seo.meta_description ?? undefined,
      images: seo.og_image_url ? [seo.og_image_url] : undefined,
    },
  };
}

export default async function Home() {
  const snapshot = await getPublishedSnapshot(SLUG);

  return (
    <>
      <Header />
      <main className="bg-background">
        {snapshot && snapshot.sections.length > 0 ? (
          <HomeLandingPage sections={snapshot.sections} />
        ) : (
          <LegacyHome />
        )}
      </main>
    </>
  );
}

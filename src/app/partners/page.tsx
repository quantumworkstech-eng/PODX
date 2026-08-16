import type { Metadata } from "next";
import { CmsLandingPage } from "@/components/cms/CmsLandingPage";
import { getPublishedSnapshot } from "@/lib/cms/server";
import { StaticPartnerLanding } from "./StaticPartnerLanding";

// Published content is snapshotted, so a long window is safe — publishing calls
// revalidatePath("/partners") to push changes out immediately.
export const revalidate = 300;

const SLUG = "partners";

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

export default async function PartnersPage() {
  const snapshot = await getPublishedSnapshot(SLUG);

  if (!snapshot || snapshot.sections.length === 0) {
    return <StaticPartnerLanding />;
  }

  return <CmsLandingPage sections={snapshot.sections} />;
}

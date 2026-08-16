import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/admin/cms/PageBuilder";
import { SEED_PAGES } from "@/lib/cms/seeds";

export default async function LandingPageBuilder({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = SEED_PAGES[slug];
  if (!meta) notFound();

  return <PageBuilder slug={slug} title={meta.title} path={meta.path} />;
}

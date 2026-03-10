// This page handles custom domain routing.
// When a request comes in from booking.example.com, middleware rewrites to /domain-proxy?_domain=booking.example.com
// This page looks up the partner by custom domain and redirects to the proper /p/[slug] path.

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function DomainProxyPage({
  searchParams,
}: {
  searchParams: { _domain?: string };
}) {
  const domain = searchParams._domain;

  if (!domain) {
    redirect("/");
  }

  // Look up partner by custom domain
  const { data: branding } = await supabase
    .from("partner_branding")
    .select("partner_slug")
    .eq("custom_domain", domain)
    .eq("domain_verified", true)
    .eq("is_published", true)
    .eq("admin_disabled", false)
    .single();

  if (!branding?.partner_slug) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-xl font-medium">Domain not configured</p>
          <p className="text-white/30 text-sm mt-2">This domain is not linked to an active booking platform.</p>
        </div>
      </div>
    );
  }

  redirect(`/p/${branding.partner_slug}`);
}

import type { Studio } from "@/lib/types";

type StudioDetailResponse = {
  packages?: { price_per_hour?: number | string | null }[];
  images?: { image_url?: string | null }[];
  booking_inventory?: Studio["booking_inventory"];
  setup_options?: Studio["setup_options"];
};

/** Merge the full studio record (rooms/setups, booking inventory, gallery, package
 *  price) into a list-shaped Studio. Returns the input unchanged on failure, so the
 *  caller can use reference equality to tell whether anything was added. */
export async function enrichStudioForBooking(studio: Studio): Promise<Studio> {
  try {
    const r = await fetch(`/api/studios/${encodeURIComponent(studio.id)}`);
    if (!r.ok) return studio;
    const data: StudioDetailResponse = await r.json();

    const images = (data.images || [])
      .map((img) => img.image_url)
      .filter((url): url is string => !!url);
    const firstPkgPrice = Number(data.packages?.[0]?.price_per_hour);

    return {
      ...studio,
      booking_inventory: data.booking_inventory ?? null,
      image_urls: images.length > 0 ? images : studio.image_urls,
      setup_options: data.setup_options || [],
      price_per_hour: Number.isFinite(firstPkgPrice) ? firstPkgPrice : studio.price_per_hour,
    };
  } catch {
    return studio;
  }
}

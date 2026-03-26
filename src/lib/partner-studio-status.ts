/** Event so partner layout can refresh studio counts when My Studios list changes. */
export const PARTNER_STUDIOS_CHANGED = "partner-studios-changed";

export function notifyPartnerStudiosChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PARTNER_STUDIOS_CHANGED));
  }
}

/** Matches the green "Active" badge on partner studio cards (not "In Review"). */
export function isPartnerStudioVisibleActive(studio: {
  status: string;
  review_status?: string;
}) {
  return studio.review_status !== "pending_review" && studio.status === "active";
}

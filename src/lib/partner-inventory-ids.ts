/** Public booking/API id for a partner-defined add-on (not a platform_addons row). */
export const PARTNER_ADDON_PREFIX = "paddon_";

export function toPartnerAddonPublicId(uuid: string): string {
  return `${PARTNER_ADDON_PREFIX}${uuid}`;
}

export function parsePartnerAddonPublicId(id: string): string | null {
  if (!id.startsWith(PARTNER_ADDON_PREFIX)) return null;
  const raw = id.slice(PARTNER_ADDON_PREFIX.length);
  return raw.length > 0 ? raw : null;
}

export function isPartnerAddonPublicId(id: string): boolean {
  return id.startsWith(PARTNER_ADDON_PREFIX);
}

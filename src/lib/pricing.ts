/**
 * Studio pricing helpers — single source of truth for the customer-facing
 * per-hour price shown across the marketplace, dashboards and landing pages.
 *
 * Model:
 *  - A studio's canonical "base package price" is the price of its CHEAPEST
 *    package (by original price_per_hour). If it has no packages, the cheapest
 *    active room price is used as a fallback.
 *  - Each package can carry a discount_percentage. The base (cheapest) package's
 *    discount drives what customers see and pay.
 *  - The displayed / charged price is the discounted price; the original base
 *    price is shown struck-through only when a discount applies.
 */

/** Apply a percentage discount to a base price, rounded to the nearest rupee. */
export function discountedPrice(basePrice: number, discountPct?: number | null): number {
  const base = Number(basePrice) || 0;
  const pct = Number(discountPct) || 0;
  if (pct <= 0 || base <= 0) return base;
  return Math.round(base * (1 - Math.min(pct, 100) / 100));
}

export interface PackagePricing {
  price_per_hour: number | string | null | undefined;
  discount_percentage?: number | string | null;
}

export interface RoomPricing {
  price_per_hour: number | string | null | undefined;
}

export interface BasePricing {
  /** Discounted price customers see and pay (equals basePrice when no discount). */
  price: number;
  /** Original base price, present only when a discount applies (for strike-through). */
  originalPrice?: number;
  /** The discount percentage that was applied (0 when none). */
  discountPercentage: number;
}

/**
 * Resolve a studio's canonical base pricing from its packages (preferred) or
 * rooms (fallback). Picks the cheapest package by original price and applies
 * that package's discount.
 */
export function resolveBasePricing(
  packages: PackagePricing[] | null | undefined,
  rooms: RoomPricing[] | null | undefined = []
): BasePricing {
  const pkgs = (packages ?? [])
    .map((p) => ({
      price: Number(p.price_per_hour) || 0,
      discount: Number(p.discount_percentage) || 0,
    }))
    .filter((p) => p.price > 0);

  if (pkgs.length > 0) {
    const base = pkgs.reduce((a, b) => (b.price < a.price ? b : a));
    const price = discountedPrice(base.price, base.discount);
    return {
      price,
      originalPrice: base.discount > 0 && price < base.price ? base.price : undefined,
      discountPercentage: base.discount > 0 ? base.discount : 0,
    };
  }

  const roomPrices = (rooms ?? [])
    .map((r) => Number(r.price_per_hour) || 0)
    .filter((n) => n > 0);
  const price = roomPrices.length > 0 ? Math.min(...roomPrices) : 0;
  return { price, discountPercentage: 0 };
}

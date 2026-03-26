/**
 * PostgREST/Supabase error when `partner_coupons` was never migrated.
 */
export function couponTableSetupError(dbMessage: string | undefined): string | null {
  if (!dbMessage) return null;
  const m = dbMessage.toLowerCase();
  if (
    m.includes("partner_coupons") &&
    (m.includes("schema cache") || m.includes("does not exist"))
  ) {
    return "Coupon tables are not set up yet. Open Supabase → SQL Editor, paste and run src/db/coupon_migration.sql (or run npm run db:migrate-coupons with DATABASE_URL).";
  }
  return null;
}

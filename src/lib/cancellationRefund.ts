/** Mandatory platform fee deducted from any eligible cancellation refund (percent of gross refund amount). */
export const MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT = 2;

export type CancellationRefundBreakdown = {
  totalPrice: number;
  refundPolicyPercent: number;
  /** Amount before mandatory fee (per cancellation policy tiers). */
  grossRefundAmount: number;
  /** 2% of gross refund when gross refund is positive */
  mandatoryFeeAmount: number;
  /** Amount returned to customer after mandatory fee */
  refundAmount: number;
  /** Portion not covered by refund policy */
  withheldByPolicyAmount: number;
};

export function computeCancellationRefundBreakdown(
  totalPrice: number,
  refundPolicyPercent: number
): CancellationRefundBreakdown {
  const price = Number(totalPrice) || 0;
  const pct = Math.min(100, Math.max(0, Number(refundPolicyPercent) || 0));
  const grossRefundAmount = Math.round((price * pct) / 100);
  const mandatoryFeeAmount =
    grossRefundAmount > 0
      ? Math.round(grossRefundAmount * (MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT / 100))
      : 0;
  const refundAmount = Math.max(0, grossRefundAmount - mandatoryFeeAmount);

  return {
    totalPrice: price,
    refundPolicyPercent: pct,
    grossRefundAmount,
    mandatoryFeeAmount,
    refundAmount,
    withheldByPolicyAmount: Math.max(0, price - grossRefundAmount),
  };
}

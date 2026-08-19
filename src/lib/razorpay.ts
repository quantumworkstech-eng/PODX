/**
 * Server-side Razorpay lookups.
 *
 * Payment and refund emails must be driven by a verified backend payment status
 * (or the webhook), never by the frontend success screen — so anything that
 * triggers money-related mail confirms the state here first.
 */

export type RazorpayPayment = {
  id: string;
  status: string; // created | authorized | captured | refunded | failed
  amount: number; // paise
  currency: string;
  order_id?: string;
  error_description?: string;
  error_reason?: string;
};

function credentials(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

async function razorpayGet<T>(path: string): Promise<T | null> {
  const creds = credentials();
  if (!creds) return null;

  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
  try {
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`Razorpay GET ${path} failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Razorpay GET ${path} error:`, err);
    return null;
  }
}

export async function fetchPayment(paymentId: string): Promise<RazorpayPayment | null> {
  if (!paymentId || !paymentId.startsWith('pay_')) return null;
  return razorpayGet<RazorpayPayment>(`/payments/${paymentId}`);
}

/**
 * True only when Razorpay itself reports the payment as captured. Returns null
 * when the gateway could not be reached or is not configured, so callers can
 * tell "not paid" apart from "could not check".
 */
export async function isPaymentCaptured(paymentId: string): Promise<boolean | null> {
  if (!credentials()) return null;
  const payment = await fetchPayment(paymentId);
  if (!payment) return null;
  return payment.status === 'captured' || payment.status === 'refunded';
}

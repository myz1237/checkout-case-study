import "server-only";
import { findPaymentsByReference, getPayment, getPaymentActions, type PaymentDetails } from "./checkout-api";
import { allCredentials, type Credentials } from "./credentials";
import { MARKETS, type MarketId } from "./markets";
import { parsePaymentId } from "./payment-view";
import { refundableAmount, refundedAmount } from "./refund";

export type AdminLookup = {
  payment: PaymentDetails;
  /** Market whose credentials own the payment; null means the default set. */
  market: MarketId | null;
  refunded: number;
  refundable: number;
};

/** Finds a payment by Checkout.com id or by our order reference across every configured account. */
export async function lookupPayment(query: string): Promise<AdminLookup | null> {
  const q = query.trim();
  if (!q) return null;
  const candidates = allCredentials(Object.keys(MARKETS) as MarketId[]);
  const id = parsePaymentId(q);
  for (const creds of candidates) {
    const payment = id ? await getPayment(creds, id) : await newestByReference(creds, q);
    if (!payment) continue;
    const actions = await getPaymentActions(creds, payment.id).catch(() => []);
    return {
      payment,
      market: creds.market === "default" ? null : creds.market,
      refunded: refundedAmount(actions),
      refundable: refundableAmount(payment, actions),
    };
  }
  return null;
}

async function newestByReference(creds: Credentials, reference: string): Promise<PaymentDetails | null> {
  const list = await findPaymentsByReference(creds, reference);
  return list[0] ?? null;
}

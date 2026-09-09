import "server-only";
import { getPayment, getPaymentActions, type PaymentDetails } from "./checkout-api";
import { allCredentials, credentialsFor, type Credentials } from "./credentials";
import { isMarketId, MARKETS, type MarketId } from "./markets";
import { isPending, isSuccessful, parsePaymentId } from "./payment-view";
import { refundableAmount, refundedAmount } from "./refund";

export type RefundState = { refunded: number; refundable: number };

export type Outcome =
  | { kind: "success" | "pending" | "failed"; payment: PaymentDetails; paymentId: string; market: MarketId | null; refund?: RefundState }
  | { kind: "missing"; payment: null; paymentId: null; market: null }
  | { kind: "not_found"; payment: null; paymentId: string; market: null }
  | { kind: "unavailable"; payment: null; paymentId: string; market: null };

/** Resolves an outcome page from the query string via Get payment details, using the market's credentials or trying every set. */
export async function loadOutcome(idParam: unknown, marketParam: unknown): Promise<Outcome> {
  const paymentId = parsePaymentId(idParam);
  if (!paymentId) return { kind: "missing", payment: null, paymentId: null, market: null };
  const market = isMarketId(marketParam) ? marketParam : null;
  const candidates: Credentials[] = market
    ? [credentialsFor(market)]
    : allCredentials(Object.keys(MARKETS) as MarketId[]);

  let payment: PaymentDetails | null = null;
  let refund: RefundState | undefined;
  try {
    for (const creds of candidates) {
      payment = await getPayment(creds, paymentId);
      if (payment) {
        if (isSuccessful(payment)) {
          const actions = await getPaymentActions(creds, paymentId).catch(() => []);
          refund = { refunded: refundedAmount(actions), refundable: refundableAmount(payment, actions) };
        }
        break;
      }
    }
  } catch (err) {
    console.error("could not retrieve payment", paymentId, err);
    return { kind: "unavailable", payment: null, paymentId, market: null };
  }
  if (!payment) return { kind: "not_found", payment: null, paymentId, market: null };
  if (isSuccessful(payment)) return { kind: "success", payment, paymentId, market, refund };
  if (isPending(payment)) return { kind: "pending", payment, paymentId, market };
  return { kind: "failed", payment, paymentId, market };
}

export function outcomeQuery(paymentId: string, market: MarketId | null): string {
  const q = new URLSearchParams({ "cko-payment-id": paymentId });
  if (market) q.set("market", market);
  return q.toString();
}

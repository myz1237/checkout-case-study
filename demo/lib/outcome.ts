import "server-only";
import { getPayment, type PaymentDetails } from "./checkout-api";
import { isPending, isSuccessful, parsePaymentId } from "./payment-view";

export type Outcome =
  | { kind: "success" | "pending" | "failed"; payment: PaymentDetails; paymentId: string }
  | { kind: "missing"; payment: null; paymentId: null }
  | { kind: "not_found"; payment: null; paymentId: string }
  | { kind: "unavailable"; payment: null; paymentId: string };

/** Resolve the outcome page state from the query string, always via Get payment details. */
export async function loadOutcome(param: unknown): Promise<Outcome> {
  const paymentId = parsePaymentId(param);
  if (!paymentId) return { kind: "missing", payment: null, paymentId: null };
  let payment: PaymentDetails | null;
  try {
    payment = await getPayment(paymentId);
  } catch (err) {
    console.error("could not retrieve payment", paymentId, err);
    return { kind: "unavailable", payment: null, paymentId };
  }
  if (!payment) return { kind: "not_found", payment: null, paymentId };
  if (isSuccessful(payment)) return { kind: "success", payment, paymentId };
  if (isPending(payment)) return { kind: "pending", payment, paymentId };
  return { kind: "failed", payment, paymentId };
}

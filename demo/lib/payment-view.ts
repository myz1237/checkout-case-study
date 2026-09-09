import type { PaymentDetails } from "./checkout-api";

/** Statuses that mean the money side succeeded. */
const SUCCESS_STATUSES = new Set(["Authorized", "Captured", "Paid", "Card Verified", "Partially Refunded", "Refunded"]);
/** Asynchronous methods (e.g. iDEAL) can land on success_url before the capture is final. */
const PENDING_STATUSES = new Set(["Pending", "Authorization Pending", "Capture Pending"]);

export function isSuccessful(payment: PaymentDetails): boolean {
  return payment.approved && SUCCESS_STATUSES.has(payment.status);
}

export function isPending(payment: PaymentDetails): boolean {
  return PENDING_STATUSES.has(payment.status);
}

export function paymentMethodLabel(payment: PaymentDetails): string {
  const s = payment.source ?? {};
  switch (s.type) {
    case "card": {
      const parts = [s.scheme, s.last4 ? `•••• ${s.last4}` : undefined].filter(Boolean);
      return parts.length ? `Card (${parts.join(" ")})` : "Card";
    }
    case "applepay":
      return "Apple Pay";
    case "ideal":
      return "iDEAL";
    case undefined:
      return "Unknown";
    default:
      return s.type;
  }
}

/** Only a Checkout.com payment id is accepted; anything else is ignored. */
export function parsePaymentId(value: unknown): string | null {
  return typeof value === "string" && /^pay_[a-z0-9]{26}$/i.test(value) ? value : null;
}

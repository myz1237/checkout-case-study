import type { PaymentDetails } from "./checkout-api";

export type PaymentAction = {
  id?: string;
  type: string;
  amount?: number;
  approved?: boolean;
  response_summary?: string;
  processed_on?: string;
};

/** Sum of approved refunds already made against the payment, in minor units. */
export function refundedAmount(actions: PaymentAction[]): number {
  return actions.filter((a) => a.type === "Refund" && a.approved !== false).reduce((sum, a) => sum + (a.amount ?? 0), 0);
}

/** What can still be refunded: only captured money, minus earlier refunds. */
export function refundableAmount(payment: Pick<PaymentDetails, "status" | "amount">, actions: PaymentAction[]): number {
  if (!["Captured", "Partially Refunded"].includes(payment.status)) return 0;
  return Math.max(0, payment.amount - refundedAmount(actions));
}

/** Parses a major-unit amount typed by a person ("12.50") into minor units; null when not a valid positive amount. */
export function parseRefundAmount(input: string): number | null {
  const text = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const minor = Math.round(Number(text) * 100);
  return minor > 0 ? minor : null;
}

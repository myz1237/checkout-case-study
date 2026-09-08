/**
 * Pure builders for the Checkout.com Payment Session request.
 * Kept free of I/O so the request shape can be unit-tested.
 */

export type PaymentSessionInput = {
  /** Amount in the currency's minor unit (e.g. HKD 199.00 => 19900). */
  amount: number;
  currency: string;
  reference: string;
  /** ISO 3166-1 alpha-2 billing country. */
  country: string;
  /** Origin of the storefront, used to build the success / failure URLs. */
  origin: string;
  processingChannelId: string;
};

export type PaymentSessionRequest = {
  amount: number;
  currency: string;
  reference: string;
  processing_channel_id: string;
  billing: { address: { country: string } };
  success_url: string;
  failure_url: string;
};

export function buildPaymentSessionRequest(
  input: PaymentSessionInput,
): PaymentSessionRequest {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("amount must be a positive integer in minor units");
  }
  const origin = input.origin.replace(/\/+$/, "");
  return {
    amount: input.amount,
    currency: input.currency,
    reference: input.reference,
    processing_channel_id: input.processingChannelId,
    billing: { address: { country: input.country } },
    success_url: `${origin}/success`,
    failure_url: `${origin}/failure`,
  };
}

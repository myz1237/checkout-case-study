/**
 * Pure builders for the Checkout.com Payment Session request.
 * Kept free of I/O so the request shape can be unit-tested.
 */
import type { Currency } from "./catalog";
import { cartTotal, type PricedLine } from "./cart";
import type { Customer } from "./customer";
import type { PaymentMethod } from "./markets";

export type PaymentSessionInput = {
  lines: PricedLine[];
  currency: Currency;
  reference: string;
  /** ISO 3166-1 alpha-2 billing country. */
  country: string;
  /** Explicit allow-list so account-level extras (e.g. Google Pay) never leak into Flow. */
  paymentMethods: PaymentMethod[];
  customer: Customer;
  /** Origin of the storefront, used to build the success / failure URLs. */
  origin: string;
  processingChannelId: string;
};

export type PaymentSessionItem = {
  reference: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
};

/** Shown on the Apple Pay sheet and other wallet UIs instead of the account's legal name. */
export const STORE_DISPLAY_NAME = "Tri Case";

export type PaymentSessionRequest = {
  amount: number;
  currency: string;
  reference: string;
  display_name: string;
  processing_channel_id: string;
  billing: { address: { country: string } };
  enabled_payment_methods: PaymentMethod[];
  customer: { name: string; email: string };
  /** Always request 3DS: SCA is mandatory in the EEA and it is cheap insurance elsewhere. */
  "3ds": { enabled: true };
  items: PaymentSessionItem[];
  success_url: string;
  failure_url: string;
};

export function buildPaymentSessionRequest(
  input: PaymentSessionInput,
): PaymentSessionRequest {
  const amount = cartTotal(input.lines);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("cart total must be a positive integer in minor units");
  }
  const origin = input.origin.replace(/\/+$/, "");
  return {
    amount,
    currency: input.currency,
    reference: input.reference,
    display_name: STORE_DISPLAY_NAME,
    processing_channel_id: input.processingChannelId,
    billing: { address: { country: input.country } },
    enabled_payment_methods: input.paymentMethods,
    customer: { name: input.customer.name, email: input.customer.email },
    "3ds": { enabled: true },
    items: input.lines.map((l) => ({
      reference: l.productId,
      name: l.name,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      total_amount: l.lineTotal,
    })),
    success_url: `${origin}/success`,
    failure_url: `${origin}/failure`,
  };
}

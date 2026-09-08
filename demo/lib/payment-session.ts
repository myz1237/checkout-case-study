import type { Currency } from "./catalog";
import { cartTotal, type PricedLine } from "./cart";
import type { Customer } from "./customer";
import type { MarketId, PaymentMethod } from "./markets";

export type PaymentSessionInput = {
  market: MarketId;
  lines: PricedLine[];
  currency: Currency;
  reference: string;
  country: string;
  paymentMethods: PaymentMethod[];
  customer: Customer;
  customerId?: string;
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
  /** Includes "stored_card" for returning customers; Flow hides stored cards unless it is allow-listed. */
  enabled_payment_methods: (PaymentMethod | "stored_card")[];
  customer: { name: string; email: string };
  payment_method_configuration: {
    card: { store_payment_details: "collect_consent" };
    /** Present for returning customers: Flow lists the cards stored under this customer. */
    stored_card?: { customer_id: string };
  };
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
    enabled_payment_methods: input.customerId ? [...input.paymentMethods, "stored_card"] : input.paymentMethods,
    customer: { name: input.customer.name, email: input.customer.email },
    payment_method_configuration: {
      card: { store_payment_details: "collect_consent" },
      ...(input.customerId ? { stored_card: { customer_id: input.customerId } } : {}),
    },
    "3ds": { enabled: true },
    items: input.lines.map((l) => ({
      reference: l.productId,
      name: l.name,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      total_amount: l.lineTotal,
    })),
    success_url: `${origin}/success?market=${input.market}`,
    failure_url: `${origin}/failure?market=${input.market}`,
  };
}

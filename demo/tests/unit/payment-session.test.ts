import { describe, expect, it } from "vitest";
import { buildPaymentSessionRequest } from "@/lib/payment-session";

const lines = [
  { productId: "moss-silicone", name: "Moss Silicone Case", quantity: 2, unitPrice: 19900, lineTotal: 39800 },
  { productId: "tri-grip", name: "Tri Grip Case", quantity: 1, unitPrice: 24900, lineTotal: 24900 },
];

const base = {
  market: "HK" as const,
  lines,
  currency: "HKD" as const,
  reference: "ORD-1",
  country: "HK",
  paymentMethods: ["card" as const, "applepay" as const],
  customer: { name: "Jia Tsang", email: "jia@example.com" },
  origin: "http://localhost:3000",
  processingChannelId: "pc_test",
};

describe("buildPaymentSessionRequest", () => {
  it("sums the cart and maps lines onto the Checkout.com request shape", () => {
    expect(buildPaymentSessionRequest(base)).toEqual({
      amount: 64700,
      currency: "HKD",
      reference: "ORD-1",
      display_name: "Tri Case",
      processing_channel_id: "pc_test",
      billing: { address: { country: "HK" } },
      enabled_payment_methods: ["card", "applepay"],
      customer: { name: "Jia Tsang", email: "jia@example.com" },
      payment_method_configuration: { card: { store_payment_details: "collect_consent" } },
      "3ds": { enabled: true },
      items: [
        { reference: "moss-silicone", name: "Moss Silicone Case", quantity: 2, unit_price: 19900, total_amount: 39800 },
        { reference: "tri-grip", name: "Tri Grip Case", quantity: 1, unit_price: 24900, total_amount: 24900 },
      ],
      success_url: "http://localhost:3000/success?market=HK",
      failure_url: "http://localhost:3000/failure?market=HK",
    });
  });

  it("derives redirect URLs from the origin without a double slash", () => {
    const req = buildPaymentSessionRequest({ ...base, origin: "https://shop.example/" });
    expect(req.success_url).toBe("https://shop.example/success?market=HK");
    expect(req.failure_url).toBe("https://shop.example/failure?market=HK");
  });

  it("asks Flow to show the stored cards of a known customer", () => {
    expect(buildPaymentSessionRequest({ ...base, customerId: "cus_1" }).payment_method_configuration).toEqual({
      card: { store_payment_details: "collect_consent" },
      stored_card: { customer_id: "cus_1" },
    });
    expect(buildPaymentSessionRequest({ ...base, customerId: "cus_1" }).enabled_payment_methods).toEqual(["card", "applepay", "stored_card"]);
    expect(buildPaymentSessionRequest(base).payment_method_configuration.stored_card).toBeUndefined();
    expect(buildPaymentSessionRequest(base).enabled_payment_methods).toEqual(["card", "applepay"]);
  });

  it("rejects an empty cart", () => {
    expect(() => buildPaymentSessionRequest({ ...base, lines: [] })).toThrow();
  });
});

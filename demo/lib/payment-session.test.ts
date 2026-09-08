import { describe, expect, it } from "vitest";
import { buildPaymentSessionRequest } from "./payment-session";

const base = {
  amount: 19900,
  currency: "HKD",
  reference: "ORD-1",
  country: "HK",
  origin: "http://localhost:3000",
  processingChannelId: "pc_test",
};

describe("buildPaymentSessionRequest", () => {
  it("maps the storefront input onto the Checkout.com request shape", () => {
    expect(buildPaymentSessionRequest(base)).toEqual({
      amount: 19900,
      currency: "HKD",
      reference: "ORD-1",
      processing_channel_id: "pc_test",
      billing: { address: { country: "HK" } },
      success_url: "http://localhost:3000/success",
      failure_url: "http://localhost:3000/failure",
    });
  });

  it("derives redirect URLs from the origin without a double slash", () => {
    const req = buildPaymentSessionRequest({ ...base, origin: "https://shop.example/" });
    expect(req.success_url).toBe("https://shop.example/success");
    expect(req.failure_url).toBe("https://shop.example/failure");
  });

  it("rejects non-integer or non-positive amounts", () => {
    expect(() => buildPaymentSessionRequest({ ...base, amount: 199.5 })).toThrow();
    expect(() => buildPaymentSessionRequest({ ...base, amount: 0 })).toThrow();
  });
});

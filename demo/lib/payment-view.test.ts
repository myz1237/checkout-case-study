import { describe, expect, it } from "vitest";
import { isSuccessful, parsePaymentId, paymentMethodLabel } from "./payment-view";

const base = { id: "pay_x", status: "Captured", approved: true, amount: 100, currency: "HKD" };

describe("payment view helpers", () => {
  it("treats Authorized and Captured as success, declines as failure", () => {
    expect(isSuccessful({ ...base, status: "Authorized" })).toBe(true);
    expect(isSuccessful({ ...base, status: "Captured" })).toBe(true);
    expect(isSuccessful({ ...base, status: "Declined", approved: false })).toBe(false);
    expect(isSuccessful({ ...base, status: "Pending" })).toBe(false);
  });

  it("labels payment methods", () => {
    expect(paymentMethodLabel({ ...base, source: { type: "card", scheme: "Visa", last4: "4242" } })).toBe("Card (Visa •••• 4242)");
    expect(paymentMethodLabel({ ...base, source: { type: "ideal" } })).toBe("iDEAL");
    expect(paymentMethodLabel({ ...base, source: { type: "applepay" } })).toBe("Apple Pay");
    expect(paymentMethodLabel(base)).toBe("Unknown");
  });

  it("accepts only well-formed payment ids", () => {
    expect(parsePaymentId("pay_zdi2yzabj2pi5jjucpouo7m2ua")).toBe("pay_zdi2yzabj2pi5jjucpouo7m2ua");
    expect(parsePaymentId("../etc")).toBeNull();
    expect(parsePaymentId(["pay_zdi2yzabj2pi5jjucpouo7m2ua"])).toBeNull();
  });
});

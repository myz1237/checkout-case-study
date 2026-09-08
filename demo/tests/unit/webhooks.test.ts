import { describe, expect, it } from "vitest";
import { describeEvent, isTrackedEvent, signWebhook, verifyWebhook } from "@/lib/webhooks";

const keys = { authHeaderKey: "auth-key", signatureKey: "sign-key" };
const body = JSON.stringify({ type: "payment_captured", data: { id: "pay_1", reference: "ORD-1", amount: 19900, currency: "HKD" } });

describe("webhooks", () => {
  it("accepts a request with the right Authorization header and signature", () => {
    const signature = signWebhook(body, keys.signatureKey);
    expect(verifyWebhook({ authorization: "auth-key", signature }, body, keys)).toEqual({ ok: true });
    expect(verifyWebhook({ authorization: "auth-key", signature: signature.toUpperCase() }, body, keys)).toEqual({ ok: true });
  });

  it("rejects a wrong Authorization header before checking the signature", () => {
    const signature = signWebhook(body, keys.signatureKey);
    expect(verifyWebhook({ authorization: "nope", signature }, body, keys)).toEqual({ ok: false, reason: "authorization" });
    expect(verifyWebhook({ authorization: null, signature }, body, keys)).toEqual({ ok: false, reason: "authorization" });
  });

  it("rejects a tampered body or a missing signature", () => {
    const signature = signWebhook(body, keys.signatureKey);
    expect(verifyWebhook({ authorization: "auth-key", signature }, body + " ", keys)).toEqual({ ok: false, reason: "signature" });
    expect(verifyWebhook({ authorization: "auth-key", signature: null }, body, keys)).toEqual({ ok: false, reason: "signature" });
  });

  it("tracks only the three payment events and summarises them", () => {
    expect(isTrackedEvent("payment_approved")).toBe(true);
    expect(isTrackedEvent("payment_refunded")).toBe(false);
    expect(describeEvent(JSON.parse(body))).toBe("payment_captured pay_1 ORD-1 199.00 HKD");
    expect(describeEvent({ type: "payment_declined", data: { id: "pay_2", amount: 100, currency: "EUR", response_code: "20051", response_summary: "Insufficient Funds" } }))
      .toBe("payment_declined pay_2 1.00 EUR 20051 Insufficient Funds");
  });
});

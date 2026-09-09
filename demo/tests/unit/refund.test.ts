import { describe, expect, it } from "vitest";
import { parseRefundAmount, refundableAmount, refundedAmount } from "@/lib/refund";

const actions = [
  { type: "Authorization", amount: 19900, approved: true },
  { type: "Capture", amount: 19900, approved: true },
  { type: "Refund", amount: 5000, approved: true },
  { type: "Refund", amount: 100, approved: false },
];

describe("refund helpers", () => {
  it("sums only approved refunds", () => {
    expect(refundedAmount(actions)).toBe(5000);
    expect(refundedAmount([])).toBe(0);
  });

  it("allows refunds only on captured money", () => {
    expect(refundableAmount({ status: "Captured", amount: 19900 }, actions)).toBe(14900);
    expect(refundableAmount({ status: "Partially Refunded", amount: 19900 }, actions)).toBe(14900);
    expect(refundableAmount({ status: "Refunded", amount: 19900 }, [{ type: "Refund", amount: 19900, approved: true }])).toBe(0);
    expect(refundableAmount({ status: "Authorized", amount: 19900 }, [])).toBe(0);
  });

  it("parses typed amounts into minor units", () => {
    expect(parseRefundAmount("12.50")).toBe(1250);
    expect(parseRefundAmount("12,5")).toBe(1250);
    expect(parseRefundAmount("199")).toBe(19900);
    expect(parseRefundAmount("0")).toBeNull();
    expect(parseRefundAmount("1.234")).toBeNull();
    expect(parseRefundAmount("abc")).toBeNull();
  });
});

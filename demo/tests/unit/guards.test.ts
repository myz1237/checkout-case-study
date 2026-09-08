import { describe, expect, it } from "vitest";
import { isCartLines, isCheckoutState, isCustomer } from "@/lib/guards";

describe("guards", () => {
  it("accepts only integer quantities within range", () => {
    expect(isCartLines([{ productId: "a", quantity: 1 }])).toBe(true);
    expect(isCartLines([{ productId: "a", quantity: 0.5 }])).toBe(false);
    expect(isCartLines([{ productId: "a", quantity: 0 }])).toBe(false);
    expect(isCartLines([{ productId: "a", quantity: 11 }])).toBe(false);
    expect(isCartLines([{ productId: "a", quantity: NaN }])).toBe(false);
    expect(isCartLines({})).toBe(false);
  });

  it("rejects malformed customer and checkout state", () => {
    expect(isCustomer("x")).toBe(false);
    expect(isCustomer({ name: "a", email: "b" })).toBe(true);
    expect(isCheckoutState(null)).toBe(false);
    expect(isCheckoutState({ locked: true, session: {}, publicKey: "pk" })).toBe(false);
    expect(isCheckoutState({ locked: true, session: { id: "ps_1" } })).toBe(false);
    expect(isCheckoutState({ locked: true, session: { id: "ps_1" }, publicKey: "pk" })).toBe(true);
    expect(isCheckoutState({ locked: false, session: null, publicKey: null })).toBe(true);
  });
});

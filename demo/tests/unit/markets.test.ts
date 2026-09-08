import { describe, expect, it } from "vitest";
import { getMarket, MARKETS } from "@/lib/markets";

describe("markets", () => {
  it("defines the payment method matrix from the requirements", () => {
    expect(MARKETS.HK.paymentMethods).toEqual(["card", "applepay"]);
    expect(MARKETS.NL.paymentMethods).toEqual(["card", "ideal"]);
    expect(MARKETS.HK.currency).toBe("HKD");
    expect(MARKETS.NL.currency).toBe("EUR");
  });

  it("falls back to Hong Kong for unknown market ids", () => {
    expect(getMarket("XX").id).toBe("HK");
    expect(getMarket(undefined).id).toBe("HK");
    expect(getMarket("NL").id).toBe("NL");
  });
});

import { describe, expect, it } from "vitest";
import { getMarket, MARKETS, paymentMethodsFor, resolveCurrency } from "@/lib/markets";

describe("markets", () => {
  it("defines the payment method matrix from the requirements", () => {
    expect(MARKETS.HK.paymentMethods).toEqual(["card", "applepay"]);
    expect(MARKETS.NL.paymentMethods).toEqual(["card", "ideal"]);
    expect(MARKETS.HK.currencies).toEqual(["HKD", "USD"]);
    expect(MARKETS.NL.currencies).toEqual(["EUR", "USD"]);
  });

  it("falls back to Hong Kong for unknown market ids", () => {
    expect(getMarket("XX").id).toBe("HK");
    expect(getMarket(undefined).id).toBe("HK");
    expect(getMarket("NL").id).toBe("NL");
  });

  it("keeps a stored currency only if the market offers it", () => {
    expect(resolveCurrency(MARKETS.HK, "USD")).toBe("USD");
    expect(resolveCurrency(MARKETS.HK, "EUR")).toBe("HKD");
    expect(resolveCurrency(MARKETS.NL, undefined)).toBe("EUR");
  });

  it("drops iDEAL outside EUR", () => {
    expect(paymentMethodsFor(MARKETS.NL, "EUR")).toEqual(["card", "ideal"]);
    expect(paymentMethodsFor(MARKETS.NL, "USD")).toEqual(["card"]);
    expect(paymentMethodsFor(MARKETS.HK, "USD")).toEqual(["card", "applepay"]);
  });
});

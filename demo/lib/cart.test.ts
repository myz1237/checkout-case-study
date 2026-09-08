import { describe, expect, it } from "vitest";
import { addToCart, cartTotal, formatMoney, priceCart, setQuantity } from "./cart";

describe("cart", () => {
  it("adds a new line and increments an existing one", () => {
    const once = addToCart([], "moss-silicone");
    expect(once).toEqual([{ productId: "moss-silicone", quantity: 1 }]);
    expect(addToCart(once, "moss-silicone")).toEqual([{ productId: "moss-silicone", quantity: 2 }]);
  });

  it("removes a line when quantity drops to zero and caps at the maximum", () => {
    const lines = [{ productId: "tri-grip", quantity: 2 }];
    expect(setQuantity(lines, "tri-grip", 0)).toEqual([]);
    expect(setQuantity(lines, "tri-grip", 99)[0].quantity).toBe(10);
  });

  it("prices lines in the requested currency and drops unknown products", () => {
    const priced = priceCart(
      [
        { productId: "moss-silicone", quantity: 2 },
        { productId: "does-not-exist", quantity: 1 },
      ],
      "HKD",
    );
    expect(priced).toEqual([
      { productId: "moss-silicone", quantity: 2, name: "Moss Silicone Case", unitPrice: 19900, lineTotal: 39800 },
    ]);
    expect(cartTotal(priced)).toBe(39800);
    expect(priceCart([{ productId: "moss-silicone", quantity: 1 }], "EUR")[0].unitPrice).toBe(2495);
  });

  it("formats minor units as currency", () => {
    expect(formatMoney(19900, "HKD", "en")).toBe("HK$199.00");
    expect(formatMoney(2495, "EUR", "nl")).toMatch(/24,95/);
  });
});

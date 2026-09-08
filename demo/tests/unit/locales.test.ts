import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/cart";
import { intlLocale, resolveLocale } from "@/lib/locales";
import { MARKETS } from "@/lib/markets";

describe("locales", () => {
  it("keeps a stored locale only if the market offers it", () => {
    expect(resolveLocale(MARKETS.HK, "zh-HK")).toBe("zh-HK");
    expect(resolveLocale(MARKETS.HK, "nl")).toBe("en");
    expect(resolveLocale(MARKETS.NL, "en")).toBe("en");
    expect(resolveLocale(MARKETS.NL, undefined)).toBe("nl");
    expect(resolveLocale(MARKETS.NL, "xx")).toBe("nl");
  });

  it("formats prices per locale", () => {
    expect(formatMoney(19900, "HKD", intlLocale("zh-HK"))).toBe("HK$199.00");
    expect(formatMoney(2495, "EUR", intlLocale("nl")).replace(/\u00a0/g, " ")).toBe("€ 24,95");
    expect(formatMoney(2495, "EUR", intlLocale("en"))).toBe("€24.95");
  });
});

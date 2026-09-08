import type { Currency } from "./catalog";

export type MarketId = "HK" | "NL";

/** Flow payment method identifiers we may enable per market. */
export type PaymentMethod = "card" | "applepay" | "ideal";

export type Market = {
  id: MarketId;
  label: string;
  /** ISO 3166-1 alpha-2, used as the billing country on the payment session. */
  country: string;
  currency: Currency;
  /** Locale used for price formatting and as Flow's default language. */
  defaultLocale: string;
  /** Flow languages offered in this market; the first is the default. */
  locales: string[];
  paymentMethods: PaymentMethod[];
};

export const MARKETS: Record<MarketId, Market> = {
  HK: {
    id: "HK",
    label: "Hong Kong",
    country: "HK",
    currency: "HKD",
    defaultLocale: "en",
    locales: ["en", "zh-hk"],
    // Cards plus Apple Pay for the mostly-iPhone audience. No Google Pay by design.
    paymentMethods: ["card", "applepay"],
  },
  NL: {
    id: "NL",
    label: "Netherlands",
    country: "NL",
    currency: "EUR",
    defaultLocale: "nl",
    locales: ["nl", "en"],
    // iDEAL is the dominant Dutch online payment method.
    paymentMethods: ["card", "applepay", "ideal"],
  },
};

export const DEFAULT_MARKET: MarketId = "HK";

export function isMarketId(value: unknown): value is MarketId {
  return value === "HK" || value === "NL";
}

export function getMarket(id: unknown): Market {
  return MARKETS[isMarketId(id) ? id : DEFAULT_MARKET];
}

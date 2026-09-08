import type { Currency } from "./catalog";

export type MarketId = "HK" | "NL";

/** Flow payment method identifiers we may enable per market. */
export type PaymentMethod = "card" | "applepay" | "ideal";

export type Market = {
  id: MarketId;
  label: string;
  country: string;
  currency: Currency;
  defaultLocale: string;
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
    locales: ["en", "zh-HK"],
    paymentMethods: ["card", "applepay"],
  },
  NL: {
    id: "NL",
    label: "Netherlands",
    country: "NL",
    currency: "EUR",
    defaultLocale: "nl",
    locales: ["nl", "en"],
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

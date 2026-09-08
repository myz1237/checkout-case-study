import { type Currency, isCurrency } from "./catalog";

export type MarketId = "HK" | "NL";

/** Flow payment method identifiers we may enable per market. */
export type PaymentMethod = "card" | "applepay" | "ideal";

export type Market = {
  id: MarketId;
  label: string;
  country: string;
  /** Currencies the shopper may pay in; the first is the default. */
  currencies: Currency[];
  defaultLocale: string;
  locales: string[];
  paymentMethods: PaymentMethod[];
};

export const MARKETS: Record<MarketId, Market> = {
  HK: {
    id: "HK",
    label: "Hong Kong",
    country: "HK",
    currencies: ["HKD", "USD"],
    defaultLocale: "en",
    locales: ["en", "zh-HK"],
    paymentMethods: ["card", "applepay"],
  },
  NL: {
    id: "NL",
    label: "Netherlands",
    country: "NL",
    currencies: ["EUR", "USD"],
    defaultLocale: "nl",
    locales: ["nl", "en"],
    paymentMethods: ["card", "ideal"],
  },
};

export const DEFAULT_MARKET: MarketId = "HK";

/** Methods that only settle in specific currencies; anything not listed works in every currency. */
const METHOD_CURRENCIES: Partial<Record<PaymentMethod, Currency[]>> = {
  ideal: ["EUR"],
};

export function isMarketId(value: unknown): value is MarketId {
  return value === "HK" || value === "NL";
}

export function getMarket(id: unknown): Market {
  return MARKETS[isMarketId(id) ? id : DEFAULT_MARKET];
}

/** The stored currency if the market offers it, else the market default. */
export function resolveCurrency(market: Market, stored: unknown): Currency {
  return isCurrency(stored) && market.currencies.includes(stored) ? stored : market.currencies[0];
}

/** The market's payment methods that can take the chosen currency. */
export function paymentMethodsFor(market: Market, currency: Currency): PaymentMethod[] {
  return market.paymentMethods.filter((m) => METHOD_CURRENCIES[m]?.includes(currency) ?? true);
}

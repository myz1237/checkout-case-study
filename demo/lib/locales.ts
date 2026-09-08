import type { Market } from "./markets";

/** Flow locale codes we offer, with their display names and Intl equivalents. */
export const LOCALES = {
  en: { label: "English", intl: "en" },
  "zh-HK": { label: "繁體中文（香港）", intl: "zh-HK" },
  nl: { label: "Nederlands", intl: "nl-NL" },
} as const;

export type LocaleId = keyof typeof LOCALES;

export function isLocaleId(value: unknown): value is LocaleId {
  return typeof value === "string" && value in LOCALES;
}

/** The locale to use for a market: the stored choice if the market offers it, else the market default. */
export function resolveLocale(market: Market, stored: unknown): LocaleId {
  if (isLocaleId(stored) && market.locales.includes(stored)) return stored;
  return market.defaultLocale as LocaleId;
}

export function intlLocale(id: LocaleId): string {
  return LOCALES[id].intl;
}

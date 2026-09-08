import { MAX_QUANTITY, type CartLine } from "./cart";
import type { Customer } from "./customer";
import { isLocaleId, type LocaleId } from "./locales";
import { isMarketId, type MarketId } from "./markets";

/** Runtime shape checks for values that cross a trust boundary (request bodies, Web Storage). */

export function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const { productId, quantity } = value as Record<string, unknown>;
  return (
    typeof productId === "string" &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_QUANTITY
  );
}

export function isCartLines(value: unknown): value is CartLine[] {
  return Array.isArray(value) && value.every(isCartLine);
}

export function isCustomer(value: unknown): value is Customer {
  if (typeof value !== "object" || value === null) return false;
  const { name, email } = value as Record<string, unknown>;
  return typeof name === "string" && typeof email === "string";
}

export type CheckoutState = {
  locked: boolean;
  session: (Record<string, unknown> & { id: string }) | null;
  /** Public key of the account that created `session`; Flow must be initialised with it. */
  publicKey: string | null;
};

export function isCheckoutState(value: unknown): value is CheckoutState {
  if (typeof value !== "object" || value === null) return false;
  const { locked, session, publicKey } = value as Record<string, unknown>;
  if (typeof locked !== "boolean") return false;
  if (session === null) return publicKey === null;
  return (
    typeof session === "object" &&
    session !== null &&
    typeof (session as Record<string, unknown>).id === "string" &&
    typeof publicKey === "string"
  );
}

export const isMarket = (value: unknown): value is MarketId => isMarketId(value);
export const isLocale = (value: unknown): value is LocaleId => isLocaleId(value);
export const isString = (value: unknown): value is string => typeof value === "string";

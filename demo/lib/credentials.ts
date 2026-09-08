import "server-only";
import type { MarketId } from "./markets";

/**
 * One set of Checkout.com credentials = one account / processing channel.
 * Merchants commonly process each region through its own entity, so the
 * storefront resolves credentials per market. The default set serves every
 * market; a market can override it with `CKO_<MARKET>_*` variables.
 */
export type Credentials = {
  /** Which set this is; used to find the right key again on the outcome pages. */
  market: MarketId | "default";
  secretKey: string;
  processingChannelId: string;
  publicKey: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function defaultCredentials(): Credentials {
  return {
    market: "default",
    secretKey: required("CKO_SECRET_KEY"),
    processingChannelId: required("CKO_PROCESSING_CHANNEL_ID"),
    publicKey: required("NEXT_PUBLIC_CKO_PUBLIC_KEY"),
  };
}

function overrideFor(market: MarketId): Credentials | null {
  const names = [`CKO_${market}_SECRET_KEY`, `CKO_${market}_PROCESSING_CHANNEL_ID`, `CKO_${market}_PUBLIC_KEY`];
  const values = names.map((n) => process.env[n]?.trim() ?? "");
  const set = values.filter(Boolean).length;
  if (set === 0) return null;
  if (set !== names.length) {
    throw new Error(`Incomplete credentials for market ${market}: set all of ${names.join(", ")} or none`);
  }
  return { market, secretKey: values[0], processingChannelId: values[1], publicKey: values[2] };
}

export function credentialsFor(market: MarketId): Credentials {
  return overrideFor(market) ?? defaultCredentials();
}

/** Every distinct credential set, default first: used when a payment's market is unknown. */
export function allCredentials(markets: MarketId[]): Credentials[] {
  const sets = [defaultCredentials(), ...markets.map(overrideFor).filter((c): c is Credentials => c !== null)];
  const seen = new Set<string>();
  return sets.filter((c) => (seen.has(c.secretKey) ? false : (seen.add(c.secretKey), true)));
}
